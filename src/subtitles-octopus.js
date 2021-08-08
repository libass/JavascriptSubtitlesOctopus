class SubtitlesOctopus {
  constructor (options = {}) {
    if (!window.Worker) {
      this.workerError('worker not supported')
      return
    }
    // opts
    this.canvas = options.canvas // HTML canvas element (optional if video specified)

    // choose best render mode based on browser support
    this.renderMode = options.renderMode || 'offscreen'
    if (this.renderMode !== 'blend' && this.renderMode !== 'normal') {
      if (typeof createImageBitmap === 'undefined') {
        this.renderMode = 'normal'
      } else if (typeof OffscreenCanvas !== 'undefined') {
        this.renderMode = 'offscreen'
      }
    }

    // play with those when you need some speed, e.g. for slow devices
    this.targetFps = options.targetFps || 23.976
    this.prescaleTradeoff = options.prescaleTradeoff || null // render subtitles less than viewport when less than 1.0 to improve speed, render to more than 1.0 to improve quality; set to null to disable scaling
    this.softHeightLimit = options.softHeightLimit || 1080 // don't apply prescaleTradeoff < 1 when viewport height is less that this limit
    this.hardHeightLimit = options.hardHeightLimit || 2160 // don't ever go above this limit
    this.resizeVariation = options.resizeVariation || 0.2 // by how many a size can vary before it would cause clearance of prerendered buffer

    this.video = options.video // HTML video element (optional if canvas specified)
    this.canvasParent = null // (internal) HTML canvas parent element
    this.onReadyEvent = options.onReady // Function called when SubtitlesOctopus is ready (optional)
    this.onErrorEvent = options.onError // Function called in case of critical error meaning sub wouldn't be shown and you should use alternative method (for instance it occurs if browser doesn't support web workers).
    this.debug = !!options.debug // When debug enabled, some performance info printed in console.
    this.lastRenderTime = 0 // (internal) Last time we got some frame from worker

    this.timeOffset = options.timeOffset || 0 // Time offset would be applied to currentTime from video (option)

    this.renderedItems = [] // used to store items rendered ahead when renderAhead > 0
    // how many MiB to render ahead and store; 0 to disable (approximate)
    this.renderAhead = (options.renderAhead || 0) * 1024 * 1024 * 0.9 // try to eat less than requested
    this.oneshotState = {
      eventStart: null,
      eventOver: false,
      iteration: 0,
      renderRequested: false,
      requestNextTimestamp: -1,
      prevWidth: null,
      prevHeight: null
    }

    this.renderFrameData = null
    this.workerActive = false
    this.frameId = 0
    this.workerActive = false

    // init worker
    if (!this.worker) {
      this.worker = new Worker(options.workerUrl || 'subtitles-octopus-worker.js')
      this.worker.onmessage = event => this.onWorkerMessage(event)
      this.worker.onerror = event => this.workerError(event)
    }

    this.createCanvas()
    this.setVideo(options.video)
    this.worker.postMessage({
      target: 'worker-init',
      width: this.canvas.width,
      height: this.canvas.height,
      URL: document.URL,
      currentScript: options.workerUrl || 'subtitles-octopus-worker.js', // Link to WebAssembly worker
      preMain: true,
      renderMode: this.renderMode,
      subUrl: options.subUrl, // Link to sub file (optional if subContent specified)
      subContent: options.subContent || null, // Sub content (optional if subUrl specified)
      fallbackFont: options.fallbackFont || null, // Override fallback font, for example, with a CJK one. Default fallback font is Liberation Sans
      lazyFontLoading: options.lazyFontLoading || false, // Load fonts in a lazy way. Requires Access-Control-Expose-Headers for Accept-Ranges, Content-Length, and Content-Encoding. If Content-Encoding is compressed, file will be fully fetched instead of just a HEAD request.
      fonts: options.fonts || [], // Array with links to fonts used in sub (optional)
      availableFonts: options.availableFonts || [], // Object with all available fonts (optional). Key is font name in lower case, value is link: {"arial": "/font1.ttf"}
      debug: this.debug,
      targetFps: this.targetFps,
      libassMemoryLimit: options.libassMemoryLimit || 0, // set libass bitmap cache memory limit in MiB (approximate)
      libassGlyphLimit: options.libassGlyphLimit || 0, // set libass glyph cache memory limit in MiB (approximate)
      renderOnDemand: this.renderAhead > 0,
      dropAllAnimations: !!options.dropAllAnimations
    })
    if (this.renderMode === 'offscreen') this.pushOffscreenCanvas()
    this.initDone = true

    // test ImageData constructor
    ;(() => {
      if (typeof ImageData.prototype.constructor === 'function') {
        try {
          // try actually calling ImageData, as on some browsers it's reported
          // as existing but calling it errors out as "TypeError: Illegal constructor"
          return new ImageData(new Uint8ClampedArray([0, 0, 0, 0]), 1, 1)
        } catch (e) {
          console.log('detected that ImageData is not constructable despite browser saying so')
        }
      }

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      window.ImageData = () => {
        let i = 0
        let data
        if (arguments[0] instanceof Uint8ClampedArray) data = arguments[i++]
        const width = arguments[i++]
        const height = arguments[i]

        const imageData = ctx.createImageData(width, height)
        if (data) imageData.data.set(data)
        return imageData
      }
    })()

    // test alpha bug
    if (this.renderMode !== 'offscreen') {
      this.ctx = this.canvas.getContext('2d')
      this.bufferCanvas = document.createElement('canvas')
      this.bufferCanvasCtx = this.bufferCanvas.getContext('2d')

      // test for alpha bug, where e.g. WebKit can render a transparent pixel
      // (with alpha == 0) as non-black which then leads to visual artifacts
      this.bufferCanvas.width = 1
      this.bufferCanvas.height = 1
      const testBuf = new Uint8ClampedArray([0, 255, 0, 0])
      const testImage = new ImageData(testBuf, 1, 1)
      this.bufferCanvasCtx.clearRect(0, 0, 1, 1)
      this.ctx.clearRect(0, 0, 1, 1)
      const prePut = this.ctx.getImageData(0, 0, 1, 1).data
      this.bufferCanvasCtx.putImageData(testImage, 0, 0)
      this.ctx.drawImage(this.bufferCanvas, 0, 0)
      const postPut = this.ctx.getImageData(0, 0, 1, 1).data
      this.hasAlphaBug = prePut[1] !== postPut[1]
      if (this.hasAlphaBug) console.log('Detected a browser having issue with transparent pixels, applying workaround')
    }
  }

  workerError (error) {
    console.error('Worker error: ', error)
    if (this.onErrorEvent) this.onErrorEvent(error)
    if (!this.debug) {
      this.dispose()
      throw new Error('Worker error: ' + error)
    }
  }

  pushOffscreenCanvas () {
    const canvasControl = this.canvas.transferControlToOffscreen()
    this.worker.postMessage({
      target: 'offscreenCanvas',
      canvas: canvasControl
    }, [canvasControl])
  }

  createCanvas () {
    if (this.video) {
      this.canvas = document.createElement('canvas')
      this.canvas.className = 'subtitles-octopus-canvas'
      this.canvas.style.display = 'none'

      this.canvasParent = document.createElement('div')
      this.canvasParent.className = 'subtitles-octopus-canvas-parent'
      this.canvasParent.appendChild(this.canvas)

      if (this.video.nextSibling) {
        this.video.parentNode.insertBefore(this.canvasParent, this.video.nextSibling)
      } else {
        this.video.parentNode.appendChild(this.canvasParent)
      }
    } else {
      if (!this.canvas) {
        this.workerError('Don\'t know where to render: you should give video or canvas in options.')
      }
    }
  }

  setVideo (video) {
    this.video = video
    if (this.video) {
      const timeupdate = () => {
        this.setCurrentTime(video.paused, video.currentTime + this.timeOffset)
      }
      this.video.addEventListener('timeupdate', timeupdate, false)
      this.video.addEventListener('progress', timeupdate, false)

      this.video.addEventListener('pause', timeupdate, false)

      this.video.addEventListener('seeking', () => {
        this.video.removeEventListener('timeupdate', timeupdate)
      }, false)

      this.video.addEventListener('seeked', () => {
        this.video.addEventListener('timeupdate', timeupdate, false)
        this.setCurrentTime(video.currentTime + this.timeOffset)
        if (this.renderAhead > 0) {
          this._cleanPastRendered(video.currentTime + this.timeOffset, true)
        }
      }, false)

      this.video.addEventListener('ratechange', () => {
        this.setRate(video.playbackRate)
      }, false)

      this.video.addEventListener('waiting', timeupdate, false)

      // Support Element Resize Observer
      if (typeof ResizeObserver !== 'undefined') {
        this.ro = new ResizeObserver(() => this.resize())
        this.ro.observe(this.video)
      }

      if (this.video.videoWidth > 0) {
        this.resize()
      } else {
        this.video.addEventListener('loadedmetadata', () => {
          this.resize()
        }, false)
      }
    }
  }

  getVideoPosition () {
    const videoRatio = this.video.videoWidth / this.video.videoHeight
    const { offsetWidth, offsetHeight } = this.video
    const elementRatio = offsetWidth / offsetHeight
    let width = offsetWidth
    let height = offsetHeight
    if (elementRatio > videoRatio) {
      width = Math.floor(offsetHeight * videoRatio)
    } else {
      height = Math.floor(offsetWidth / videoRatio)
    }

    const x = (offsetWidth - width) / 2
    const y = (offsetHeight - height) / 2

    return { width, height, x, y }
  }

  _cleanPastRendered (currentTime, seekClean) {
    let retainedItems = []
    for (const item of this.renderedItems) {
      if (item.emptyFinish < 0 || item.emptyFinish >= currentTime) {
        // item is not yet finished, retain it
        retainedItems.push(item)
      }
    }

    if (seekClean && retainedItems.length > 0) {
      // items are ordered by event start time when we push to this.renderedItems,
      // so first item is the earliest
      if (currentTime < retainedItems[0].eventStart) {
        if (retainedItems[0].eventStart - currentTime > 60) {
          console.info('seeked back too far, cleaning prerender buffer')
          retainedItems = []
        } else {
          console.info('seeked backwards, need to free up some buffer')
          let size = 0; const limit = this.renderAhead * 0.3 /* try to take no more than 1/3 of buffer */
          const retain = []
          for (const item of retainedItems) {
            size += item.size
            if (size >= limit) break
            retain.push(item)
          }
          retainedItems = retain
        }
      }
    }

    const removed = retainedItems.length < this.renderedItems
    this.renderedItems = retainedItems
    return removed
  }

  // Oneshot stuff
  processOneshot (data) {
    if (data.iteration !== this.oneshotState.iteration) {
      console.debug('received stale prerender, ignoring')
      return
    }

    if (this.debug) {
      console.info('oneshot received (start=' +
        data.eventStart + ', empty=' + data.emptyFinish +
        '), render: ' + Math.round(data.spentTime) + ' ms')
    }
    this.oneshotState.renderRequested = false
    if (Math.abs(data.lastRenderedTime - this.oneshotState.requestNextTimestamp) < 0.01) {
      this.oneshotState.requestNextTimestamp = -1
    }
    if (data.eventStart - data.lastRenderedTime > 0.01) {
      // generate bogus empty element, so all timeline is covered anyway
      this.renderedItems.push({
        eventStart: data.lastRenderedTime,
        eventFinish: data.lastRenderedTime - 0.001,
        emptyFinish: data.eventStart,
        viewport: data.viewport,
        spentTime: 0,
        blendTime: 0,
        items: [],
        animated: false,
        size: 0
      })
    }

    const items = []
    let size = 0
    for (const item of data.canvases) {
      items.push({
        ...item,
        image: new ImageData(new Uint8ClampedArray(item.buffer), item.w, item.h)
      })
      size += item.buffer.byteLength
    }

    let eventSplitted = false
    if ((data.emptyFinish > 0 && data.emptyFinish - data.eventStart < 1.0 / this.targetFps) || data.animated) {
      const newFinish = data.eventStart + 1.0 / this.targetFps
      data.emptyFinish = newFinish
      data.eventFinish = newFinish
      eventSplitted = true
    }
    this.renderedItems.push({
      ...data,
      items: items,
      size: size
    })

    this.renderedItems.sort((a, b) => a.eventStart - b.eventStart)

    if (this.oneshotState.requestNextTimestamp >= 0) {
      // requesting an out of order event render
      this.tryRequestOneshot(this.oneshotState.requestNextTimestamp, true)
    } else if (data.eventStart < 0) {
      console.info('oneshot received "end of frames" event')
    } else if (data.emptyFinish >= 0) {
      // there's some more event to render, try requesting next event
      this.tryRequestOneshot(data.emptyFinish, eventSplitted)
    } else {
      console.info('there are no more events to prerender')
    }
  }

  tryRequestOneshot (currentTime, renderNow) {
    if (!this.renderAhead || this.renderAhead <= 0) return
    if (this.oneshotState.renderRequested && !renderNow) return

    if (typeof currentTime === 'undefined') {
      if (!this.video) return
      currentTime = this.video.currentTime + this.timeOffset
    }

    let size = 0
    for (const item of this.renderedItems) {
      if (item.emptyFinish < 0) {
        console.info('oneshot already reached end-of-events')
        return
      }
      if (currentTime >= item.eventStart && currentTime < item.emptyFinish) {
        // an event for requested time already exists
        console.debug('not requesting a render for ' + currentTime +
          ' as event already covering it exists (start=' +
          item.eventStart + ', empty=' + item.emptyFinish + ')')
        return
      }
      size += item.size
    }

    if (size <= this.renderAhead) {
      const lastRendered = currentTime - (renderNow ? 0 : 0.001)
      if (!this.oneshotState.renderRequested) {
        this.oneshotState.renderRequested = true
        this.worker.postMessage({
          target: 'oneshot-render',
          lastRendered: lastRendered,
          renderNow: renderNow,
          iteration: this.oneshotState.iteration
        })
      } else {
        if (this.workerActive) console.info('worker busy, requesting to seek')
        this.oneshotState.requestNextTimestamp = lastRendered
      }
    }
  }

  _renderSubtitleEvent (event, currentTime) {
    const eventOver = event.eventFinish < currentTime
    if (this.oneshotState.eventStart === event.eventStart && this.oneshotState.eventOver === eventOver) return
    this.oneshotState.eventStart = event.eventStart
    this.oneshotState.eventOver = eventOver

    const beforeDrawTime = performance.now()
    if (event.viewport.width !== this.canvas.width || event.viewport.height !== this.canvas.height) {
      this.canvas.width = event.viewport.width
      this.canvas.height = event.viewport.height
    }
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    if (!eventOver) {
      for (const image of event.items) {
        this.bufferCanvas.width = image.w
        this.bufferCanvas.height = image.h
        this.bufferCanvasCtx.putImageData(image.image, 0, 0)
        this.ctx.drawImage(this.bufferCanvas, image.x, image.y)
      }
    }
    if (this.debug) {
      const drawTime = Math.round(performance.now() - beforeDrawTime)
      console.log('render: ' + Math.round(event.spentTime - event.blendTime) + ' ms, blend: ' + Math.round(event.blendTime) + ' ms, draw: ' + drawTime + ' ms')
    }
  }

  oneshotRender () {
    window.requestAnimationFrame(this.oneshotRender)
    if (!this.video) return

    const currentTime = this.video.currentTime + this.timeOffset
    let finishTime = -1; let eventShown = false; let animated = false
    for (const item of this.renderedItems) {
      if (!eventShown && item.eventStart <= currentTime && (item.emptyFinish < 0 || item.emptyFinish > currentTime)) {
        this._renderSubtitleEvent(item, currentTime)
        eventShown = true
        finishTime = item.emptyFinish
      } else if (finishTime >= 0) {
        // we've already found a known event, now find
        // the farthest point of consequent events
        // NOTE: this.renderedItems may have gaps due to seeking
        if (item.eventStart - finishTime < 0.01) {
          finishTime = item.emptyFinish
          animated = item.animated
        } else {
          break
        }
      }
    }

    if (!eventShown) {
      if (Math.abs(this.oneshotState.requestNextTimestamp - currentTime) > 0.01) {
        this._cleanPastRendered(currentTime)
        this.tryRequestOneshot(currentTime, true)
      }
    } else if (this._cleanPastRendered(currentTime) && finishTime >= 0) {
      this.tryRequestOneshot(finishTime, animated)
    }
  }

  resetRenderAheadCache (isResizing) {
    if (this.renderAhead > 0) {
      const newCache = []
      if (isResizing && this.oneshotState.prevHeight && this.oneshotState.prevWidth) {
        if (this.oneshotState.prevHeight === this.canvas.height && this.oneshotState.prevWidth === this.canvas.width) return
        let timeLimit = 10; let sizeLimit = this.renderAhead * 0.3
        if (this.canvas.height >= this.oneshotState.prevHeight * (1.0 - this.resizeVariation) &&
          this.canvas.height <= this.oneshotState.prevHeight * (1.0 + this.resizeVariation) &&
          this.canvas.width >= this.oneshotState.prevWidth * (1.0 - this.resizeVariation) &&
          this.canvas.width <= this.oneshotState.prevWidth * (1.0 + this.resizeVariation)) {
          console.debug('viewport changes are small, leaving more of prerendered buffer')
          timeLimit = 30
          sizeLimit = this.renderAhead * 0.5
        }
        const stopTime = this.video.currentTime + this.timeOffset + timeLimit
        let size = 0
        for (const item of this.renderedItems) {
          if (item.emptyFinish < 0 || item.emptyFinish >= stopTime) break
          size += item.size
          if (size >= sizeLimit) break
          newCache.push(item)
        }
      }

      console.info('resetting prerender cache')
      this.renderedItems = newCache
      this.oneshotState.eventStart = null
      this.oneshotState.iteration++
      this.oneshotState.renderRequested = false
      this.oneshotState.prevHeight = this.canvas.height
      this.oneshotState.prevWidth = this.canvas.width

      window.requestAnimationFrame(this.oneshotRender)
      this.tryRequestOneshot(undefined, true)
    }
  }

  // Rendering
  renderFrames (data) {
    const beforeDrawTime = performance.now()
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    for (const image of data.canvases) {
      this.bufferCanvas.width = image.w
      this.bufferCanvas.height = image.h
      const imageBuffer = new Uint8ClampedArray(image.buffer)
      if (this.hasAlphaBug) {
        for (let j = 3; j < imageBuffer.length; j += 4) {
          imageBuffer[j] = (imageBuffer[j] >= 1) ? imageBuffer[j] : 1
        }
      }
      const imageData = new ImageData(imageBuffer, image.w, image.h)
      this.bufferCanvasCtx.putImageData(imageData, 0, 0)
      this.ctx.drawImage(this.bufferCanvas, image.x, image.y)
    }
    if (this.debug) {
      const drawTime = performance.now() - beforeDrawTime
      const blendTime = data.blendTime
      if (typeof blendTime !== 'undefined') {
        console.log('render: ' + Math.round(data.spentTime - blendTime) + ' ms, blend: ' + Math.round(blendTime) + ' ms, draw: ' + drawTime + ' ms; TOTAL=' + Math.round(data.spentTime + drawTime) + ' ms')
      } else {
        console.log({ length: data.canvases.length, sum: data.libassTime + data.decodeTime + drawTime, libassTime: data.libassTime, decodeTime: data.decodeTime, drawTime })
      }
      this.renderStart = performance.now()
    }
  }

  renderFastFrames (data) {
    const beforeDrawTime = performance.now()
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    for (const image of data.bitmaps) {
      this.ctx.drawImage(image.bitmap, image.x, image.y)
    }
    if (this.debug) {
      const drawTime = performance.now() - beforeDrawTime
      console.log({ length: data.bitmaps.length, sum: data.libassTime + data.decodeTime + drawTime, libassTime: data.libassTime, decodeTime: data.decodeTime, drawTime })
      this.renderStart = performance.now()
    }
  }

  _computeCanvasSize (width, height) {
    if (this.prescaleTradeoff === null) {
      if (height > this.hardHeightLimit) {
        width = width * this.hardHeightLimit / height
        height = this.hardHeightLimit
      }
    } else if (this.prescaleTradeoff > 1) {
      if (height * this.prescaleTradeoff <= this.softHeightLimit) {
        width *= this.prescaleTradeoff
        height *= this.prescaleTradeoff
      } else if (height < this.softHeightLimit) {
        width = width * this.softHeightLimit / height
        height = this.softHeightLimit
      } else if (height >= this.hardHeightLimit) {
        width = width * this.hardHeightLimit / height
        height = this.hardHeightLimit
      }
    } else if (height >= this.softHeightLimit) {
      if (height * this.prescaleTradeoff <= this.softHeightLimit) {
        width = width * this.softHeightLimit / height
        height = this.softHeightLimit
      } else if (height * this.prescaleTradeoff <= this.hardHeightLimit) {
        width *= this.prescaleTradeoff
        height *= this.prescaleTradeoff
      } else {
        width = width * this.hardHeightLimit / height
        height = this.hardHeightLimit
      }
    }

    return { width, height }
  }

  resize (width = 0, height = 0, top = 0, left = 0) {
    let videoSize = null
    if ((!width || !height) && this.video) {
      videoSize = this.getVideoPosition()
      const newsize = this._computeCanvasSize(videoSize.width * (window.devicePixelRatio || 1), videoSize.height * (window.devicePixelRatio || 1))
      width = newsize.width
      height = newsize.height
      const offset = this.canvasParent.getBoundingClientRect().top - this.video.getBoundingClientRect().top
      top = videoSize.y - offset
      left = videoSize.x
    }

    if (this.canvas.style.top !== top || this.canvas.style.left !== left) {
      if (videoSize != null) {
        this.canvasParent.style.position = 'relative'
        this.canvas.style.display = 'block'
        this.canvas.style.position = 'absolute'
        this.canvas.style.top = top + 'px'
        this.canvas.style.left = left + 'px'
        this.canvas.style.pointerEvents = 'none'
      }
      if (!(this.canvas.width === width && this.canvas.height === height)) {
        // only re-paint if dimensions actually changed
        if (this.renderMode === 'offscreen' && this.initDone) {
          this.canvasParent.remove()
          this.canvasParent = undefined
          this.createCanvas()
        }
        // dont spam re-paints like crazy when re-sizing with animations, but still update instantly without them
        if (this.resizeTimeoutBuffer) {
          clearTimeout(this.resizeTimeoutBuffer)
          this.resizeTimeoutBuffer = setTimeout(() => {
            this.resizeTimeoutBuffer = undefined
            this.rePaint(width, height, top, left, videoSize)
          }, 50)
        } else {
          this.rePaint(width, height, top, left, videoSize)
          this.resizeTimeoutBuffer = setTimeout(() => {
            this.resizeTimeoutBuffer = undefined
          }, 50)
        }
      }
    }
  }

  rePaint (width = 0, height = 0, top = 0, left = 0, videoSize) {
    if (this.renderMode === 'offscreen' && this.canvasParent && this.initDone) {
      this.canvasParent.remove()
      this.canvasParent = undefined
      this.createCanvas()
    }
    this.canvas.width = width
    this.canvas.height = height

    if (videoSize != null) {
      this.canvasParent.style.position = 'relative'
      this.canvas.style.display = 'block'
      this.canvas.style.position = 'absolute'
      this.canvas.style.top = top + 'px'
      this.canvas.style.left = left + 'px'
      this.canvas.style.pointerEvents = 'none'
    }

    if (this.renderMode === 'offscreen' && this.initDone) {
      this.pushOffscreenCanvas()
    }
    this.worker.postMessage({
      target: 'canvas',
      width: this.canvas.width,
      height: this.canvas.height
    })
    this.resetRenderAheadCache(true)
  }

  onWorkerMessage (event) {
    if (!this.workerActive) {
      this.workerActive = true
      if (this.onReadyEvent) {
        this.onReadyEvent()
      }
    }
    const data = event.data
    switch (data.target) {
      case 'stdout': {
        console.log(data.content)
        break
      }
      case 'stderr': {
        console.error(data.content)
        break
      }
      case 'canvas': {
        switch (data.op) {
          case 'renderCanvas': {
            if (this.lastRenderTime < data.time) {
              this.lastRenderTime = data.time
              window.requestAnimationFrame(() => this.renderFrames(data))
            }
            break
          }
          case 'renderFastCanvas': {
            if (this.lastRenderTime < data.time) {
              this.lastRenderTime = data.time
              window.requestAnimationFrame(() => this.renderFastFrames(data))
            }
            break
          }
          case 'oneshot-result': {
            this.processOneshot(data)
            break
          }
          default:
            throw data.target
        }
        break
      }
      case 'tick': {
        this.frameId = data.id
        this.worker.postMessage({
          target: 'tock',
          id: this.frameId
        })
        break
      }
      case 'custom': {
        if (this.onCustomMessage) {
          this.onCustomMessage(event)
        } else {
          console.error('Custom message received but client onCustomMessage not implemented.')
        }
        break
      }
      case 'ready': {
        break
      }
      default:
        console.log(data)
        break
    }
  }

  runBenchmark () {
    this.worker.postMessage({
      target: 'runBenchmark'
    })
  }

  customMessage (data, options = {}) {
    this.worker.postMessage({
      target: 'custom',
      userData: data,
      preMain: options.preMain
    })
  }

  setCurrentTime (isPaused, currentTime) {
    this.worker.postMessage({
      target: 'video',
      isPaused: isPaused,
      currentTime: currentTime
    })
  }

  setTrackByUrl (url) {
    this.worker.postMessage({
      target: 'set-track-by-url',
      url: url
    })
    this.resetRenderAheadCache(false)
  }

  setTrack (content) {
    this.worker.postMessage({
      target: 'set-track',
      content: content
    })
    this.resetRenderAheadCache(false)
  }

  freeTrack () {
    this.worker.postMessage({
      target: 'free-track'
    })
    this.resetRenderAheadCache(false)
  }

  setRate (rate) {
    this.worker.postMessage({
      target: 'video',
      rate: rate
    })
  }

  dispose () {
    this.worker.postMessage({
      target: 'destroy'
    })

    this.worker.terminate()
    this.workerActive = false
    // Remove the canvas element to remove residual subtitles rendered on player
    if (this.video) this.video.parentNode.removeChild(this.canvasParent)
  }

  createEvent (event) {
    this.worker.postMessage({
      target: 'create-event',
      event: event
    })
  }

  getEvents () {
    this.worker.postMessage({
      target: 'get-events'
    })
  }

  setEvent (event, index) {
    this.worker.postMessage({
      target: 'set-event',
      event: event,
      index: index
    })
  }

  removeEvent (index) {
    this.worker.postMessage({
      target: 'remove-event',
      index: index
    })
  }

  createStyle (style) {
    this.worker.postMessage({
      target: 'create-style',
      style: style
    })
  }

  getStyles () {
    this.worker.postMessage({
      target: 'get-styles'
    })
  }

  setStyle (style, index) {
    this.worker.postMessage({
      target: 'set-style',
      style: style,
      index: index
    })
  }

  removeStyle (index) {
    this.worker.postMessage({
      target: 'remove-style',
      index: index
    })
  }
}

if (typeof module !== 'undefined') {
  module.exports = SubtitlesOctopus
}
