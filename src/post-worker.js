/* globals Module, FS, SDL */
Module.FS = FS

self.delay = 0 // approximate delay (time of render + postMessage + drawImage), for example 1/60 or 0
self.lastCurrentTime = 0
self.rate = 1
self.rafId = null
self.nextIsRaf = false
self.lastCurrentTimeReceivedAt = Date.now()
self.targetFps = 23.976
self.libassMemoryLimit = 0 // in MiB
self.renderOnDemand = false // determines if only rendering on demand
self.dropAllAnimations = false // set to true to enable "lite mode" with all animations disabled for speed

self.width = 0
self.height = 0

self.fontMap_ = {}
self.fontId = 0

/**
 * Required as only Chromium decodes data URI from XHR
 * @param dataURI
 * @returns {Uint8Array}
 */
self.readDataUri = (dataURI) => {
  if (typeof dataURI !== 'string') throw new Error('Invalid argument: dataURI must be a string')
  dataURI = dataURI.split(',')
  const byteString = atob(dataURI[1])
  const byteStringLength = byteString.length
  const arrayBuffer = new ArrayBuffer(byteStringLength)
  const intArray = new Uint8Array(arrayBuffer)
  for (let i = 0; i < byteStringLength; i++) {
    intArray[i] = byteString.charCodeAt(i)
  }
  return intArray
}

self.decodeASSFontEncoding = (input) => {
  const output = new Uint8Array(input.length)
  const grouping = new Uint8Array(4)

  let offset = 0
  let arrayOffset = 0
  let writeOffset = 0
  let charCode
  while (offset < input.length) {
    charCode = input.charCodeAt(offset++)
    if (charCode >= 0x21 && charCode <= 0x60) { // TODO: optimise
      grouping[arrayOffset++] = charCode - 33
      if (arrayOffset === 4) {
        output[writeOffset++] = (grouping[0] << 2) | (grouping[1] >> 4)
        output[writeOffset++] = ((grouping[1] & 0xf) << 4) | (grouping[2] >> 2)
        output[writeOffset++] = ((grouping[2] & 0x3) << 6) | (grouping[3])
        arrayOffset = 0
      }
    }
  }

  // Handle ASS special padding
  if (arrayOffset > 0) {
    if (arrayOffset === 2) {
      output[writeOffset++] = ((grouping[0] << 6) | grouping[1]) >> 4
    } else if (arrayOffset === 3) { // TODO: optimise
      const ix = ((grouping[0] << 12) | (grouping[1] << 6) | grouping[2]) >> 2
      output[writeOffset++] = ix >> 8
      output[writeOffset++] = ix & 0xff
    }
  }

  return output.slice(0, writeOffset)
}

/**
 * Make the font accessible by libass by writing it to the virtual FS.
 * @param {!string} font the font name.
 */
self.writeFontToFS = (font) => {
  font = font.trim().toLowerCase()

  if (font.startsWith('@')) font = font.substr(1)

  if (self.fontMap_[font]) return

  self.fontMap_[font] = true

  if (self.availableFonts[font]) {
    const path = self.availableFonts[font]
    Module[(self.lazyFontLoading && path.indexOf('blob:') !== 0) ? 'FS_createLazyFile' : 'FS_createPreloadedFile']('/fonts', 'font' + (self.fontId++) + '-' + path.split('/').pop(), path, true, false)
  }
}

/**
 * Write all font's mentioned in the .ass file to the virtual FS.
 * @param {!string} content the file content.
 */
self.writeAvailableFontsToFS = (content) => {
  if (!self.availableFonts) return

  for (const selection of parseAss(content)) {
    for (const key of selection.body) {
      if (key === 'Style') self.writeFontToFS(key.value.Fontname)
    }
  }

  const regex = /\\fn([^\\}]*?)[\\}]/g
  let matches
  while ((matches = regex.exec(self.subContent)) !== null) self.writeFontToFS(matches[1])
}

