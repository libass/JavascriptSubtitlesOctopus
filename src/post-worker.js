/* global Module, HEAPU8, FS, SDL */
/* eslint-env browser, worker */
/* eslint node/no-callback-literal: 0 */
Module.FS = FS

self.delay = 0 // approximate delay (time of render + postMessage + drawImage), for example 1/60 or 0
self.lastCurrentTime = 0
self.rate = 1
self.rafId = null
self.nextIsRaf = false
self.lastCurrentTimeReceivedAt = Date.now()
self.targetFps = 24
self.libassMemoryLimit = 0 // in MiB

self.width = 0
self.height = 0

self.fontMap_ = {}
self.fontId = 0

/**
 * Make the font accessible by libass by writing it to the virtual FS.
 * @param {!string} font the font name.
 */
self.writeFontToFS = function (font) {
  font = font.trim().toLowerCase()

  if (font.startsWith('@')) {
    font = font.substring(1)
  }

  if (self.fontMap_[font]) return

  self.fontMap_[font] = true

  if (!self.availableFonts[font]) return
  const content = readBinary(self.availableFonts[font])

  Module.FS.writeFile('/fonts/font' + (self.fontId++) + '-' + self.availableFonts[font].split('/').pop(), content, {
    encoding: 'binary'
  })
}

/**
 * Write all font's mentioned in the .ass file to the virtual FS.
 * @param {!string} content the file content.
 */
self.writeAvailableFontsToFS = function (content) {
  if (!self.availableFonts) return

  const sections = parseAss(content)

  for (let i = 0; i < sections.length; i++) {
    for (let j = 0; j < sections[i].body.length; j++) {
      if (sections[i].body[j].key === 'Style') {
        self.writeFontToFS(sections[i].body[j].value.Fontname)
      }
    }
  }

  const regex = /\\fn([^\\}]*?)[\\}]/g
  let matches
  while (matches = regex.exec(self.subContent)) {
    self.writeFontToFS(matches[1])
  }
}
/**
 * Set the subtitle track.
 * @param {!string} content the content of the subtitle file.
 */
self.setTrack = function ({ content }) {
  // Make sure that the fonts are loaded
  self.writeAvailableFontsToFS(content)

  // Write the subtitle file to the virtual FS.
  Module.FS.writeFile('/sub.ass', content)

  // Tell libass to render the new track
  self.octObj.createTrack('/sub.ass')
  self.ass_track = self.octObj.track
  self.renderLoop()
}

/**
 * Remove subtitle track.
 */
self.freeTrack = function () {
  self.octObj.removeTrack()
  self.renderLoop()
}

/**
 * Set the subtitle track.
 * @param {!string} url the URL of the subtitle file.
 */
self.setTrackByUrl = function ({ url }) {
  let content = ''
  if (isBrotliFile(url)) {
    content = Module.BrotliDecode(readBinary(url))
  } else {
    content = read_(url)
  }
  self.setTrack({ content })
}

self.resize = (width, height) => {
  self.width = width
  self.height = height
  if (self.offscreenCanvas) {
    self.offscreenCanvas.width = width
    self.offscreenCanvas.height = height
  }
  self.octObj.resizeCanvas(width, height)
}

self.getCurrentTime = function () {
  const diff = (Date.now() - self.lastCurrentTimeReceivedAt) / 1000
  if (self._isPaused) {
    return self.lastCurrentTime
  } else {
    if (diff > 5) {
      console.error('Didn\'t received currentTime > 5 seconds. Assuming video was paused.')
      self.setIsPaused(true)
    }
    return self.lastCurrentTime + (diff * self.rate)
  }
}
self.setCurrentTime = function (currentTime) {
  self.lastCurrentTime = currentTime
  self.lastCurrentTimeReceivedAt = Date.now()
  if (!self.rafId) {
    if (self.nextIsRaf) {
      self.rafId = self.requestAnimationFrame(self.renderLoop)
    } else {
      self.renderLoop()

      // Give onmessage chance to receive all queued messages
      setTimeout(function () {
        self.nextIsRaf = false
      }, 20)
    }
  }
}

self._isPaused = true
self.getIsPaused = function () {
  return self._isPaused
}
self.setIsPaused = function (isPaused) {
  if (isPaused !== self._isPaused) {
    self._isPaused = isPaused
    if (isPaused) {
      if (self.rafId) {
        clearTimeout(self.rafId)
        self.rafId = null
      }
    } else {
      self.lastCurrentTimeReceivedAt = Date.now()
      self.rafId = self.requestAnimationFrame(self.renderLoop)
    }
  }
}