self.getRenderMethod = () => {
  switch (self.renderMode) {
    case 'fast':
      return self.fastRender
    case 'blend':
      return self.blendRender
    case 'offscreen':
      return self.offscreenRender
    default:
      return self.render
  }
}

/**
 * Set the subtitle track.
 * @param {!string} content the content of the subtitle file.
 */
self.setTrack = (content) => {
  // Make sure that the fonts are loaded
  self.writeAvailableFontsToFS(content)

  // Write the subtitle file to the virtual FS.
  Module.FS.writeFile('/sub.ass', content)

  // Tell libass to render the new track
  self.octObj.createTrack('/sub.ass')
  self.ass_track = self.octObj.track
  if (!self.renderOnDemand) self.getRenderMethod()()
}

/**
 * Remove subtitle track.
 */
self.freeTrack = () => {
  self.octObj.removeTrack()
  if (!self.renderOnDemand) self.getRenderMethod()()
}

/**
 * Set the subtitle track.
 * @param {!string} url the URL of the subtitle file.
 */
self.setTrackByUrl = (url) => {
  const content = read_(url)
  self.setTrack(content)
}

self.resize = (width, height) => {
  self.width = width
  self.height = height
  self.octObj.resizeCanvas(width, height)
}

self.getCurrentTime = () => {
  const diff = (Date.now() - self.lastCurrentTimeReceivedAt) / 1000
  if (self._isPaused) return self.lastCurrentTime
  if (diff > 5) {
    console.error('Didn\'t received currentTime > 5 seconds. Assuming video was paused.')
    self.setIsPaused(true)
  }
  return self.lastCurrentTime + (diff * self.rate)
}
self.setCurrentTime = (currentTime) => {
  self.lastCurrentTime = currentTime
  self.lastCurrentTimeReceivedAt = Date.now()
  if (!self.rafId) {
    if (self.nextIsRaf) {
      if (!self.renderOnDemand) self.rafId = self.requestAnimationFrame(self.getRenderMethod())
    } else {
      if (!self.renderOnDemand) self.getRenderMethod()()

      // Give onmessage chance to receive all queued messages
      setTimeout(() => {
        self.nextIsRaf = false
      }, 20)
    }
  }
}

self._isPaused = true
self.getIsPaused = () => {
  return self._isPaused
}
self.setIsPaused = (isPaused) => {
  if (isPaused !== self._isPaused) {
    self._isPaused = isPaused
    if (isPaused) {
      if (self.rafId) {
        clearTimeout(self.rafId)
        self.rafId = null
      }
    } else {
      self.lastCurrentTimeReceivedAt = Date.now()
      if (!self.renderOnDemand) self.rafId = self.requestAnimationFrame(self.getRenderMethod())
    }
  }
}

self.blendRenderTiming = (timing, force) => {
  const startTime = performance.now()

  const renderResult = self.octObj.renderBlend(timing, force)
  const blendTime = renderResult.blend_time
  const canvases = []
  const buffers = []
  if (renderResult.ptr !== 0 && (renderResult.changed !== 0 || force)) {
    // make a copy, as we should free the memory so subsequent calls can utilize it
    for (let part = renderResult.part; part.ptr !== 0; part = part.next) {
      const result = new Uint8Array(HEAPU8.subarray(part.image, part.image + part.dest_width * part.dest_height * 4))
      canvases.push({ w: part.dest_width, h: part.dest_height, x: part.dest_x, y: part.dest_y, buffer: result.buffer })
      buffers.push(result.buffer)
    }
  }

  return {
    time: Date.now(),
    spentTime: performance.now() - startTime,
    blendTime: blendTime,
    canvases: canvases,
    buffers: buffers
  }
}