self.renderImageData = (time, force) => {
  if (self.blendMode === 'wasm') {
    const result = self.octObj.renderBlend(time, force)
    return { w: result.dest_width, h: result.dest_height, x: result.dest_x, y: result.dest_y, changed: result.changed, image: result.image }
  } else {
    const result = self.octObj.renderImage(time, self.changed)
    result.changed = Module.getValue(self.changed, 'i32')
    return result
  }
}

self.processRender = (result, callback) => {
  const images = []
  let buffers = []
  if (self.blendMode === 'wasm') {
    if (result.image) {
      result.buffer = HEAPU8.buffer.slice(result.image, result.image + result.w * result.h * 4)
      images.push(result)
      buffers.push(result.buffer)
    }
  } else {
    let res = result
    while (res.ptr !== 0) {
      const decode = self.decodeResultBitmap(res)
      if (decode) {
        images.push(decode)
        buffers.push(decode.buffer)
      }
      res = res.next
    }
  }
  // use callback to not rely on async/await
  if (self.asyncRender) {
    const promises = []
    for (const image of images) {
      if (image.buffer) promises.push(createImageBitmap(new ImageData(new Uint8ClampedArray(image.buffer), image.w, image.h), 0, 0, image.w, image.h))
    }
    Promise.all(promises).then(bitmaps => {
      for (let i = 0; i < images.length; i++) {
        images[i].buffer = bitmaps[i]
      }
      buffers = bitmaps
      callback({ images, buffers })
    })
  } else {
    callback({ images, buffers })
  }
}

self.decodeResultBitmap = ({ bitmap, stride, w, h, color, dst_x, dst_y }) => {
  if (w === 0 || h === 0) return null
  const a = (255 - (color & 255)) / 255
  if (a === 0) return null
  const c = ((color << 8) & 0xff0000) | ((color >> 8) & 0xff00) | ((color >> 24) & 0xff)
  const data = new Uint32Array(w * h) // operate on a single position at once, instead of 4 positions
  for (let y = h + 1, pos = bitmap, res = 0; --y; pos += stride) {
    for (let z = 0; z < w; ++z, ++res) {
      const k = HEAPU8[pos + z]
      if (k !== 0) data[res] = ((a * k) << 24) | c
    }
  }
  return { w, h, x: dst_x, y: dst_y, buffer: data.buffer }
}

self.render = (time, force) => {
  self.busy = true
  const result = self.renderImageData(time, force)
  if (result.changed !== 0 || force) {
    self.processRender(result, self.paintImages)
  } else {
    self.busy = false
  }
}

self.demand = data => {
  self.lastCurrentTime = data.time
  if (!self.busy) self.render(data.time, true)
}

self.renderLoop = (force) => {
  self.rafId = 0
  self.renderPending = false
  self.render(self.getCurrentTime() + self.delay, force)
  if (!self._isPaused) {
    self.rafId = self.requestAnimationFrame(self.renderLoop)
  }
}

self.paintImages = ({ images, buffers }) => {
  if (self.offscreenCanvasCtx) {
    self.offscreenCanvasCtx.clearRect(0, 0, self.offscreenCanvas.width, self.offscreenCanvas.height)
    for (const image of images) {
      if (image.buffer) {
        if (self.asyncRender) {
          self.offscreenCanvasCtx.drawImage(image.buffer, image.x, image.y)
        } else {
          self.bufferCanvas.width = image.w
          self.bufferCanvas.height = image.h
          self.bufferCtx.putImageData(new ImageData(new Uint8ClampedArray(image.buffer), image.w, image.h), 0, 0)
          self.offscreenCanvasCtx.drawImage(self.bufferCanvas, image.x, image.y)
        }
      }
    }
  } else {
    postMessage({
      target: 'render',
      async: self.asyncRender,
      images
    }, buffers)
  }
  self.busy = false
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
          value = value.map(function (s) {
            return s.trim()
          })
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

self.requestAnimationFrame = (function () {
  // similar to Browser.requestAnimationFrame
  let nextRAF = 0
  return function (func) {
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
let commandBuffer = []

const postMainLoop = Module.postMainLoop
Module.postMainLoop = function () {
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
    messageBuffer.forEach(function (message) {
      onmessage(message)
    })
    messageBuffer = null
  } else {
    messageResenderTimeout = setTimeout(messageResender, 50)
  }
}

function _applyKeys (input, output) {
  const vargs = Object.keys(input)

  for (let i = 0; i < vargs.length; i++) {
    output[vargs[i]] = input[vargs[i]]
  }
}

self.init = data => {
  screen.width = self.width = data.width
  screen.height = self.height = data.height
  self.subUrl = data.subUrl
  self.subContent = data.subContent
  self.fontFiles = data.fonts
  self.blendMode = data.blendMode
  self.asyncRender = data.asyncRender
  // Force fallback if engine does not support 'lossy' mode.
  // We only use createImageBitmap in the worker and historic WebKit versions supported
  // the API in the normal but not the worker scope, so we can't check this earlier.
  if (self.asyncRender && typeof createImageBitmap === 'undefined') {
    self.asyncRender = false
    console.error("'createImageBitmap' needed for 'asyncRender' unsupported!")
  }

  self.availableFonts = data.availableFonts
  self.debug = data.debug
  if (!hasNativeConsole && self.debug) {
    console = makeCustomConsole()
    console.log('overridden console')
  }
  if (Module.canvas) {
    Module.canvas.width_ = data.width
    Module.canvas.height_ = data.height
    if (data.boundingClientRect) {
      Module.canvas.boundingClientRect = data.boundingClientRect
    }
  }
  self.targetFps = data.targetFps || self.targetFps
  self.libassMemoryLimit = data.libassMemoryLimit || self.libassMemoryLimit
  self.libassGlyphLimit = data.libassGlyphLimit || 0
  removeRunDependency('worker-init')
  postMessage({
    target: 'ready'
  })
}

self.canvas = data => {
  if (data.width == null) throw new Error('Invalid canvas size specified')
  if (Module.canvas && data.boundingClientRect) {
    Module.canvas.boundingClientRect = data.boundingClientRect
  }
  self.resize(data.width, data.height)
  self.renderLoop()
}

self.video = data => {
  if (data.currentTime != null) self.setCurrentTime(data.currentTime)
  if (data.isPaused != null) self.setIsPaused(data.isPaused)
  self.rate = data.rate || self.rate
}

onmessage = message => {
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
  if (self[message.data.target]) {
    self[message.data.target](message.data)
  } else {
    const { data } = message
    switch (data.target) {
      case 'offscreenCanvas':
        self.offscreenCanvas = data.transferable[0]
        self.offscreenCanvasCtx = self.offscreenCanvas.getContext('2d')
        self.bufferCanvas = new OffscreenCanvas(self.height, self.width)
        self.bufferCtx = self.bufferCanvas.getContext('2d')
        break
      case 'destroy':
        self.octObj.quitLibrary()
        break
      case 'createEvent':
        _applyKeys(data.event, self.octObj.track.get_events(self.octObj.allocEvent()))
        break
      case 'getEvents': {
        const events = []
        for (let i = 0; i < self.octObj.getEventCount(); i++) {
          const evntPtr = self.octObj.track.get_events(i)
          events.push({
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
          })
        }
        postMessage({
          target: 'getEvents',
          events: events
        })
      }
        break
      case 'setEvent':
        _applyKeys(data.event, self.octObj.track.get_events(data.index))
        break
      case 'removeEvent':
        self.octObj.removeEvent(data.index)
        break
      case 'createStyle':
        _applyKeys(data.style, self.octObj.track.get_styles(self.octObj.allocStyle()))
        break
      case 'getStyles': {
        const styles = []
        for (let i = 0; i < self.octObj.getStyleCount(); i++) {
          const stylPtr = self.octObj.track.get_styles(i)
          styles.push({
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
          })
        }
        postMessage({
          target: 'getStyles',
          time: Date.now(),
          styles: styles
        })
      }
        break
      case 'setStyle':
        _applyKeys(data.style, self.octObj.track.get_styles(data.index))
        break
      case 'removeStyle':
        self.octObj.removeStyle(data.index)
        break
      case 'setimmediate': {
        if (Module.setImmediates) Module.setImmediates.shift()()
        break
      }
      default:
        throw new Error('Unknown event target ' + message.data.target)
    }
  }
}

self.runBenchmark = function (seconds, pos, async) {
  let totalTime = 0
  let i = 0
  pos = pos || 0
  seconds = seconds || 60
  const count = seconds * self.targetFps
  const start = Date.now()
  let longestFrame = 0
  const run = function () {
    const t0 = Date.now()

    pos += 1 / self.targetFps
    self.setCurrentTime(pos)

    const t1 = Date.now()
    const diff = t1 - t0
    totalTime += diff
    if (diff > longestFrame) {
      longestFrame = diff
    }

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