self.blendRender = (force) => {
  self.rafId = 0
  self.renderPending = false

  const rendered = self.blendRenderTiming(self.getCurrentTime() + self.delay, force)
  if (rendered.canvases.length > 0) {
    postMessage({
      target: 'canvas',
      op: 'renderCanvas',
      time: rendered.time,
      spentTime: rendered.spentTime,
      blendTime: rendered.blendTime,
      canvases: rendered.canvases
    }, rendered.buffers)
  }

  if (!self._isPaused) self.rafId = self.requestAnimationFrame(self.blendRender)
}

self.oneshotRender = (lastRenderedTime, renderNow, iteration) => {
  const eventStart = renderNow ? lastRenderedTime : self.octObj.findNextEventStart(lastRenderedTime)
  let eventFinish = -1.0
  let emptyFinish = -1.0
  let animated = false
  let rendered = {}
  if (eventStart >= 0) {
    const eventTimes = self.octObj.findEventStopTimes(eventStart)
    eventFinish = eventTimes.eventFinish
    emptyFinish = eventTimes.emptyFinish
    animated = eventTimes.is_animated

    rendered = self.blendRenderTiming(eventStart, true)
  }

  postMessage({
    target: 'canvas',
    op: 'oneshot-result',
    iteration: iteration,
    lastRenderedTime: lastRenderedTime,
    eventStart: eventStart,
    eventFinish: eventFinish,
    emptyFinish: emptyFinish,
    animated: animated,
    viewport: {
      width: self.width,
      height: self.height
    },
    spentTime: rendered.spentTime || 0,
    blendTime: rendered.blendTime || 0,
    canvases: rendered.canvases || []
  }, rendered.buffers || [])
}

self.render = (force) => {
  self.rafId = 0
  self.renderPending = false
  const startTime = performance.now()
  const renderResult = self.octObj.renderImage(self.getCurrentTime() + self.delay, self.changed)
  const changed = Module.getValue(self.changed, 'i32')
  if (changed !== 0 || force) {
    const newTime = performance.now()
    const libassTime = newTime - startTime
    const result = self.buildResult(renderResult)
    const decodeTime = performance.now() - newTime
    postMessage({
      target: 'canvas',
      op: 'renderCanvas',
      time: Date.now(),
      libassTime,
      decodeTime,
      canvases: result[0]
    }, result[1])
  }

  if (!self._isPaused) self.rafId = self.requestAnimationFrame(self.render)
}

self.fastRender = (force) => {
  self.rafId = 0
  self.renderPending = false
  const startTime = performance.now()
  const result = self.octObj.renderImage(self.getCurrentTime() + self.delay, self.changed)
  const changed = Module.getValue(self.changed, 'i32')
  if (Number(changed) !== 0 || force) {
    const newTime = performance.now()
    const libassTime = newTime - startTime
    const images = self.buildResultImage(result)
    const promises = []
    for (const item of images) {
      promises.push(createImageBitmap(item.image))
    }
    Promise.all(promises).then(bitmaps => {
      const decodeTime = performance.now() - newTime
      const imgs = []
      for (let i = 0; i < bitmaps.length; i++) {
        imgs.push({ x: images[i].x, y: images[i].y, bitmap: bitmaps[i] })
      }
      postMessage({
        target: 'canvas',
        op: 'renderFastCanvas',
        time: Date.now(),
        libassTime: libassTime,
        decodeTime: decodeTime,
        bitmaps: imgs
      }, bitmaps)
    })
  }
  if (!self._isPaused) self.rafId = self.requestAnimationFrame(self.fastRender)
}

self.offscreenRender = (force) => {
  self.rafId = 0
  self.renderPending = false
  const startTime = performance.now()
  const result = self.octObj.renderImage(self.getCurrentTime() + self.delay, self.changed)
  const changed = Module.getValue(self.changed, 'i32')
  if ((Number(changed) !== 0 || force) && self.offscreenCanvas) {
    const newTime = performance.now()
    const libassTime = newTime - startTime
    const images = self.buildResultImage(result)
    const promises = []
    for (const item of images) {
      promises.push(createImageBitmap(item.image))
    }
    Promise.all(promises).then(bitmaps => {
      const decodeTime = performance.now() - newTime
      const preDraw = performance.now()
      self.offscreenCanvasCtx.clearRect(0, 0, self.offscreenCanvas.width, self.offscreenCanvas.height)
      for (let i = 0; i < bitmaps.length; i++) {
        self.offscreenCanvasCtx.drawImage(
          bitmaps[i],
          images[i].x,
          images[i].y
        )
      }
      const drawTime = performance.now() - preDraw
      if (this.debug) console.log({ length: bitmaps.length, sum: libassTime + decodeTime + drawTime, libassTime, decodeTime, drawTime })
    })
  }
  if (!self._isPaused) self.rafId = self.requestAnimationFrame(self.offscreenRender)
}

self.buildResultImage = (ptr) => {
  const items = []
  let item
  while (Number(ptr.ptr) !== 0) {
    item = self.buildResultImageItem(ptr)
    if (item !== null) {
      items.push(item)
    }
    ptr = ptr.next
  }
  return items
}
self.buildResultImageItem = (ptr) => {
  const bitmap = ptr.bitmap
  const stride = ptr.stride
  const w = ptr.w
  const h = ptr.h
  const color = ptr.color
  if (w === 0 || h === 0) return null
  const a = (255 - (color & 255)) / 255
  if (a === 0) return null
  const c = ((color << 8) & 0xff0000) | ((color >> 8) & 0xff00) | ((color >> 24) & 0xff) // black magic
  const buf = new ArrayBuffer(w * h * 4)
  const buf8 = new Uint8ClampedArray(buf)
  const data = new Uint32Array(buf) // operate on a single position, instead of 4 positions at once
  let bitmapPosition = 0
  let resultPosition = 0
  for (let y = h; y--; bitmapPosition += stride) {
    const offset = bitmap + bitmapPosition
    for (let x = 0, z = w; z--; ++x, resultPosition++) {
      const k = Module.HEAPU8[offset + x]
      if (k !== 0) data[resultPosition] = ((a * k) << 24) | c // more black magic
    }
  }
  const image = new ImageData(buf8, w, h)
  const x = ptr.dst_x
  const y = ptr.dst_y
  return { image, x, y }
}

self.buildResult = (ptr) => {
  const items = []
  const transferable = []
  let item

  while (ptr.ptr !== 0) {
    item = self.buildResultItem(ptr)
    if (item !== null) {
      items.push(item)
      transferable.push(item.buffer)
    }
    ptr = ptr.next
  }

  return [items, transferable]
}

self.buildResultItem = (ptr) => {
  const bitmap = ptr.bitmap
  const stride = ptr.stride
  const w = ptr.w
  const h = ptr.h
  const color = ptr.color
  if (w === 0 || h === 0) return null
  const a = (255 - (color & 255)) / 255
  if (a === 0) return null
  const c = ((color << 8) & 0xff0000) | ((color >> 8) & 0xff00) | ((color >> 24) & 0xff) // black magic
  const buffer = new ArrayBuffer(w * h * 4)
  const data = new Uint32Array(buffer) // operate on a single position, instead of 4 positions at once
  let bitmapPosition = 0
  let resultPosition = 0
  for (let y = h; y--; bitmapPosition += stride) {
    const offset = bitmap + bitmapPosition
    for (let x = 0, z = w; z--; ++x, resultPosition++) {
      const k = Module.HEAPU8[offset + x]
      if (k !== 0) data[resultPosition] = ((a * k) << 24) | c // more black magic
    }
  }
  const x = ptr.dst_x
  const y = ptr.dst_y

  return { w, h, x, y, buffer }
}

if (typeof SDL !== 'undefined') {
  SDL.defaults.copyOnLock = false
  SDL.defaults.discardOnLock = false
  SDL.defaults.opaqueFrontBuffer = false
}

/**
 * Parse the content of an .ass file.
 * @param {!string} content the content of the file
 */
function parseAss (content) {
  let m, format, lastPart, parts, key, value, tmp, i, j, body
  const sections = []
  const lines = content.split(/[\r\n]+/g)
  for (i = 0; i < lines.length; i++) {
    m = lines[i].match(/^\[(.*)\]$/)
    if (m) {
      format = null
      sections.push({
        name: m[1],
        body: []
      })
    } else {
      if (/^\s*$/.test(lines[i])) continue
      if (sections.length === 0) continue
      body = sections[sections.length - 1].body
      if (lines[i][0] === ';') {
        body.push({
          type: 'comment',
          value: lines[i].substring(1)
        })
      } else {
        parts = lines[i].split(':')
        key = parts[0]
        value = parts.slice(1).join(':').trim()
        if (format || key === 'Format') {
          value = value.split(',')
          if (format && value.length > format.length) {
            lastPart = value.slice(format.length - 1).join(',')
            value = value.slice(0, format.length - 1)
            value.push(lastPart)
          }
          value = value.map(s => s.trim())
          if (format) {
            tmp = {}
            for (j = 0; j < value.length; j++) {
              tmp[format[j]] = value[j]
            }
            value = tmp
          }
        }
        if (key === 'Format') {
          format = value
        }
        body.push({
          key: key,
          value: value
        })
      }
    }
  }

  return sections
};

self.requestAnimationFrame = (() => {
  // similar to Browser.requestAnimationFrame
  let nextRAF = 0
  return func => {
    // try to keep target fps (30fps) between calls to here
    const now = Date.now()
    if (nextRAF === 0) {
      nextRAF = now + 1000 / self.targetFps
    } else {
      while (now + 2 >= nextRAF) { // fudge a little, to avoid timer jitter causing us to do lots of delay:0
        nextRAF += 1000 / self.targetFps
      }
    }
    const delay = Math.max(nextRAF - now, 0)
    return setTimeout(func, delay)
    // return setTimeout(func, 1);
  }
})()

const screen = {
  width: 0,
  height: 0
}

Module.print = function Module_print (x) {
  // dump('OUT: ' + x + '\n');
  postMessage({ target: 'stdout', content: x })
}
Module.printErr = function Module_printErr (x) {
  // dump('ERR: ' + x + '\n');
  postMessage({ target: 'stderr', content: x })
}

// Frame throttling

let frameId = 0
let clientFrameId = 0
let commandBuffer = []

const postMainLoop = Module.postMainLoop
Module.postMainLoop = () => {
  if (postMainLoop) postMainLoop()
  // frame complete, send a frame id
  postMessage({ target: 'tick', id: frameId++ })
  commandBuffer = []
}

// Wait to start running until we receive some info from the client
// addRunDependency('gl-prefetch');
addRunDependency('worker-init')

// buffer messages until the program starts to run

let messageBuffer = null
let messageResenderTimeout = null

function messageResender () {
  if (calledMain) {
    assert(messageBuffer && messageBuffer.length > 0)
    messageResenderTimeout = null
    messageBuffer.forEach(message => {
      onmessage(message)
    })
    messageBuffer = null
  } else {
    messageResenderTimeout = setTimeout(messageResender, 50)
  }
}

function _applyKeys (input, output) {
  const vargs = Object.keys(input)

  for (const varg of vargs) {
    output[varg] = input[varg]
  }
}

function onMessageFromMainEmscriptenThread (message) {
  if (!calledMain && !message.data.preMain) {
    if (!messageBuffer) {
      messageBuffer = []
      messageResenderTimeout = setTimeout(messageResender, 50)
    }
    messageBuffer.push(message)
    return
  }
  if (calledMain && messageResenderTimeout) {
    clearTimeout(messageResenderTimeout)
    messageResender()
  }
  // console.log('worker got ' + JSON.stringify(message.data).substr(0, 150) + '\n');
  switch (message.data.target) {
    case 'canvas': {
      if (message.data.event) {
        Module.canvas.fireEvent(message.data.event)
      } else if (message.data.width) {
        if (Module.canvas && message.data.boundingClientRect) {
          Module.canvas.boundingClientRect = message.data.boundingClientRect
        }
        self.resize(message.data.width, message.data.height)
        if (!self.renderOnDemand) {
          self.getRenderMethod()()
        }
      } else throw new Error('ey?')
      break
    }
    case 'offscreenCanvas': {
      self.offscreenCanvas = message.data.canvas
      self.offscreenCanvasCtx = self.offscreenCanvas.getContext('2d')
      break
    }
    case 'video': {
      if (message.data.currentTime !== undefined) {
        self.setCurrentTime(message.data.currentTime)
      }
      if (message.data.isPaused !== undefined) {
        self.setIsPaused(message.data.isPaused)
      }
      if (message.data.rate) {
        self.rate = message.data.rate
      }
      break
    }
    case 'tock': {
      clientFrameId = message.data.id
      break
    }
    case 'worker-init': {
      // Module.canvas = document.createElement('canvas');
      screen.width = self.width = message.data.width
      screen.height = self.height = message.data.height
      self.subUrl = message.data.subUrl
      self.subContent = message.data.subContent
      self.fontFiles = message.data.fonts
      self.renderMode = message.data.renderMode
      self.availableFonts = message.data.availableFonts
      self.fallbackFont = message.data.fallbackFont
      self.debug = message.data.debug
      if (Module.canvas) {
        Module.canvas.width_ = message.data.width
        Module.canvas.height_ = message.data.height
        if (message.data.boundingClientRect) {
          Module.canvas.boundingClientRect = message.data.boundingClientRect
        }
      }
      self.targetFps = message.data.targetFps
      self.libassMemoryLimit = message.data.libassMemoryLimit
      self.libassGlyphLimit = message.data.libassGlyphLimit
      self.renderOnDemand = message.data.renderOnDemand || false
      self.dropAllAnimations = message.data.dropAllAnimations
      removeRunDependency('worker-init')
      postMessage({
        target: 'ready'
      })
      break
    }
    case 'oneshot-render':
      self.oneshotRender(
        message.data.lastRendered,
        message.data.renderNow || false,
        message.data.iteration
      )
      break
    case 'destroy':
      self.octObj.quitLibrary()
      break
    case 'free-track':
      self.freeTrack()
      break
    case 'set-track':
      self.setTrack(message.data.content)
      break
    case 'set-track-by-url':
      self.setTrackByUrl(message.data.url)
      break
    case 'create-event': {
      const event = message.data.event
      const vargs = Object.keys(event)
      const evntPtr = self.octObj.track.get_events(self.octObj.allocEvent())

      for (const varg of vargs) {
        evntPtr[varg] = event[varg]
      }
      break
    }
    case 'get-events': {
      const events = []
      for (let i = 0; i < self.octObj.getEventCount(); i++) {
        const evntPtr = self.octObj.track.get_events(i)
        const event = {
          Start: evntPtr.get_Start(),
          Duration: evntPtr.get_Duration(),
          ReadOrder: evntPtr.get_ReadOrder(),
          Layer: evntPtr.get_Layer(),
          Style: evntPtr.get_Style(),
          Name: evntPtr.get_Name(),
          MarginL: evntPtr.get_MarginL(),
          MarginR: evntPtr.get_MarginR(),
          MarginV: evntPtr.get_MarginV(),
          Effect: evntPtr.get_Effect(),
          Text: evntPtr.get_Text()
        }

        events.push(event)
      }
      postMessage({
        target: 'get-events',
        time: Date.now(),
        events: events
      })
      break
    }
    case 'set-event': {
      const event = message.data.event
      const evntPtr = self.octObj.track.get_events(message.data.index)
      _applyKeys(event, evntPtr)
      break
    }
    case 'remove-event':
      self.octObj.removeEvent(message.data.index)
      break
    case 'create-style': {
      const style = message.data.style
      const stylPtr = self.octObj.track.get_styles(self.octObj.allocStyle())
      _applyKeys(style, stylPtr)
      break
    }
    case 'get-styles': {
      const styles = []
      for (let i = 0; i < self.octObj.getStyleCount(); i++) {
        const stylPtr = self.octObj.track.get_styles(i)
        const style = {
          Name: stylPtr.get_Name(),
          FontName: stylPtr.get_FontName(),
          FontSize: stylPtr.get_FontSize(),
          PrimaryColour: stylPtr.get_PrimaryColour(),
          SecondaryColour: stylPtr.get_SecondaryColour(),
          OutlineColour: stylPtr.get_OutlineColour(),
          BackColour: stylPtr.get_BackColour(),
          Bold: stylPtr.get_Bold(),
          Italic: stylPtr.get_Italic(),
          Underline: stylPtr.get_Underline(),
          StrikeOut: stylPtr.get_StrikeOut(),
          ScaleX: stylPtr.get_ScaleX(),
          ScaleY: stylPtr.get_ScaleY(),
          Spacing: stylPtr.get_Spacing(),
          Angle: stylPtr.get_Angle(),
          BorderStyle: stylPtr.get_BorderStyle(),
          Outline: stylPtr.get_Outline(),
          Shadow: stylPtr.get_Shadow(),
          Alignment: stylPtr.get_Alignment(),
          MarginL: stylPtr.get_MarginL(),
          MarginR: stylPtr.get_MarginR(),
          MarginV: stylPtr.get_MarginV(),
          Encoding: stylPtr.get_Encoding(),
          treat_fontname_as_pattern: stylPtr.get_treat_fontname_as_pattern(),
          Blur: stylPtr.get_Blur(),
          Justify: stylPtr.get_Justify()
        }
        styles.push(style)
      }
      postMessage({
        target: 'get-styles',
        time: Date.now(),
        styles: styles
      })
      break
    }
    case 'set-style': {
      const style = message.data.style
      const stylPtr = self.octObj.track.get_styles(message.data.index)
      _applyKeys(style, stylPtr)
      break
    }
    case 'remove-style':
      self.octObj.removeStyle(message.data.index)
      break
    case 'runBenchmark': {
      self.runBenchmark()
      break
    }
    case 'custom': {
      if (Module.onCustomMessage) {
        Module.onCustomMessage(message)
      } else {
        console.error('Custom message received but worker Module.onCustomMessage not implemented.')
      }
      break
    }
    default:
      throw new Error('wha? ' + message.data.target)
  }
}

onmessage = onMessageFromMainEmscriptenThread

self.runBenchmark = (seconds, pos, async) => {
  let totalTime = 0
  let i = 0
  pos = pos || 0
  seconds = seconds || 60
  const count = seconds * self.targetFps
  const start = performance.now()
  let longestFrame = 0
  const run = () => {
    const t0 = performance.now()

    pos += 1 / self.targetFps
    self.setCurrentTime(pos)

    const t1 = performance.now()
    const diff = t1 - t0
    totalTime += diff
    if (diff > longestFrame) longestFrame = diff

    if (i < count) {
      i++
      if (async) {
        self.requestAnimationFrame(run)
        return false
      } else {
        return true
      }
    } else {
      console.log('Performance fps: ' + Math.round(1000 / (totalTime / count)) + '')
      console.log('Real fps: ' + Math.round(1000 / ((t1 - start) / count)) + '')
      console.log('Total time: ' + totalTime)
      console.log('Longest frame: ' + Math.ceil(longestFrame) + 'ms (' + Math.floor(1000 / longestFrame) + ' fps)')
      return false
    }
  }

  while (true) {
    if (!run()) {
      break
    }
  }
}
