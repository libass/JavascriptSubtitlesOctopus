
// Bindings utilities

/** @suppress {duplicate} (TODO: avoid emitting this multiple times, it is redundant) */
function WrapperObject() {
}
WrapperObject.prototype = Object.create(WrapperObject.prototype);
WrapperObject.prototype.constructor = WrapperObject;
WrapperObject.prototype.__class__ = WrapperObject;
WrapperObject.__cache__ = {};
Module['WrapperObject'] = WrapperObject;

/** @suppress {duplicate} (TODO: avoid emitting this multiple times, it is redundant) */
function getCache(__class__) {
  return (__class__ || WrapperObject).__cache__;
}
Module['getCache'] = getCache;

/** @suppress {duplicate} (TODO: avoid emitting this multiple times, it is redundant) */
function wrapPointer(ptr, __class__) {
  var cache = getCache(__class__);
  var ret = cache[ptr];
  if (ret) return ret;
  ret = Object.create((__class__ || WrapperObject).prototype);
  ret.ptr = ptr;
  return cache[ptr] = ret;
}
Module['wrapPointer'] = wrapPointer;

/** @suppress {duplicate} (TODO: avoid emitting this multiple times, it is redundant) */
function castObject(obj, __class__) {
  return wrapPointer(obj.ptr, __class__);
}
Module['castObject'] = castObject;

Module['NULL'] = wrapPointer(0);

/** @suppress {duplicate} (TODO: avoid emitting this multiple times, it is redundant) */
function destroy(obj) {
  if (!obj['__destroy__']) throw 'Error: Cannot destroy object. (Did you create it yourself?)';
  obj['__destroy__']();
  // Remove from cache, so the object can be GC'd and refs added onto it released
  delete getCache(obj.__class__)[obj.ptr];
}
Module['destroy'] = destroy;

/** @suppress {duplicate} (TODO: avoid emitting this multiple times, it is redundant) */
function compare(obj1, obj2) {
  return obj1.ptr === obj2.ptr;
}
Module['compare'] = compare;

/** @suppress {duplicate} (TODO: avoid emitting this multiple times, it is redundant) */
function getPointer(obj) {
  return obj.ptr;
}
Module['getPointer'] = getPointer;

/** @suppress {duplicate} (TODO: avoid emitting this multiple times, it is redundant) */
function getClass(obj) {
  return obj.__class__;
}
Module['getClass'] = getClass;

// Converts big (string or array) values into a C-style storage, in temporary space

/** @suppress {duplicate} (TODO: avoid emitting this multiple times, it is redundant) */
var ensureCache = {
  buffer: 0,  // the main buffer of temporary storage
  size: 0,   // the size of buffer
  pos: 0,    // the next free offset in buffer
  temps: [], // extra allocations
  needed: 0, // the total size we need next time

  prepare: function() {
    if (ensureCache.needed) {
      // clear the temps
      for (var i = 0; i < ensureCache.temps.length; i++) {
        Module['_free'](ensureCache.temps[i]);
      }
      ensureCache.temps.length = 0;
      // prepare to allocate a bigger buffer
      Module['_free'](ensureCache.buffer);
      ensureCache.buffer = 0;
      ensureCache.size += ensureCache.needed;
      // clean up
      ensureCache.needed = 0;
    }
    if (!ensureCache.buffer) { // happens first time, or when we need to grow
      ensureCache.size += 128; // heuristic, avoid many small grow events
      ensureCache.buffer = Module['_malloc'](ensureCache.size);
      assert(ensureCache.buffer);
    }
    ensureCache.pos = 0;
  },
  alloc: function(array, view) {
    assert(ensureCache.buffer);
    var bytes = view.BYTES_PER_ELEMENT;
    var len = array.length * bytes;
    len = (len + 7) & -8; // keep things aligned to 8 byte boundaries
    var ret;
    if (ensureCache.pos + len >= ensureCache.size) {
      // we failed to allocate in the buffer, ensureCache time around :(
      assert(len > 0); // null terminator, at least
      ensureCache.needed += len;
      ret = Module['_malloc'](len);
      ensureCache.temps.push(ret);
    } else {
      // we can allocate in the buffer
      ret = ensureCache.buffer + ensureCache.pos;
      ensureCache.pos += len;
    }
    return ret;
  },
  copy: function(array, view, offset) {
    var offsetShifted = offset;
    var bytes = view.BYTES_PER_ELEMENT;
    switch (bytes) {
      case 2: offsetShifted >>= 1; break;
      case 4: offsetShifted >>= 2; break;
      case 8: offsetShifted >>= 3; break;
    }
    for (var i = 0; i < array.length; i++) {
      view[offsetShifted + i] = array[i];
    }
  },
};

/** @suppress {duplicate} (TODO: avoid emitting this multiple times, it is redundant) */
function ensureString(value) {
  if (typeof value === 'string') {
    var intArray = intArrayFromString(value);
    var offset = ensureCache.alloc(intArray, HEAP8);
    ensureCache.copy(intArray, HEAP8, offset);
    return offset;
  }
  return value;
}
/** @suppress {duplicate} (TODO: avoid emitting this multiple times, it is redundant) */
function ensureInt8(value) {
  if (typeof value === 'object') {
    var offset = ensureCache.alloc(value, HEAP8);
    ensureCache.copy(value, HEAP8, offset);
    return offset;
  }
  return value;
}
/** @suppress {duplicate} (TODO: avoid emitting this multiple times, it is redundant) */
function ensureInt16(value) {
  if (typeof value === 'object') {
    var offset = ensureCache.alloc(value, HEAP16);
    ensureCache.copy(value, HEAP16, offset);
    return offset;
  }
  return value;
}
/** @suppress {duplicate} (TODO: avoid emitting this multiple times, it is redundant) */
function ensureInt32(value) {
  if (typeof value === 'object') {
    var offset = ensureCache.alloc(value, HEAP32);
    ensureCache.copy(value, HEAP32, offset);
    return offset;
  }
  return value;
}
/** @suppress {duplicate} (TODO: avoid emitting this multiple times, it is redundant) */
function ensureFloat32(value) {
  if (typeof value === 'object') {
    var offset = ensureCache.alloc(value, HEAPF32);
    ensureCache.copy(value, HEAPF32, offset);
    return offset;
  }
  return value;
}
/** @suppress {duplicate} (TODO: avoid emitting this multiple times, it is redundant) */
function ensureFloat64(value) {
  if (typeof value === 'object') {
    var offset = ensureCache.alloc(value, HEAPF64);
    ensureCache.copy(value, HEAPF64, offset);
    return offset;
  }
  return value;
}


// ASS_ParserPriv
/** @suppress {undefinedVars, duplicate} */function ASS_ParserPriv() { throw "cannot construct a ASS_ParserPriv, no constructor in IDL" }
ASS_ParserPriv.prototype = Object.create(WrapperObject.prototype);
ASS_ParserPriv.prototype.constructor = ASS_ParserPriv;
ASS_ParserPriv.prototype.__class__ = ASS_ParserPriv;
ASS_ParserPriv.__cache__ = {};
Module['ASS_ParserPriv'] = ASS_ParserPriv;

// ASS_Event
/** @suppress {undefinedVars, duplicate} */function ASS_Event() { throw "cannot construct a ASS_Event, no constructor in IDL" }
ASS_Event.prototype = Object.create(WrapperObject.prototype);
ASS_Event.prototype.constructor = ASS_Event;
ASS_Event.prototype.__class__ = ASS_Event;
ASS_Event.__cache__ = {};
Module['ASS_Event'] = ASS_Event;

  ASS_Event.prototype['get_Start'] = ASS_Event.prototype.get_Start = /** @suppress {undefinedVars, duplicate} */function() {
  var self = this.ptr;
  return _emscripten_bind_ASS_Event_get_Start_0(self);
};
    ASS_Event.prototype['set_Start'] = ASS_Event.prototype.set_Start = /** @suppress {undefinedVars, duplicate} */function(arg0) {
  var self = this.ptr;
  if (arg0 && typeof arg0 === 'object') arg0 = arg0.ptr;
  _emscripten_bind_ASS_Event_set_Start_1(self, arg0);
};
    Object.defineProperty(ASS_Event.prototype, 'Start', { get: ASS_Event.prototype.get_Start, set: ASS_Event.prototype.set_Start });
  ASS_Event.prototype['get_Duration'] = ASS_Event.prototype.get_Duration = /** @suppress {undefinedVars, duplicate} */function() {
  var self = this.ptr;
  return _emscripten_bind_ASS_Event_get_Duration_0(self);
};
    ASS_Event.prototype['set_Duration'] = ASS_Event.prototype.set_Duration = /** @suppress {undefinedVars, duplicate} */function(arg0) {
  var self = this.ptr;
  if (arg0 && typeof arg0 === 'object') arg0 = arg0.ptr;
  _emscripten_bind_ASS_Event_set_Duration_1(self, arg0);
};
    Object.defineProperty(ASS_Event.prototype, 'Duration', { get: ASS_Event.prototype.get_Duration, set: ASS_Event.prototype.set_Duration });
  ASS_Event.prototype['get_ReadOrder'] = ASS_Event.prototype.get_ReadOrder = /** @suppress {undefinedVars, duplicate} */function() {
  var self = this.ptr;
  return _emscripten_bind_ASS_Event_get_ReadOrder_0(self);
};
    ASS_Event.prototype['set_ReadOrder'] = ASS_Event.prototype.set_ReadOrder = /** @suppress {undefinedVars, duplicate} */function(arg0) {
  var self = this.ptr;
  if (arg0 && typeof arg0 === 'object') arg0 = arg0.ptr;
  _emscripten_bind_ASS_Event_set_ReadOrder_1(self, arg0);
};
    Object.defineProperty(ASS_Event.prototype, 'ReadOrder', { get: ASS_Event.prototype.get_ReadOrder, set: ASS_Event.prototype.set_ReadOrder });
  ASS_Event.prototype['get_Layer'] = ASS_Event.prototype.get_Layer = /** @suppress {undefinedVars, duplicate} */function() {
  var self = this.ptr;
  return _emscripten_bind_ASS_Event_get_Layer_0(self);
};
    ASS_Event.prototype['set_Layer'] = ASS_Event.prototype.set_Layer = /** @suppress {undefinedVars, duplicate} */function(arg0) {
  var self = this.ptr;
  if (arg0 && typeof arg0 === 'object') arg0 = arg0.ptr;
  _emscripten_bind_ASS_Event_set_Layer_1(self, arg0);
};
    Object.defineProperty(ASS_Event.prototype, 'Layer', { get: ASS_Event.prototype.get_Layer, set: ASS_Event.prototype.set_Layer });
  ASS_Event.prototype['get_Style'] = ASS_Event.prototype.get_Style = /** @suppress {undefinedVars, duplicate} */function() {
  var self = this.ptr;
  return _emscripten_bind_ASS_Event_get_Style_0(self);
};
    ASS_Event.prototype['set_Style'] = ASS_Event.prototype.set_Style = /** @suppress {undefinedVars, duplicate} */function(arg0) {
  var self = this.ptr;
  if (arg0 && typeof arg0 === 'object') arg0 = arg0.ptr;
  _emscripten_bind_ASS_Event_set_Style_1(self, arg0);
};
    Object.defineProperty(ASS_Event.prototype, 'Style', { get: ASS_Event.prototype.get_Style, set: ASS_Event.prototype.set_Style });
  ASS_Event.prototype['get_Name'] = ASS_Event.prototype.get_Name = /** @suppress {undefinedVars, duplicate} */function() {
  var self = this.ptr;
  return UTF8ToString(_emscripten_bind_ASS_Event_get_Name_0(self));
};
    ASS_Event.prototype['set_Name'] = ASS_Event.prototype.set_Name = /** @suppress {undefinedVars, duplicate} */function(arg0) {
  var self = this.ptr;
  ensureCache.prepare();
  if (arg0 && typeof arg0 === 'object') arg0 = arg0.ptr;
  else arg0 = ensureString(arg0);
  _emscripten_bind_ASS_Event_set_Name_1(self, arg0);
};
    Object.defineProperty(ASS_Event.prototype, 'Name', { get: ASS_Event.prototype.get_Name, set: ASS_Event.prototype.set_Name });
  ASS_Event.prototype['get_MarginL'] = ASS_Event.prototype.get_MarginL = /** @suppress {undefinedVars, duplicate} */function() {
  var self = this.ptr;
  return _emscripten_bind_ASS_Event_get_MarginL_0(self);
};
    ASS_Event.prototype['set_MarginL'] = ASS_Event.prototype.set_MarginL = /** @suppress {undefinedVars, duplicate} */function(arg0) {
  var self = this.ptr;
  if (arg0 && typeof arg0 === 'object') arg0 = arg0.ptr;
  _emscripten_bind_ASS_Event_set_MarginL_1(self, arg0);
};
    Object.defineProperty(ASS_Event.prototype, 'MarginL', { get: ASS_Event.prototype.get_MarginL, set: ASS_Event.prototype.set_MarginL });
  ASS_Event.prototype['get_MarginR'] = ASS_Event.prototype.get_MarginR = /** @suppress {undefinedVars, duplicate} */function() {
  var self = this.ptr;
  return _emscripten_bind_ASS_Event_get_MarginR_0(self);
};
    ASS_Event.prototype['set_MarginR'] = ASS_Event.prototype.set_MarginR = /** @suppress {undefinedVars, duplicate} */function(arg0) {
  var self = this.ptr;
  if (arg0 && typeof arg0 === 'object') arg0 = arg0.ptr;
  _emscripten_bind_ASS_Event_set_MarginR_1(self, arg0);
};
    Object.defineProperty(ASS_Event.prototype, 'MarginR', { get: ASS_Event.prototype.get_MarginR, set: ASS_Event.prototype.set_MarginR });
  ASS_Event.prototype['get_MarginV'] = ASS_Event.prototype.get_MarginV = /** @suppress {undefinedVars, duplicate} */function() {
  var self = this.ptr;
  return _emscripten_bind_ASS_Event_get_MarginV_0(self);
};
    ASS_Event.prototype['set_MarginV'] = ASS_Event.prototype.set_MarginV = /** @suppress {undefinedVars, duplicate} */function(arg0) {
  var self = this.ptr;
  if (arg0 && typeof arg0 === 'object') arg0 = arg0.ptr;
  _emscripten_bind_ASS_Event_set_MarginV_1(self, arg0);
};
    Object.defineProperty(ASS_Event.prototype, 'MarginV', { get: ASS_Event.prototype.get_MarginV, set: ASS_Event.prototype.set_MarginV });
  ASS_Event.prototype['get_Effect'] = ASS_Event.prototype.get_Effect = /** @suppress {undefinedVars, duplicate} */function() {
  var self = this.ptr;
  return UTF8ToString(_emscripten_bind_ASS_Event_get_Effect_0(self));
};
    ASS_Event.prototype['set_Effect'] = ASS_Event.prototype.set_Effect = /** @suppress {undefinedVars, duplicate} */function(arg0) {
  var self = this.ptr;
  ensureCache.prepare();
  if (arg0 && typeof arg0 === 'object') arg0 = arg0.ptr;
  else arg0 = ensureString(arg0);
  _emscripten_bind_ASS_Event_set_Effect_1(self, arg0);
};
    Object.defineProperty(ASS_Event.prototype, 'Effect', { get: ASS_Event.prototype.get_Effect, set: ASS_Event.prototype.set_Effect });
  ASS_Event.prototype['get_Text'] = ASS_Event.prototype.get_Text = /** @suppress {undefinedVars, duplicate} */function() {
  var self = this.ptr;
  return UTF8ToString(_emscripten_bind_ASS_Event_get_Text_0(self));
};
    ASS_Event.prototype['set_Text'] = ASS_Event.prototype.set_Text = /** @suppress {undefinedVars, duplicate} */function(arg0) {
  var self = this.ptr;
  ensureCache.prepare();
  if (arg0 && typeof arg0 === 'object') arg0 = arg0.ptr;
  else arg0 = ensureString(arg0);
  _emscripten_bind_ASS_Event_set_Text_1(self, arg0);
};
    Object.defineProperty(ASS_Event.prototype, 'Text', { get: ASS_Event.prototype.get_Text, set: ASS_Event.prototype.set_Text });
// ASS_Renderer
/** @suppress {undefinedVars, duplicate} */function ASS_Renderer() { throw "cannot construct a ASS_Renderer, no constructor in IDL" }
ASS_Renderer.prototype = Object.create(WrapperObject.prototype);
ASS_Renderer.prototype.constructor = ASS_Renderer;
ASS_Renderer.prototype.__class__ = ASS_Renderer;
ASS_Renderer.__cache__ = {};
Module['ASS_Renderer'] = ASS_Renderer;

// SubtitleOctopus
/** @suppress {undefinedVars, duplicate} */function SubtitleOctopus() {
  this.ptr = _emscripten_bind_SubtitleOctopus_SubtitleOctopus_0();
  getCache(SubtitleOctopus)[this.ptr] = this;
};;
SubtitleOctopus.prototype = Object.create(WrapperObject.prototype);
SubtitleOctopus.prototype.constructor = SubtitleOctopus;
SubtitleOctopus.prototype.__class__ = SubtitleOctopus;
SubtitleOctopus.__cache__ = {};
Module['SubtitleOctopus'] = SubtitleOctopus;

SubtitleOctopus.prototype['setLogLevel'] = SubtitleOctopus.prototype.setLogLevel = /** @suppress {undefinedVars, duplicate} */function(level) {
  var self = this.ptr;
  if (level && typeof level === 'object') level = level.ptr;
  _emscripten_bind_SubtitleOctopus_setLogLevel_1(self, level);
};;

SubtitleOctopus.prototype['initLibrary'] = SubtitleOctopus.prototype.initLibrary = /** @suppress {undefinedVars, duplicate} */function(frame_w, frame_h) {
  var self = this.ptr;
  if (frame_w && typeof frame_w === 'object') frame_w = frame_w.ptr;
  if (frame_h && typeof frame_h === 'object') frame_h = frame_h.ptr;
  _emscripten_bind_SubtitleOctopus_initLibrary_2(self, frame_w, frame_h);
};;

SubtitleOctopus.prototype['createTrack'] = SubtitleOctopus.prototype.createTrack = /** @suppress {undefinedVars, duplicate} */function(subfile) {
  var self = this.ptr;
  ensureCache.prepare();
  if (subfile && typeof subfile === 'object') subfile = subfile.ptr;
  else subfile = ensureString(subfile);
  _emscripten_bind_SubtitleOctopus_createTrack_1(self, subfile);
};;

SubtitleOctopus.prototype['createTrackMem'] = SubtitleOctopus.prototype.createTrackMem = /** @suppress {undefinedVars, duplicate} */function(buf, bufsize) {
  var self = this.ptr;
  ensureCache.prepare();
  if (buf && typeof buf === 'object') buf = buf.ptr;
  else buf = ensureString(buf);
  if (bufsize && typeof bufsize === 'object') bufsize = bufsize.ptr;
  _emscripten_bind_SubtitleOctopus_createTrackMem_2(self, buf, bufsize);
};;

SubtitleOctopus.prototype['removeTrack'] = SubtitleOctopus.prototype.removeTrack = /** @suppress {undefinedVars, duplicate} */function() {
  var self = this.ptr;
  _emscripten_bind_SubtitleOctopus_removeTrack_0(self);
};;

SubtitleOctopus.prototype['resizeCanvas'] = SubtitleOctopus.prototype.resizeCanvas = /** @suppress {undefinedVars, duplicate} */function(frame_w, frame_h) {
  var self = this.ptr;
  if (frame_w && typeof frame_w === 'object') frame_w = frame_w.ptr;
  if (frame_h && typeof frame_h === 'object') frame_h = frame_h.ptr;
  _emscripten_bind_SubtitleOctopus_resizeCanvas_2(self, frame_w, frame_h);
};;

SubtitleOctopus.prototype['renderImage'] = SubtitleOctopus.prototype.renderImage = /** @suppress {undefinedVars, duplicate} */function(time, changed) {
  var self = this.ptr;
  if (time && typeof time === 'object') time = time.ptr;
  if (changed && typeof changed === 'object') changed = changed.ptr;
  return wrapPointer(_emscripten_bind_SubtitleOctopus_renderImage_2(self, time, changed), ASS_Image);
};;

SubtitleOctopus.prototype['quitLibrary'] = SubtitleOctopus.prototype.quitLibrary = /** @suppress {undefinedVars, duplicate} */function() {
  var self = this.ptr;
  _emscripten_bind_SubtitleOctopus_quitLibrary_0(self);
};;

SubtitleOctopus.prototype['reloadLibrary'] = SubtitleOctopus.prototype.reloadLibrary = /** @suppress {undefinedVars, duplicate} */function() {
  var self = this.ptr;
  _emscripten_bind_SubtitleOctopus_reloadLibrary_0(self);
};;

SubtitleOctopus.prototype['reloadFonts'] = SubtitleOctopus.prototype.reloadFonts = /** @suppress {undefinedVars, duplicate} */function() {
  var self = this.ptr;
  _emscripten_bind_SubtitleOctopus_reloadFonts_0(self);
};;

SubtitleOctopus.prototype['setMargin'] = SubtitleOctopus.prototype.setMargin = /** @suppress {undefinedVars, duplicate} */function(top, bottom, left, right) {
  var self = this.ptr;
  if (top && typeof top === 'object') top = top.ptr;
  if (bottom && typeof bottom === 'object') bottom = bottom.ptr;
  if (left && typeof left === 'object') left = left.ptr;
  if (right && typeof right === 'object') right = right.ptr;
  _emscripten_bind_SubtitleOctopus_setMargin_4(self, top, bottom, left, right);
};;

SubtitleOctopus.prototype['getEventCount'] = SubtitleOctopus.prototype.getEventCount = /** @suppress {undefinedVars, duplicate} */function() {
  var self = this.ptr;
  return _emscripten_bind_SubtitleOctopus_getEventCount_0(self);
};;

SubtitleOctopus.prototype['allocEvent'] = SubtitleOctopus.prototype.allocEvent = /** @suppress {undefinedVars, duplicate} */function() {
  var self = this.ptr;
  return _emscripten_bind_SubtitleOctopus_allocEvent_0(self);
};;

SubtitleOctopus.prototype['allocStyle'] = SubtitleOctopus.prototype.allocStyle = /** @suppress {undefinedVars, duplicate} */function() {
  var self = this.ptr;
  return _emscripten_bind_SubtitleOctopus_allocStyle_0(self);
};;

SubtitleOctopus.prototype['removeEvent'] = SubtitleOctopus.prototype.removeEvent = /** @suppress {undefinedVars, duplicate} */function(eid) {
  var self = this.ptr;
  if (eid && typeof eid === 'object') eid = eid.ptr;
  _emscripten_bind_SubtitleOctopus_removeEvent_1(self, eid);
};;

SubtitleOctopus.prototype['getStyleCount'] = SubtitleOctopus.prototype.getStyleCount = /** @suppress {undefinedVars, duplicate} */function() {
  var self = this.ptr;
  return _emscripten_bind_SubtitleOctopus_getStyleCount_0(self);
};;

SubtitleOctopus.prototype['getStyleByName'] = SubtitleOctopus.prototype.getStyleByName = /** @suppress {undefinedVars, duplicate} */function(name) {
  var self = this.ptr;
  ensureCache.prepare();
  if (name && typeof name === 'object') name = name.ptr;
  else name = ensureString(name);
  return _emscripten_bind_SubtitleOctopus_getStyleByName_1(self, name);
};;

SubtitleOctopus.prototype['removeStyle'] = SubtitleOctopus.prototype.removeStyle = /** @suppress {undefinedVars, duplicate} */function(eid) {
  var self = this.ptr;
  if (eid && typeof eid === 'object') eid = eid.ptr;
  _emscripten_bind_SubtitleOctopus_removeStyle_1(self, eid);
};;

SubtitleOctopus.prototype['removeAllEvents'] = SubtitleOctopus.prototype.removeAllEvents = /** @suppress {undefinedVars, duplicate} */function() {
  var self = this.ptr;
  _emscripten_bind_SubtitleOctopus_removeAllEvents_0(self);
};;

  SubtitleOctopus.prototype['get_track'] = SubtitleOctopus.prototype.get_track = /** @suppress {undefinedVars, duplicate} */function() {
  var self = this.ptr;
  return wrapPointer(_emscripten_bind_SubtitleOctopus_get_track_0(self), ASS_Track);
};
    SubtitleOctopus.prototype['set_track'] = SubtitleOctopus.prototype.set_track = /** @suppress {undefinedVars, duplicate} */function(arg0) {
  var self = this.ptr;
  if (arg0 && typeof arg0 === 'object') arg0 = arg0.ptr;
  _emscripten_bind_SubtitleOctopus_set_track_1(self, arg0);
};
    Object.defineProperty(SubtitleOctopus.prototype, 'track', { get: SubtitleOctopus.prototype.get_track, set: SubtitleOctopus.prototype.set_track });
  SubtitleOctopus.prototype['get_ass_renderer'] = SubtitleOctopus.prototype.get_ass_renderer = /** @suppress {undefinedVars, duplicate} */function() {
  var self = this.ptr;
  return wrapPointer(_emscripten_bind_SubtitleOctopus_get_ass_renderer_0(self), ASS_Renderer);
};
    SubtitleOctopus.prototype['set_ass_renderer'] = SubtitleOctopus.prototype.set_ass_renderer = /** @suppress {undefinedVars, duplicate} */function(arg0) {
  var self = this.ptr;
  if (arg0 && typeof arg0 === 'object') arg0 = arg0.ptr;
  _emscripten_bind_SubtitleOctopus_set_ass_renderer_1(self, arg0);
};
    Object.defineProperty(SubtitleOctopus.prototype, 'ass_renderer', { get: SubtitleOctopus.prototype.get_ass_renderer, set: SubtitleOctopus.prototype.set_ass_renderer });
  SubtitleOctopus.prototype['get_ass_library'] = SubtitleOctopus.prototype.get_ass_library = /** @suppress {undefinedVars, duplicate} */function() {
  var self = this.ptr;
  return wrapPointer(_emscripten_bind_SubtitleOctopus_get_ass_library_0(self), ASS_Library);
};
    SubtitleOctopus.prototype['set_ass_library'] = SubtitleOctopus.prototype.set_ass_library = /** @suppress {undefinedVars, duplicate} */function(arg0) {
  var self = this.ptr;
  if (arg0 && typeof arg0 === 'object') arg0 = arg0.ptr;
  _emscripten_bind_SubtitleOctopus_set_ass_library_1(self, arg0);
};
    Object.defineProperty(SubtitleOctopus.prototype, 'ass_library', { get: SubtitleOctopus.prototype.get_ass_library, set: SubtitleOctopus.prototype.set_ass_library });
  SubtitleOctopus.prototype['__destroy__'] = SubtitleOctopus.prototype.__destroy__ = /** @suppress {undefinedVars, duplicate} */function() {
  var self = this.ptr;
  _emscripten_bind_SubtitleOctopus___destroy___0(self);
};
// ASS_Track
/** @suppress {undefinedVars, duplicate} */function ASS_Track() { throw "cannot construct a ASS_Track, no constructor in IDL" }
ASS_Track.prototype = Object.create(WrapperObject.prototype);
ASS_Track.prototype.constructor = ASS_Track;
ASS_Track.prototype.__class__ = ASS_Track;
ASS_Track.__cache__ = {};
Module['ASS_Track'] = ASS_Track;

  ASS_Track.prototype['get_n_styles'] = ASS_Track.prototype.get_n_styles = /** @suppress {undefinedVars, duplicate} */function() {
  var self = this.ptr;
  return _emscripten_bind_ASS_Track_get_n_styles_0(self);
};
    ASS_Track.prototype['set_n_styles'] = ASS_Track.prototype.set_n_styles = /** @suppress {undefinedVars, duplicate} */function(arg0) {
  var self = this.ptr;
  if (arg0 && typeof arg0 === 'object') arg0 = arg0.ptr;
  _emscripten_bind_ASS_Track_set_n_styles_1(self, arg0);
};
    Object.defineProperty(ASS_Track.prototype, 'n_styles', { get: ASS_Track.prototype.get_n_styles, set: ASS_Track.prototype.set_n_styles });
  ASS_Track.prototype['get_max_styles'] = ASS_Track.prototype.get_max_styles = /** @suppress {undefinedVars, duplicate} */function() {
  var self = this.ptr;
  return _emscripten_bind_ASS_Track_get_max_styles_0(self);
};
    ASS_Track.prototype['set_max_styles'] = ASS_Track.prototype.set_max_styles = /** @suppress {undefinedVars, duplicate} */function(arg0) {
  var self = this.ptr;
  if (arg0 && typeof arg0 === 'object') arg0 = arg0.ptr;
  _emscripten_bind_ASS_Track_set_max_styles_1(self, arg0);
};
    Object.defineProperty(ASS_Track.prototype, 'max_styles', { get: ASS_Track.prototype.get_max_styles, set: ASS_Track.prototype.set_max_styles });
  ASS_Track.prototype['get_n_events'] = ASS_Track.prototype.get_n_events = /** @suppress {undefinedVars, duplicate} */function() {
  var self = this.ptr;
  return _emscripten_bind_ASS_Track_get_n_events_0(self);
};
    ASS_Track.prototype['set_n_events'] = ASS_Track.prototype.set_n_events = /** @suppress {undefinedVars, duplicate} */function(arg0) {
  var self = this.ptr;
  if (arg0 && typeof arg0 === 'object') arg0 = arg0.ptr;
  _emscripten_bind_ASS_Track_set_n_events_1(self, arg0);
};
    Object.defineProperty(ASS_Track.prototype, 'n_events', { get: ASS_Track.prototype.get_n_events, set: ASS_Track.prototype.set_n_events });
  ASS_Track.prototype['get_max_events'] = ASS_Track.prototype.get_max_events = /** @suppress {undefinedVars, duplicate} */function() {
  var self = this.ptr;
  return _emscripten_bind_ASS_Track_get_max_events_0(self);
};
    ASS_Track.prototype['set_max_events'] = ASS_Track.prototype.set_max_events = /** @suppress {undefinedVars, duplicate} */function(arg0) {
  var self = this.ptr;
  if (arg0 && typeof arg0 === 'object') arg0 = arg0.ptr;
  _emscripten_bind_ASS_Track_set_max_events_1(self, arg0);
};
    Object.defineProperty(ASS_Track.prototype, 'max_events', { get: ASS_Track.prototype.get_max_events, set: ASS_Track.prototype.set_max_events });
  ASS_Track.prototype['get_styles'] = ASS_Track.prototype.get_styles = /** @suppress {undefinedVars, duplicate} */function(arg0) {
  var self = this.ptr;
  if (arg0 && typeof arg0 === 'object') arg0 = arg0.ptr;
  return wrapPointer(_emscripten_bind_ASS_Track_get_styles_1(self, arg0), ASS_Style);
};
    ASS_Track.prototype['set_styles'] = ASS_Track.prototype.set_styles = /** @suppress {undefinedVars, duplicate} */function(arg0, arg1) {
  var self = this.ptr;
  ensureCache.prepare();
  if (arg0 && typeof arg0 === 'object') arg0 = arg0.ptr;
  if (arg1 && typeof arg1 === 'object') arg1 = arg1.ptr;
  _emscripten_bind_ASS_Track_set_styles_2(self, arg0, arg1);
};
    Object.defineProperty(ASS_Track.prototype, 'styles', { get: ASS_Track.prototype.get_styles, set: ASS_Track.prototype.set_styles });
  ASS_Track.prototype['get_events'] = ASS_Track.prototype.get_events = /** @suppress {undefinedVars, duplicate} */function(arg0) {
  var self = this.ptr;
  if (arg0 && typeof arg0 === 'object') arg0 = arg0.ptr;
  return wrapPointer(_emscripten_bind_ASS_Track_get_events_1(self, arg0), ASS_Event);
};
    ASS_Track.prototype['set_events'] = ASS_Track.prototype.set_events = /** @suppress {undefinedVars, duplicate} */function(arg0, arg1) {
  var self = this.ptr;
  ensureCache.prepare();
  if (arg0 && typeof arg0 === 'object') arg0 = arg0.ptr;
  if (arg1 && typeof arg1 === 'object') arg1 = arg1.ptr;
  _emscripten_bind_ASS_Track_set_events_2(self, arg0, arg1);
};
    Object.defineProperty(ASS_Track.prototype, 'events', { get: ASS_Track.prototype.get_events, set: ASS_Track.prototype.set_events });
  ASS_Track.prototype['get_style_format'] = ASS_Track.prototype.get_style_format = /** @suppress {undefinedVars, duplicate} */function() {
  var self = this.ptr;
  return UTF8ToString(_emscripten_bind_ASS_Track_get_style_format_0(self));
};
    ASS_Track.prototype['set_style_format'] = ASS_Track.prototype.set_style_format = /** @suppress {undefinedVars, duplicate} */function(arg0) {
  var self = this.ptr;
  ensureCache.prepare();
  if (arg0 && typeof arg0 === 'object') arg0 = arg0.ptr;
  else arg0 = ensureString(arg0);
  _emscripten_bind_ASS_Track_set_style_format_1(self, arg0);
};
    Object.defineProperty(ASS_Track.prototype, 'style_format', { get: ASS_Track.prototype.get_style_format, set: ASS_Track.prototype.set_style_format });
  ASS_Track.prototype['get_event_format'] = ASS_Track.prototype.get_event_format = /** @suppress {undefinedVars, duplicate} */function() {
  var self = this.ptr;
  return UTF8ToString(_emscripten_bind_ASS_Track_get_event_format_0(self));
};
    ASS_Track.prototype['set_event_format'] = ASS_Track.prototype.set_event_format = /** @suppress {undefinedVars, duplicate} */function(arg0) {
  var self = this.ptr;
  ensureCache.prepare();
  if (arg0 && typeof arg0 === 'object') arg0 = arg0.ptr;
  else arg0 = ensureString(arg0);
  _emscripten_bind_ASS_Track_set_event_format_1(self, arg0);
};
    Object.defineProperty(ASS_Track.prototype, 'event_format', { get: ASS_Track.prototype.get_event_format, set: ASS_Track.prototype.set_event_format });
  ASS_Track.prototype['get_PlayResX'] = ASS_Track.prototype.get_PlayResX = /** @suppress {undefinedVars, duplicate} */function() {
  var self = this.ptr;
  return _emscripten_bind_ASS_Track_get_PlayResX_0(self);
};
    ASS_Track.prototype['set_PlayResX'] = ASS_Track.prototype.set_PlayResX = /** @suppress {undefinedVars, duplicate} */function(arg0) {
  var self = this.ptr;
  if (arg0 && typeof arg0 === 'object') arg0 = arg0.ptr;
  _emscripten_bind_ASS_Track_set_PlayResX_1(self, arg0);
};
    Object.defineProperty(ASS_Track.prototype, 'PlayResX', { get: ASS_Track.prototype.get_PlayResX, set: ASS_Track.prototype.set_PlayResX });
  ASS_Track.prototype['get_PlayResY'] = ASS_Track.prototype.get_PlayResY = /** @suppress {undefinedVars, duplicate} */function() {
  var self = this.ptr;
  return _emscripten_bind_ASS_Track_get_PlayResY_0(self);
};
    ASS_Track.prototype['set_PlayResY'] = ASS_Track.prototype.set_PlayResY = /** @suppress {undefinedVars, duplicate} */function(arg0) {
  var self = this.ptr;
  if (arg0 && typeof arg0 === 'object') arg0 = arg0.ptr;
  _emscripten_bind_ASS_Track_set_PlayResY_1(self, arg0);
};
    Object.defineProperty(ASS_Track.prototype, 'PlayResY', { get: ASS_Track.prototype.get_PlayResY, set: ASS_Track.prototype.set_PlayResY });
  ASS_Track.prototype['get_Timer'] = ASS_Track.prototype.get_Timer = /** @suppress {undefinedVars, duplicate} */function() {
  var self = this.ptr;
  return _emscripten_bind_ASS_Track_get_Timer_0(self);
};
    ASS_Track.prototype['set_Timer'] = ASS_Track.prototype.set_Timer = /** @suppress {undefinedVars, duplicate} */function(arg0) {
  var self = this.ptr;
  if (arg0 && typeof arg0 === 'object') arg0 = arg0.ptr;
  _emscripten_bind_ASS_Track_set_Timer_1(self, arg0);
};
    Object.defineProperty(ASS_Track.prototype, 'Timer', { get: ASS_Track.prototype.get_Timer, set: ASS_Track.prototype.set_Timer });
  ASS_Track.prototype['get_WrapStyle'] = ASS_Track.prototype.get_WrapStyle = /** @suppress {undefinedVars, duplicate} */function() {
  var self = this.ptr;
  return _emscripten_bind_ASS_Track_get_WrapStyle_0(self);
};
    ASS_Track.prototype['set_WrapStyle'] = ASS_Track.prototype.set_WrapStyle = /** @suppress {undefinedVars, duplicate} */function(arg0) {
  var self = this.ptr;
  if (arg0 && typeof arg0 === 'object') arg0 = arg0.ptr;
  _emscripten_bind_ASS_Track_set_WrapStyle_1(self, arg0);
};
    Object.defineProperty(ASS_Track.prototype, 'WrapStyle', { get: ASS_Track.prototype.get_WrapStyle, set: ASS_Track.prototype.set_WrapStyle });
  ASS_Track.prototype['get_ScaledBorderAndShadow'] = ASS_Track.prototype.get_ScaledBorderAndShadow = /** @suppress {undefinedVars, duplicate} */function() {
  var self = this.ptr;
  return _emscripten_bind_ASS_Track_get_ScaledBorderAndShadow_0(self);
};
    ASS_Track.prototype['set_ScaledBorderAndShadow'] = ASS_Track.prototype.set_ScaledBorderAndShadow = /** @suppress {undefinedVars, duplicate} */function(arg0) {
  var self = this.ptr;
  if (arg0 && typeof arg0 === 'object') arg0 = arg0.ptr;
  _emscripten_bind_ASS_Track_set_ScaledBorderAndShadow_1(self, arg0);
};
    Object.defineProperty(ASS_Track.prototype, 'ScaledBorderAndShadow', { get: ASS_Track.prototype.get_ScaledBorderAndShadow, set: ASS_Track.prototype.set_ScaledBorderAndShadow });
  ASS_Track.prototype['get_Kerning'] = ASS_Track.prototype.get_Kerning = /** @suppress {undefinedVars, duplicate} */function() {
  var self = this.ptr;
  return _emscripten_bind_ASS_Track_get_Kerning_0(self);
};
    ASS_Track.prototype['set_Kerning'] = ASS_Track.prototype.set_Kerning = /** @suppress {undefinedVars, duplicate} */function(arg0) {
  var self = this.ptr;
  if (arg0 && typeof arg0 === 'object') arg0 = arg0.ptr;
  _emscripten_bind_ASS_Track_set_Kerning_1(self, arg0);
};
    Object.defineProperty(ASS_Track.prototype, 'Kerning', { get: ASS_Track.prototype.get_Kerning, set: ASS_Track.prototype.set_Kerning });
  ASS_Track.prototype['get_Language'] = ASS_Track.prototype.get_Language = /** @suppress {undefinedVars, duplicate} */function() {
  var self = this.ptr;
  return UTF8ToString(_emscripten_bind_ASS_Track_get_Language_0(self));
};
    ASS_Track.prototype['set_Language'] = ASS_Track.prototype.set_Language = /** @suppress {undefinedVars, duplicate} */function(arg0) {
  var self = this.ptr;
  ensureCache.prepare();
  if (arg0 && typeof arg0 === 'object') arg0 = arg0.ptr;
  else arg0 = ensureString(arg0);
  _emscripten_bind_ASS_Track_set_Language_1(self, arg0);
};
    Object.defineProperty(ASS_Track.prototype, 'Language', { get: ASS_Track.prototype.get_Language, set: ASS_Track.prototype.set_Language });
  ASS_Track.prototype['get_default_style'] = ASS_Track.prototype.get_default_style = /** @suppress {undefinedVars, duplicate} */function() {
  var self = this.ptr;
  return _emscripten_bind_ASS_Track_get_default_style_0(self);
};
    ASS_Track.prototype['set_default_style'] = ASS_Track.prototype.set_default_style = /** @suppress {undefinedVars, duplicate} */function(arg0) {
  var self = this.ptr;
  if (arg0 && typeof arg0 === 'object') arg0 = arg0.ptr;
  _emscripten_bind_ASS_Track_set_default_style_1(self, arg0);
};
    Object.defineProperty(ASS_Track.prototype, 'default_style', { get: ASS_Track.prototype.get_default_style, set: ASS_Track.prototype.set_default_style });
  ASS_Track.prototype['get_name'] = ASS_Track.prototype.get_name = /** @suppress {undefinedVars, duplicate} */function() {
  var self = this.ptr;
  return UTF8ToString(_emscripten_bind_ASS_Track_get_name_0(self));
};
    ASS_Track.prototype['set_name'] = ASS_Track.prototype.set_name = /** @suppress {undefinedVars, duplicate} */function(arg0) {
  var self = this.ptr;
  ensureCache.prepare();
  if (arg0 && typeof arg0 === 'object') arg0 = arg0.ptr;
  else arg0 = ensureString(arg0);
  _emscripten_bind_ASS_Track_set_name_1(self, arg0);
};
    Object.defineProperty(ASS_Track.prototype, 'name', { get: ASS_Track.prototype.get_name, set: ASS_Track.prototype.set_name });
// ASS_RenderPriv
/** @suppress {undefinedVars, duplicate} */function ASS_RenderPriv() { throw "cannot construct a ASS_RenderPriv, no constructor in IDL" }
ASS_RenderPriv.prototype = Object.create(WrapperObject.prototype);
ASS_RenderPriv.prototype.constructor = ASS_RenderPriv;
ASS_RenderPriv.prototype.__class__ = ASS_RenderPriv;
ASS_RenderPriv.__cache__ = {};
Module['ASS_RenderPriv'] = ASS_RenderPriv;

// ASS_Style
/** @suppress {undefinedVars, duplicate} */function ASS_Style() { throw "cannot construct a ASS_Style, no constructor in IDL" }
ASS_Style.prototype = Object.create(WrapperObject.prototype);
ASS_Style.prototype.constructor = ASS_Style;
ASS_Style.prototype.__class__ = ASS_Style;
ASS_Style.__cache__ = {};
Module['ASS_Style'] = ASS_Style;

  ASS_Style.prototype['get_Name'] = ASS_Style.prototype.get_Name = /** @suppress {undefinedVars, duplicate} */function() {
  var self = this.ptr;
  return UTF8ToString(_emscripten_bind_ASS_Style_get_Name_0(self));
};
    ASS_Style.prototype['set_Name'] = ASS_Style.prototype.set_Name = /** @suppress {undefinedVars, duplicate} */function(arg0) {
  var self = this.ptr;
  ensureCache.prepare();
  if (arg0 && typeof arg0 === 'object') arg0 = arg0.ptr;
  else arg0 = ensureString(arg0);
  _emscripten_bind_ASS_Style_set_Name_1(self, arg0);
};
    Object.defineProperty(ASS_Style.prototype, 'Name', { get: ASS_Style.prototype.get_Name, set: ASS_Style.prototype.set_Name });
  ASS_Style.prototype['get_FontName'] = ASS_Style.prototype.get_FontName = /** @suppress {undefinedVars, duplicate} */function() {
  var self = this.ptr;
  return UTF8ToString(_emscripten_bind_ASS_Style_get_FontName_0(self));
};
    ASS_Style.prototype['set_FontName'] = ASS_Style.prototype.set_FontName = /** @suppress {undefinedVars, duplicate} */function(arg0) {
  var self = this.ptr;
  ensureCache.prepare();
  if (arg0 && typeof arg0 === 'object') arg0 = arg0.ptr;
  else arg0 = ensureString(arg0);
  _emscripten_bind_ASS_Style_set_FontName_1(self, arg0);
};
    Object.defineProperty(ASS_Style.prototype, 'FontName', { get: ASS_Style.prototype.get_FontName, set: ASS_Style.prototype.set_FontName });
  ASS_Style.prototype['get_FontSize'] = ASS_Style.prototype.get_FontSize = /** @suppress {undefinedVars, duplicate} */function() {
  var self = this.ptr;
  return _emscripten_bind_ASS_Style_get_FontSize_0(self);
};
    ASS_Style.prototype['set_FontSize'] = ASS_Style.prototype.set_FontSize = /** @suppress {undefinedVars, duplicate} */function(arg0) {
  var self = this.ptr;
  if (arg0 && typeof arg0 === 'object') arg0 = arg0.ptr;
  _emscripten_bind_ASS_Style_set_FontSize_1(self, arg0);
};
    Object.defineProperty(ASS_Style.prototype, 'FontSize', { get: ASS_Style.prototype.get_FontSize, set: ASS_Style.prototype.set_FontSize });
  ASS_Style.prototype['get_PrimaryColour'] = ASS_Style.prototype.get_PrimaryColour = /** @suppress {undefinedVars, duplicate} */function() {
  var self = this.ptr;
  return _emscripten_bind_ASS_Style_get_PrimaryColour_0(self);
};
    ASS_Style.prototype['set_PrimaryColour'] = ASS_Style.prototype.set_PrimaryColour = /** @suppress {undefinedVars, duplicate} */function(arg0) {
  var self = this.ptr;
  if (arg0 && typeof arg0 === 'object') arg0 = arg0.ptr;
  _emscripten_bind_ASS_Style_set_PrimaryColour_1(self, arg0);
};
    Object.defineProperty(ASS_Style.prototype, 'PrimaryColour', { get: ASS_Style.prototype.get_PrimaryColour, set: ASS_Style.prototype.set_PrimaryColour });
  ASS_Style.prototype['get_SecondaryColour'] = ASS_Style.prototype.get_SecondaryColour = /** @suppress {undefinedVars, duplicate} */function() {
  var self = this.ptr;
  return _emscripten_bind_ASS_Style_get_SecondaryColour_0(self);
};
    ASS_Style.prototype['set_SecondaryColour'] = ASS_Style.prototype.set_SecondaryColour = /** @suppress {undefinedVars, duplicate} */function(arg0) {
  var self = this.ptr;
  if (arg0 && typeof arg0 === 'object') arg0 = arg0.ptr;
  _emscripten_bind_ASS_Style_set_SecondaryColour_1(self, arg0);
};
    Object.defineProperty(ASS_Style.prototype, 'SecondaryColour', { get: ASS_Style.prototype.get_SecondaryColour, set: ASS_Style.prototype.set_SecondaryColour });
  ASS_Style.prototype['get_OutlineColour'] = ASS_Style.prototype.get_OutlineColour = /** @suppress {undefinedVars, duplicate} */function() {
  var self = this.ptr;
  return _emscripten_bind_ASS_Style_get_OutlineColour_0(self);
};
    ASS_Style.prototype['set_OutlineColour'] = ASS_Style.prototype.set_OutlineColour = /** @suppress {undefinedVars, duplicate} */function(arg0) {
  var self = this.ptr;
  if (arg0 && typeof arg0 === 'object') arg0 = arg0.ptr;
  _emscripten_bind_ASS_Style_set_OutlineColour_1(self, arg0);
};
    Object.defineProperty(ASS_Style.prototype, 'OutlineColour', { get: ASS_Style.prototype.get_OutlineColour, set: ASS_Style.prototype.set_OutlineColour });
  ASS_Style.prototype['get_BackColour'] = ASS_Style.prototype.get_BackColour = /** @suppress {undefinedVars, duplicate} */function() {
  var self = this.ptr;
  return _emscripten_bind_ASS_Style_get_BackColour_0(self);
};
    ASS_Style.prototype['set_BackColour'] = ASS_Style.prototype.set_BackColour = /** @suppress {undefinedVars, duplicate} */function(arg0) {
  var self = this.ptr;
  if (arg0 && typeof arg0 === 'object') arg0 = arg0.ptr;
  _emscripten_bind_ASS_Style_set_BackColour_1(self, arg0);
};
    Object.defineProperty(ASS_Style.prototype, 'BackColour', { get: ASS_Style.prototype.get_BackColour, set: ASS_Style.prototype.set_BackColour });
  ASS_Style.prototype['get_Bold'] = ASS_Style.prototype.get_Bold = /** @suppress {undefinedVars, duplicate} */function() {
  var self = this.ptr;
  return _emscripten_bind_ASS_Style_get_Bold_0(self);
};
    ASS_Style.prototype['set_Bold'] = ASS_Style.prototype.set_Bold = /** @suppress {undefinedVars, duplicate} */function(arg0) {
  var self = this.ptr;
  if (arg0 && typeof arg0 === 'object') arg0 = arg0.ptr;
  _emscripten_bind_ASS_Style_set_Bold_1(self, arg0);
};
    Object.defineProperty(ASS_Style.prototype, 'Bold', { get: ASS_Style.prototype.get_Bold, set: ASS_Style.prototype.set_Bold });
  ASS_Style.prototype['get_Italic'] = ASS_Style.prototype.get_Italic = /** @suppress {undefinedVars, duplicate} */function() {
  var self = this.ptr;
  return _emscripten_bind_ASS_Style_get_Italic_0(self);
};
    ASS_Style.prototype['set_Italic'] = ASS_Style.prototype.set_Italic = /** @suppress {undefinedVars, duplicate} */function(arg0) {
  var self = this.ptr;
  if (arg0 && typeof arg0 === 'object') arg0 = arg0.ptr;
  _emscripten_bind_ASS_Style_set_Italic_1(self, arg0);
};
    Object.defineProperty(ASS_Style.prototype, 'Italic', { get: ASS_Style.prototype.get_Italic, set: ASS_Style.prototype.set_Italic });
  ASS_Style.prototype['get_Underline'] = ASS_Style.prototype.get_Underline = /** @suppress {undefinedVars, duplicate} */function() {
  var self = this.ptr;
  return _emscripten_bind_ASS_Style_get_Underline_0(self);
};
    ASS_Style.prototype['set_Underline'] = ASS_Style.prototype.set_Underline = /** @suppress {undefinedVars, duplicate} */function(arg0) {
  var self = this.ptr;
  if (arg0 && typeof arg0 === 'object') arg0 = arg0.ptr;
  _emscripten_bind_ASS_Style_set_Underline_1(self, arg0);
};
    Object.defineProperty(ASS_Style.prototype, 'Underline', { get: ASS_Style.prototype.get_Underline, set: ASS_Style.prototype.set_Underline });
  ASS_Style.prototype['get_StrikeOut'] = ASS_Style.prototype.get_StrikeOut = /** @suppress {undefinedVars, duplicate} */function() {
  var self = this.ptr;
  return _emscripten_bind_ASS_Style_get_StrikeOut_0(self);
};
    ASS_Style.prototype['set_StrikeOut'] = ASS_Style.prototype.set_StrikeOut = /** @suppress {undefinedVars, duplicate} */function(arg0) {
  var self = this.ptr;
  if (arg0 && typeof arg0 === 'object') arg0 = arg0.ptr;
  _emscripten_bind_ASS_Style_set_StrikeOut_1(self, arg0);
};
    Object.defineProperty(ASS_Style.prototype, 'StrikeOut', { get: ASS_Style.prototype.get_StrikeOut, set: ASS_Style.prototype.set_StrikeOut });
  ASS_Style.prototype['get_ScaleX'] = ASS_Style.prototype.get_ScaleX = /** @suppress {undefinedVars, duplicate} */function() {
  var self = this.ptr;
  return _emscripten_bind_ASS_Style_get_ScaleX_0(self);
};
    ASS_Style.prototype['set_ScaleX'] = ASS_Style.prototype.set_ScaleX = /** @suppress {undefinedVars, duplicate} */function(arg0) {
  var self = this.ptr;
  if (arg0 && typeof arg0 === 'object') arg0 = arg0.ptr;
  _emscripten_bind_ASS_Style_set_ScaleX_1(self, arg0);
};
    Object.defineProperty(ASS_Style.prototype, 'ScaleX', { get: ASS_Style.prototype.get_ScaleX, set: ASS_Style.prototype.set_ScaleX });
  ASS_Style.prototype['get_ScaleY'] = ASS_Style.prototype.get_ScaleY = /** @suppress {undefinedVars, duplicate} */function() {
  var self = this.ptr;
  return _emscripten_bind_ASS_Style_get_ScaleY_0(self);
};
    ASS_Style.prototype['set_ScaleY'] = ASS_Style.prototype.set_ScaleY = /** @suppress {undefinedVars, duplicate} */function(arg0) {
  var self = this.ptr;
  if (arg0 && typeof arg0 === 'object') arg0 = arg0.ptr;
  _emscripten_bind_ASS_Style_set_ScaleY_1(self, arg0);
};
    Object.defineProperty(ASS_Style.prototype, 'ScaleY', { get: ASS_Style.prototype.get_ScaleY, set: ASS_Style.prototype.set_ScaleY });
  ASS_Style.prototype['get_Spacing'] = ASS_Style.prototype.get_Spacing = /** @suppress {undefinedVars, duplicate} */function() {
  var self = this.ptr;
  return _emscripten_bind_ASS_Style_get_Spacing_0(self);
};
    ASS_Style.prototype['set_Spacing'] = ASS_Style.prototype.set_Spacing = /** @suppress {undefinedVars, duplicate} */function(arg0) {
  var self = this.ptr;
  if (arg0 && typeof arg0 === 'object') arg0 = arg0.ptr;
  _emscripten_bind_ASS_Style_set_Spacing_1(self, arg0);
};
    Object.defineProperty(ASS_Style.prototype, 'Spacing', { get: ASS_Style.prototype.get_Spacing, set: ASS_Style.prototype.set_Spacing });
  ASS_Style.prototype['get_Angle'] = ASS_Style.prototype.get_Angle = /** @suppress {undefinedVars, duplicate} */function() {
  var self = this.ptr;
  return _emscripten_bind_ASS_Style_get_Angle_0(self);
};
    ASS_Style.prototype['set_Angle'] = ASS_Style.prototype.set_Angle = /** @suppress {undefinedVars, duplicate} */function(arg0) {
  var self = this.ptr;
  if (arg0 && typeof arg0 === 'object') arg0 = arg0.ptr;
  _emscripten_bind_ASS_Style_set_Angle_1(self, arg0);
};
    Object.defineProperty(ASS_Style.prototype, 'Angle', { get: ASS_Style.prototype.get_Angle, set: ASS_Style.prototype.set_Angle });
  ASS_Style.prototype['get_BorderStyle'] = ASS_Style.prototype.get_BorderStyle = /** @suppress {undefinedVars, duplicate} */function() {
  var self = this.ptr;
  return _emscripten_bind_ASS_Style_get_BorderStyle_0(self);
};
    ASS_Style.prototype['set_BorderStyle'] = ASS_Style.prototype.set_BorderStyle = /** @suppress {undefinedVars, duplicate} */function(arg0) {
  var self = this.ptr;
  if (arg0 && typeof arg0 === 'object') arg0 = arg0.ptr;
  _emscripten_bind_ASS_Style_set_BorderStyle_1(self, arg0);
};
    Object.defineProperty(ASS_Style.prototype, 'BorderStyle', { get: ASS_Style.prototype.get_BorderStyle, set: ASS_Style.prototype.set_BorderStyle });
  ASS_Style.prototype['get_Outline'] = ASS_Style.prototype.get_Outline = /** @suppress {undefinedVars, duplicate} */function() {
  var self = this.ptr;
  return _emscripten_bind_ASS_Style_get_Outline_0(self);
};
    ASS_Style.prototype['set_Outline'] = ASS_Style.prototype.set_Outline = /** @suppress {undefinedVars, duplicate} */function(arg0) {
  var self = this.ptr;
  if (arg0 && typeof arg0 === 'object') arg0 = arg0.ptr;
  _emscripten_bind_ASS_Style_set_Outline_1(self, arg0);
};
    Object.defineProperty(ASS_Style.prototype, 'Outline', { get: ASS_Style.prototype.get_Outline, set: ASS_Style.prototype.set_Outline });
  ASS_Style.prototype['get_Shadow'] = ASS_Style.prototype.get_Shadow = /** @suppress {undefinedVars, duplicate} */function() {
  var self = this.ptr;
  return _emscripten_bind_ASS_Style_get_Shadow_0(self);
};
    ASS_Style.prototype['set_Shadow'] = ASS_Style.prototype.set_Shadow = /** @suppress {undefinedVars, duplicate} */function(arg0) {
  var self = this.ptr;
  if (arg0 && typeof arg0 === 'object') arg0 = arg0.ptr;
  _emscripten_bind_ASS_Style_set_Shadow_1(self, arg0);
};
    Object.defineProperty(ASS_Style.prototype, 'Shadow', { get: ASS_Style.prototype.get_Shadow, set: ASS_Style.prototype.set_Shadow });
  ASS_Style.prototype['get_Alignment'] = ASS_Style.prototype.get_Alignment = /** @suppress {undefinedVars, duplicate} */function() {
  var self = this.ptr;
  return _emscripten_bind_ASS_Style_get_Alignment_0(self);
};
    ASS_Style.prototype['set_Alignment'] = ASS_Style.prototype.set_Alignment = /** @suppress {undefinedVars, duplicate} */function(arg0) {
  var self = this.ptr;
  if (arg0 && typeof arg0 === 'object') arg0 = arg0.ptr;
  _emscripten_bind_ASS_Style_set_Alignment_1(self, arg0);
};
    Object.defineProperty(ASS_Style.prototype, 'Alignment', { get: ASS_Style.prototype.get_Alignment, set: ASS_Style.prototype.set_Alignment });
  ASS_Style.prototype['get_MarginL'] = ASS_Style.prototype.get_MarginL = /** @suppress {undefinedVars, duplicate} */function() {
  var self = this.ptr;
  return _emscripten_bind_ASS_Style_get_MarginL_0(self);
};
    ASS_Style.prototype['set_MarginL'] = ASS_Style.prototype.set_MarginL = /** @suppress {undefinedVars, duplicate} */function(arg0) {
  var self = this.ptr;
  if (arg0 && typeof arg0 === 'object') arg0 = arg0.ptr;
  _emscripten_bind_ASS_Style_set_MarginL_1(self, arg0);
};
    Object.defineProperty(ASS_Style.prototype, 'MarginL', { get: ASS_Style.prototype.get_MarginL, set: ASS_Style.prototype.set_MarginL });
  ASS_Style.prototype['get_MarginR'] = ASS_Style.prototype.get_MarginR = /** @suppress {undefinedVars, duplicate} */function() {
  var self = this.ptr;
  return _emscripten_bind_ASS_Style_get_MarginR_0(self);
};
    ASS_Style.prototype['set_MarginR'] = ASS_Style.prototype.set_MarginR = /** @suppress {undefinedVars, duplicate} */function(arg0) {
  var self = this.ptr;
  if (arg0 && typeof arg0 === 'object') arg0 = arg0.ptr;
  _emscripten_bind_ASS_Style_set_MarginR_1(self, arg0);
};
    Object.defineProperty(ASS_Style.prototype, 'MarginR', { get: ASS_Style.prototype.get_MarginR, set: ASS_Style.prototype.set_MarginR });
  ASS_Style.prototype['get_MarginV'] = ASS_Style.prototype.get_MarginV = /** @suppress {undefinedVars, duplicate} */function() {
  var self = this.ptr;
  return _emscripten_bind_ASS_Style_get_MarginV_0(self);
};
    ASS_Style.prototype['set_MarginV'] = ASS_Style.prototype.set_MarginV = /** @suppress {undefinedVars, duplicate} */function(arg0) {
  var self = this.ptr;
  if (arg0 && typeof arg0 === 'object') arg0 = arg0.ptr;
  _emscripten_bind_ASS_Style_set_MarginV_1(self, arg0);
};
    Object.defineProperty(ASS_Style.prototype, 'MarginV', { get: ASS_Style.prototype.get_MarginV, set: ASS_Style.prototype.set_MarginV });
  ASS_Style.prototype['get_Encoding'] = ASS_Style.prototype.get_Encoding = /** @suppress {undefinedVars, duplicate} */function() {
  var self = this.ptr;
  return _emscripten_bind_ASS_Style_get_Encoding_0(self);
};
    ASS_Style.prototype['set_Encoding'] = ASS_Style.prototype.set_Encoding = /** @suppress {undefinedVars, duplicate} */function(arg0) {
  var self = this.ptr;
  if (arg0 && typeof arg0 === 'object') arg0 = arg0.ptr;
  _emscripten_bind_ASS_Style_set_Encoding_1(self, arg0);
};
    Object.defineProperty(ASS_Style.prototype, 'Encoding', { get: ASS_Style.prototype.get_Encoding, set: ASS_Style.prototype.set_Encoding });
  ASS_Style.prototype['get_treat_fontname_as_pattern'] = ASS_Style.prototype.get_treat_fontname_as_pattern = /** @suppress {undefinedVars, duplicate} */function() {
  var self = this.ptr;
  return _emscripten_bind_ASS_Style_get_treat_fontname_as_pattern_0(self);
};
    ASS_Style.prototype['set_treat_fontname_as_pattern'] = ASS_Style.prototype.set_treat_fontname_as_pattern = /** @suppress {undefinedVars, duplicate} */function(arg0) {
  var self = this.ptr;
  if (arg0 && typeof arg0 === 'object') arg0 = arg0.ptr;
  _emscripten_bind_ASS_Style_set_treat_fontname_as_pattern_1(self, arg0);
};
    Object.defineProperty(ASS_Style.prototype, 'treat_fontname_as_pattern', { get: ASS_Style.prototype.get_treat_fontname_as_pattern, set: ASS_Style.prototype.set_treat_fontname_as_pattern });
  ASS_Style.prototype['get_Blur'] = ASS_Style.prototype.get_Blur = /** @suppress {undefinedVars, duplicate} */function() {
  var self = this.ptr;
  return _emscripten_bind_ASS_Style_get_Blur_0(self);
};
    ASS_Style.prototype['set_Blur'] = ASS_Style.prototype.set_Blur = /** @suppress {undefinedVars, duplicate} */function(arg0) {
  var self = this.ptr;
  if (arg0 && typeof arg0 === 'object') arg0 = arg0.ptr;
  _emscripten_bind_ASS_Style_set_Blur_1(self, arg0);
};
    Object.defineProperty(ASS_Style.prototype, 'Blur', { get: ASS_Style.prototype.get_Blur, set: ASS_Style.prototype.set_Blur });
  ASS_Style.prototype['get_Justify'] = ASS_Style.prototype.get_Justify = /** @suppress {undefinedVars, duplicate} */function() {
  var self = this.ptr;
  return _emscripten_bind_ASS_Style_get_Justify_0(self);
};
    ASS_Style.prototype['set_Justify'] = ASS_Style.prototype.set_Justify = /** @suppress {undefinedVars, duplicate} */function(arg0) {
  var self = this.ptr;
  if (arg0 && typeof arg0 === 'object') arg0 = arg0.ptr;
  _emscripten_bind_ASS_Style_set_Justify_1(self, arg0);
};
    Object.defineProperty(ASS_Style.prototype, 'Justify', { get: ASS_Style.prototype.get_Justify, set: ASS_Style.prototype.set_Justify });
// ASS_Image
/** @suppress {undefinedVars, duplicate} */function ASS_Image() { throw "cannot construct a ASS_Image, no constructor in IDL" }
ASS_Image.prototype = Object.create(WrapperObject.prototype);
ASS_Image.prototype.constructor = ASS_Image;
ASS_Image.prototype.__class__ = ASS_Image;
ASS_Image.__cache__ = {};
Module['ASS_Image'] = ASS_Image;

  ASS_Image.prototype['get_w'] = ASS_Image.prototype.get_w = /** @suppress {undefinedVars, duplicate} */function() {
  var self = this.ptr;
  return _emscripten_bind_ASS_Image_get_w_0(self);
};
    ASS_Image.prototype['set_w'] = ASS_Image.prototype.set_w = /** @suppress {undefinedVars, duplicate} */function(arg0) {
  var self = this.ptr;
  if (arg0 && typeof arg0 === 'object') arg0 = arg0.ptr;
  _emscripten_bind_ASS_Image_set_w_1(self, arg0);
};
    Object.defineProperty(ASS_Image.prototype, 'w', { get: ASS_Image.prototype.get_w, set: ASS_Image.prototype.set_w });
  ASS_Image.prototype['get_h'] = ASS_Image.prototype.get_h = /** @suppress {undefinedVars, duplicate} */function() {
  var self = this.ptr;
  return _emscripten_bind_ASS_Image_get_h_0(self);
};
    ASS_Image.prototype['set_h'] = ASS_Image.prototype.set_h = /** @suppress {undefinedVars, duplicate} */function(arg0) {
  var self = this.ptr;
  if (arg0 && typeof arg0 === 'object') arg0 = arg0.ptr;
  _emscripten_bind_ASS_Image_set_h_1(self, arg0);
};
    Object.defineProperty(ASS_Image.prototype, 'h', { get: ASS_Image.prototype.get_h, set: ASS_Image.prototype.set_h });
  ASS_Image.prototype['get_stride'] = ASS_Image.prototype.get_stride = /** @suppress {undefinedVars, duplicate} */function() {
  var self = this.ptr;
  return _emscripten_bind_ASS_Image_get_stride_0(self);
};
    ASS_Image.prototype['set_stride'] = ASS_Image.prototype.set_stride = /** @suppress {undefinedVars, duplicate} */function(arg0) {
  var self = this.ptr;
  if (arg0 && typeof arg0 === 'object') arg0 = arg0.ptr;
  _emscripten_bind_ASS_Image_set_stride_1(self, arg0);
};
    Object.defineProperty(ASS_Image.prototype, 'stride', { get: ASS_Image.prototype.get_stride, set: ASS_Image.prototype.set_stride });
  ASS_Image.prototype['get_bitmap'] = ASS_Image.prototype.get_bitmap = /** @suppress {undefinedVars, duplicate} */function() {
  var self = this.ptr;
  return _emscripten_bind_ASS_Image_get_bitmap_0(self);
};
    ASS_Image.prototype['set_bitmap'] = ASS_Image.prototype.set_bitmap = /** @suppress {undefinedVars, duplicate} */function(arg0) {
  var self = this.ptr;
  ensureCache.prepare();
  if (arg0 && typeof arg0 === 'object') arg0 = arg0.ptr;
  else arg0 = ensureString(arg0);
  _emscripten_bind_ASS_Image_set_bitmap_1(self, arg0);
};
    Object.defineProperty(ASS_Image.prototype, 'bitmap', { get: ASS_Image.prototype.get_bitmap, set: ASS_Image.prototype.set_bitmap });
  ASS_Image.prototype['get_color'] = ASS_Image.prototype.get_color = /** @suppress {undefinedVars, duplicate} */function() {
  var self = this.ptr;
  return _emscripten_bind_ASS_Image_get_color_0(self);
};
    ASS_Image.prototype['set_color'] = ASS_Image.prototype.set_color = /** @suppress {undefinedVars, duplicate} */function(arg0) {
  var self = this.ptr;
  if (arg0 && typeof arg0 === 'object') arg0 = arg0.ptr;
  _emscripten_bind_ASS_Image_set_color_1(self, arg0);
};
    Object.defineProperty(ASS_Image.prototype, 'color', { get: ASS_Image.prototype.get_color, set: ASS_Image.prototype.set_color });
  ASS_Image.prototype['get_dst_x'] = ASS_Image.prototype.get_dst_x = /** @suppress {undefinedVars, duplicate} */function() {
  var self = this.ptr;
  return _emscripten_bind_ASS_Image_get_dst_x_0(self);
};
    ASS_Image.prototype['set_dst_x'] = ASS_Image.prototype.set_dst_x = /** @suppress {undefinedVars, duplicate} */function(arg0) {
  var self = this.ptr;
  if (arg0 && typeof arg0 === 'object') arg0 = arg0.ptr;
  _emscripten_bind_ASS_Image_set_dst_x_1(self, arg0);
};
    Object.defineProperty(ASS_Image.prototype, 'dst_x', { get: ASS_Image.prototype.get_dst_x, set: ASS_Image.prototype.set_dst_x });
  ASS_Image.prototype['get_dst_y'] = ASS_Image.prototype.get_dst_y = /** @suppress {undefinedVars, duplicate} */function() {
  var self = this.ptr;
  return _emscripten_bind_ASS_Image_get_dst_y_0(self);
};
    ASS_Image.prototype['set_dst_y'] = ASS_Image.prototype.set_dst_y = /** @suppress {undefinedVars, duplicate} */function(arg0) {
  var self = this.ptr;
  if (arg0 && typeof arg0 === 'object') arg0 = arg0.ptr;
  _emscripten_bind_ASS_Image_set_dst_y_1(self, arg0);
};
    Object.defineProperty(ASS_Image.prototype, 'dst_y', { get: ASS_Image.prototype.get_dst_y, set: ASS_Image.prototype.set_dst_y });
  ASS_Image.prototype['get_next'] = ASS_Image.prototype.get_next = /** @suppress {undefinedVars, duplicate} */function() {
  var self = this.ptr;
  return wrapPointer(_emscripten_bind_ASS_Image_get_next_0(self), ASS_Image);
};
    ASS_Image.prototype['set_next'] = ASS_Image.prototype.set_next = /** @suppress {undefinedVars, duplicate} */function(arg0) {
  var self = this.ptr;
  if (arg0 && typeof arg0 === 'object') arg0 = arg0.ptr;
  _emscripten_bind_ASS_Image_set_next_1(self, arg0);
};
    Object.defineProperty(ASS_Image.prototype, 'next', { get: ASS_Image.prototype.get_next, set: ASS_Image.prototype.set_next });
// VoidPtr
/** @suppress {undefinedVars, duplicate} */function VoidPtr() { throw "cannot construct a VoidPtr, no constructor in IDL" }
VoidPtr.prototype = Object.create(WrapperObject.prototype);
VoidPtr.prototype.constructor = VoidPtr;
VoidPtr.prototype.__class__ = VoidPtr;
VoidPtr.__cache__ = {};
Module['VoidPtr'] = VoidPtr;

  VoidPtr.prototype['__destroy__'] = VoidPtr.prototype.__destroy__ = /** @suppress {undefinedVars, duplicate} */function() {
  var self = this.ptr;
  _emscripten_bind_VoidPtr___destroy___0(self);
};
// ASS_Library
/** @suppress {undefinedVars, duplicate} */function ASS_Library() { throw "cannot construct a ASS_Library, no constructor in IDL" }
ASS_Library.prototype = Object.create(WrapperObject.prototype);
ASS_Library.prototype.constructor = ASS_Library;
ASS_Library.prototype.__class__ = ASS_Library;
ASS_Library.__cache__ = {};
Module['ASS_Library'] = ASS_Library;

// libass
/** @suppress {undefinedVars, duplicate} */function libass() {
  this.ptr = _emscripten_bind_libass_libass_0();
  getCache(libass)[this.ptr] = this;
};;
libass.prototype = Object.create(WrapperObject.prototype);
libass.prototype.constructor = libass;
libass.prototype.__class__ = libass;
libass.__cache__ = {};
Module['libass'] = libass;

libass.prototype['oct_library_version'] = libass.prototype.oct_library_version = /** @suppress {undefinedVars, duplicate} */function() {
  var self = this.ptr;
  return _emscripten_bind_libass_oct_library_version_0(self);
};;

libass.prototype['oct_library_init'] = libass.prototype.oct_library_init = /** @suppress {undefinedVars, duplicate} */function() {
  var self = this.ptr;
  return wrapPointer(_emscripten_bind_libass_oct_library_init_0(self), ASS_Library);
};;

libass.prototype['oct_library_done'] = libass.prototype.oct_library_done = /** @suppress {undefinedVars, duplicate} */function(priv) {
  var self = this.ptr;
  if (priv && typeof priv === 'object') priv = priv.ptr;
  _emscripten_bind_libass_oct_library_done_1(self, priv);
};;

libass.prototype['oct_set_fonts_dir'] = libass.prototype.oct_set_fonts_dir = /** @suppress {undefinedVars, duplicate} */function(priv, fonts_dir) {
  var self = this.ptr;
  ensureCache.prepare();
  if (priv && typeof priv === 'object') priv = priv.ptr;
  if (fonts_dir && typeof fonts_dir === 'object') fonts_dir = fonts_dir.ptr;
  else fonts_dir = ensureString(fonts_dir);
  _emscripten_bind_libass_oct_set_fonts_dir_2(self, priv, fonts_dir);
};;

libass.prototype['oct_set_extract_fonts'] = libass.prototype.oct_set_extract_fonts = /** @suppress {undefinedVars, duplicate} */function(priv, extract) {
  var self = this.ptr;
  if (priv && typeof priv === 'object') priv = priv.ptr;
  if (extract && typeof extract === 'object') extract = extract.ptr;
  _emscripten_bind_libass_oct_set_extract_fonts_2(self, priv, extract);
};;

libass.prototype['oct_set_style_overrides'] = libass.prototype.oct_set_style_overrides = /** @suppress {undefinedVars, duplicate} */function(priv, list) {
  var self = this.ptr;
  ensureCache.prepare();
  if (priv && typeof priv === 'object') priv = priv.ptr;
  _emscripten_bind_libass_oct_set_style_overrides_2(self, priv, list);
};;

libass.prototype['oct_process_force_style'] = libass.prototype.oct_process_force_style = /** @suppress {undefinedVars, duplicate} */function(track) {
  var self = this.ptr;
  if (track && typeof track === 'object') track = track.ptr;
  _emscripten_bind_libass_oct_process_force_style_1(self, track);
};;

libass.prototype['oct_renderer_init'] = libass.prototype.oct_renderer_init = /** @suppress {undefinedVars, duplicate} */function(priv) {
  var self = this.ptr;
  if (priv && typeof priv === 'object') priv = priv.ptr;
  return wrapPointer(_emscripten_bind_libass_oct_renderer_init_1(self, priv), ASS_Renderer);
};;

libass.prototype['oct_renderer_done'] = libass.prototype.oct_renderer_done = /** @suppress {undefinedVars, duplicate} */function(priv) {
  var self = this.ptr;
  if (priv && typeof priv === 'object') priv = priv.ptr;
  _emscripten_bind_libass_oct_renderer_done_1(self, priv);
};;

libass.prototype['oct_set_frame_size'] = libass.prototype.oct_set_frame_size = /** @suppress {undefinedVars, duplicate} */function(priv, w, h) {
  var self = this.ptr;
  if (priv && typeof priv === 'object') priv = priv.ptr;
  if (w && typeof w === 'object') w = w.ptr;
  if (h && typeof h === 'object') h = h.ptr;
  _emscripten_bind_libass_oct_set_frame_size_3(self, priv, w, h);
};;

libass.prototype['oct_set_storage_size'] = libass.prototype.oct_set_storage_size = /** @suppress {undefinedVars, duplicate} */function(priv, w, h) {
  var self = this.ptr;
  if (priv && typeof priv === 'object') priv = priv.ptr;
  if (w && typeof w === 'object') w = w.ptr;
  if (h && typeof h === 'object') h = h.ptr;
  _emscripten_bind_libass_oct_set_storage_size_3(self, priv, w, h);
};;

libass.prototype['oct_set_shaper'] = libass.prototype.oct_set_shaper = /** @suppress {undefinedVars, duplicate} */function(priv, level) {
  var self = this.ptr;
  if (priv && typeof priv === 'object') priv = priv.ptr;
  if (level && typeof level === 'object') level = level.ptr;
  _emscripten_bind_libass_oct_set_shaper_2(self, priv, level);
};;

libass.prototype['oct_set_margins'] = libass.prototype.oct_set_margins = /** @suppress {undefinedVars, duplicate} */function(priv, t, b, l, r) {
  var self = this.ptr;
  if (priv && typeof priv === 'object') priv = priv.ptr;
  if (t && typeof t === 'object') t = t.ptr;
  if (b && typeof b === 'object') b = b.ptr;
  if (l && typeof l === 'object') l = l.ptr;
  if (r && typeof r === 'object') r = r.ptr;
  _emscripten_bind_libass_oct_set_margins_5(self, priv, t, b, l, r);
};;

libass.prototype['oct_set_use_margins'] = libass.prototype.oct_set_use_margins = /** @suppress {undefinedVars, duplicate} */function(priv, use) {
  var self = this.ptr;
  if (priv && typeof priv === 'object') priv = priv.ptr;
  if (use && typeof use === 'object') use = use.ptr;
  _emscripten_bind_libass_oct_set_use_margins_2(self, priv, use);
};;

libass.prototype['oct_set_pixel_aspect'] = libass.prototype.oct_set_pixel_aspect = /** @suppress {undefinedVars, duplicate} */function(priv, par) {
  var self = this.ptr;
  if (priv && typeof priv === 'object') priv = priv.ptr;
  if (par && typeof par === 'object') par = par.ptr;
  _emscripten_bind_libass_oct_set_pixel_aspect_2(self, priv, par);
};;

libass.prototype['oct_set_aspect_ratio'] = libass.prototype.oct_set_aspect_ratio = /** @suppress {undefinedVars, duplicate} */function(priv, dar, sar) {
  var self = this.ptr;
  if (priv && typeof priv === 'object') priv = priv.ptr;
  if (dar && typeof dar === 'object') dar = dar.ptr;
  if (sar && typeof sar === 'object') sar = sar.ptr;
  _emscripten_bind_libass_oct_set_aspect_ratio_3(self, priv, dar, sar);
};;

libass.prototype['oct_set_font_scale'] = libass.prototype.oct_set_font_scale = /** @suppress {undefinedVars, duplicate} */function(priv, font_scale) {
  var self = this.ptr;
  if (priv && typeof priv === 'object') priv = priv.ptr;
  if (font_scale && typeof font_scale === 'object') font_scale = font_scale.ptr;
  _emscripten_bind_libass_oct_set_font_scale_2(self, priv, font_scale);
};;

libass.prototype['oct_set_hinting'] = libass.prototype.oct_set_hinting = /** @suppress {undefinedVars, duplicate} */function(priv, ht) {
  var self = this.ptr;
  if (priv && typeof priv === 'object') priv = priv.ptr;
  if (ht && typeof ht === 'object') ht = ht.ptr;
  _emscripten_bind_libass_oct_set_hinting_2(self, priv, ht);
};;

libass.prototype['oct_set_line_spacing'] = libass.prototype.oct_set_line_spacing = /** @suppress {undefinedVars, duplicate} */function(priv, line_spacing) {
  var self = this.ptr;
  if (priv && typeof priv === 'object') priv = priv.ptr;
  if (line_spacing && typeof line_spacing === 'object') line_spacing = line_spacing.ptr;
  _emscripten_bind_libass_oct_set_line_spacing_2(self, priv, line_spacing);
};;

libass.prototype['oct_set_line_position'] = libass.prototype.oct_set_line_position = /** @suppress {undefinedVars, duplicate} */function(priv, line_position) {
  var self = this.ptr;
  if (priv && typeof priv === 'object') priv = priv.ptr;
  if (line_position && typeof line_position === 'object') line_position = line_position.ptr;
  _emscripten_bind_libass_oct_set_line_position_2(self, priv, line_position);
};;

libass.prototype['oct_set_fonts'] = libass.prototype.oct_set_fonts = /** @suppress {undefinedVars, duplicate} */function(priv, default_font, default_family, dfp, config, update) {
  var self = this.ptr;
  ensureCache.prepare();
  if (priv && typeof priv === 'object') priv = priv.ptr;
  if (default_font && typeof default_font === 'object') default_font = default_font.ptr;
  else default_font = ensureString(default_font);
  if (default_family && typeof default_family === 'object') default_family = default_family.ptr;
  else default_family = ensureString(default_family);
  if (dfp && typeof dfp === 'object') dfp = dfp.ptr;
  if (config && typeof config === 'object') config = config.ptr;
  else config = ensureString(config);
  if (update && typeof update === 'object') update = update.ptr;
  _emscripten_bind_libass_oct_set_fonts_6(self, priv, default_font, default_family, dfp, config, update);
};;

libass.prototype['oct_set_selective_style_override_enabled'] = libass.prototype.oct_set_selective_style_override_enabled = /** @suppress {undefinedVars, duplicate} */function(priv, bits) {
  var self = this.ptr;
  if (priv && typeof priv === 'object') priv = priv.ptr;
  if (bits && typeof bits === 'object') bits = bits.ptr;
  _emscripten_bind_libass_oct_set_selective_style_override_enabled_2(self, priv, bits);
};;

libass.prototype['oct_set_selective_style_override'] = libass.prototype.oct_set_selective_style_override = /** @suppress {undefinedVars, duplicate} */function(priv, style) {
  var self = this.ptr;
  if (priv && typeof priv === 'object') priv = priv.ptr;
  if (style && typeof style === 'object') style = style.ptr;
  _emscripten_bind_libass_oct_set_selective_style_override_2(self, priv, style);
};;

libass.prototype['oct_set_cache_limits'] = libass.prototype.oct_set_cache_limits = /** @suppress {undefinedVars, duplicate} */function(priv, glyph_max, bitmap_max_size) {
  var self = this.ptr;
  if (priv && typeof priv === 'object') priv = priv.ptr;
  if (glyph_max && typeof glyph_max === 'object') glyph_max = glyph_max.ptr;
  if (bitmap_max_size && typeof bitmap_max_size === 'object') bitmap_max_size = bitmap_max_size.ptr;
  _emscripten_bind_libass_oct_set_cache_limits_3(self, priv, glyph_max, bitmap_max_size);
};;

libass.prototype['oct_render_frame'] = libass.prototype.oct_render_frame = /** @suppress {undefinedVars, duplicate} */function(priv, track, now, detect_change) {
  var self = this.ptr;
  if (priv && typeof priv === 'object') priv = priv.ptr;
  if (track && typeof track === 'object') track = track.ptr;
  if (now && typeof now === 'object') now = now.ptr;
  if (detect_change && typeof detect_change === 'object') detect_change = detect_change.ptr;
  return wrapPointer(_emscripten_bind_libass_oct_render_frame_4(self, priv, track, now, detect_change), ASS_Image);
};;

libass.prototype['oct_new_track'] = libass.prototype.oct_new_track = /** @suppress {undefinedVars, duplicate} */function(priv) {
  var self = this.ptr;
  if (priv && typeof priv === 'object') priv = priv.ptr;
  return wrapPointer(_emscripten_bind_libass_oct_new_track_1(self, priv), ASS_Track);
};;

libass.prototype['oct_free_track'] = libass.prototype.oct_free_track = /** @suppress {undefinedVars, duplicate} */function(track) {
  var self = this.ptr;
  if (track && typeof track === 'object') track = track.ptr;
  _emscripten_bind_libass_oct_free_track_1(self, track);
};;

libass.prototype['oct_alloc_style'] = libass.prototype.oct_alloc_style = /** @suppress {undefinedVars, duplicate} */function(track) {
  var self = this.ptr;
  if (track && typeof track === 'object') track = track.ptr;
  return _emscripten_bind_libass_oct_alloc_style_1(self, track);
};;

libass.prototype['oct_alloc_event'] = libass.prototype.oct_alloc_event = /** @suppress {undefinedVars, duplicate} */function(track) {
  var self = this.ptr;
  if (track && typeof track === 'object') track = track.ptr;
  return _emscripten_bind_libass_oct_alloc_event_1(self, track);
};;

libass.prototype['oct_free_style'] = libass.prototype.oct_free_style = /** @suppress {undefinedVars, duplicate} */function(track, sid) {
  var self = this.ptr;
  if (track && typeof track === 'object') track = track.ptr;
  if (sid && typeof sid === 'object') sid = sid.ptr;
  _emscripten_bind_libass_oct_free_style_2(self, track, sid);
};;

libass.prototype['oct_free_event'] = libass.prototype.oct_free_event = /** @suppress {undefinedVars, duplicate} */function(track, eid) {
  var self = this.ptr;
  if (track && typeof track === 'object') track = track.ptr;
  if (eid && typeof eid === 'object') eid = eid.ptr;
  _emscripten_bind_libass_oct_free_event_2(self, track, eid);
};;

libass.prototype['oct_flush_events'] = libass.prototype.oct_flush_events = /** @suppress {undefinedVars, duplicate} */function(track) {
  var self = this.ptr;
  if (track && typeof track === 'object') track = track.ptr;
  _emscripten_bind_libass_oct_flush_events_1(self, track);
};;

libass.prototype['oct_read_file'] = libass.prototype.oct_read_file = /** @suppress {undefinedVars, duplicate} */function(library, fname, codepage) {
  var self = this.ptr;
  ensureCache.prepare();
  if (library && typeof library === 'object') library = library.ptr;
  if (fname && typeof fname === 'object') fname = fname.ptr;
  else fname = ensureString(fname);
  if (codepage && typeof codepage === 'object') codepage = codepage.ptr;
  else codepage = ensureString(codepage);
  return wrapPointer(_emscripten_bind_libass_oct_read_file_3(self, library, fname, codepage), ASS_Track);
};;

libass.prototype['oct_add_font'] = libass.prototype.oct_add_font = /** @suppress {undefinedVars, duplicate} */function(library, name, data, data_size) {
  var self = this.ptr;
  ensureCache.prepare();
  if (library && typeof library === 'object') library = library.ptr;
  if (name && typeof name === 'object') name = name.ptr;
  else name = ensureString(name);
  if (data && typeof data === 'object') data = data.ptr;
  else data = ensureString(data);
  if (data_size && typeof data_size === 'object') data_size = data_size.ptr;
  _emscripten_bind_libass_oct_add_font_4(self, library, name, data, data_size);
};;

libass.prototype['oct_clear_fonts'] = libass.prototype.oct_clear_fonts = /** @suppress {undefinedVars, duplicate} */function(library) {
  var self = this.ptr;
  if (library && typeof library === 'object') library = library.ptr;
  _emscripten_bind_libass_oct_clear_fonts_1(self, library);
};;

libass.prototype['oct_step_sub'] = libass.prototype.oct_step_sub = /** @suppress {undefinedVars, duplicate} */function(track, now, movement) {
  var self = this.ptr;
  if (track && typeof track === 'object') track = track.ptr;
  if (now && typeof now === 'object') now = now.ptr;
  if (movement && typeof movement === 'object') movement = movement.ptr;
  return _emscripten_bind_libass_oct_step_sub_3(self, track, now, movement);
};;

(function() {
  function setupEnums() {
    

    // ASS_Hinting

    Module['ASS_HINTING_NONE'] = _emscripten_enum_ASS_Hinting_ASS_HINTING_NONE();

    Module['ASS_HINTING_LIGHT'] = _emscripten_enum_ASS_Hinting_ASS_HINTING_LIGHT();

    Module['ASS_HINTING_NORMAL'] = _emscripten_enum_ASS_Hinting_ASS_HINTING_NORMAL();

    Module['ASS_HINTING_NATIVE'] = _emscripten_enum_ASS_Hinting_ASS_HINTING_NATIVE();

    

    // ASS_ShapingLevel

    Module['ASS_SHAPING_SIMPLE'] = _emscripten_enum_ASS_ShapingLevel_ASS_SHAPING_SIMPLE();

    Module['ASS_SHAPING_COMPLEX'] = _emscripten_enum_ASS_ShapingLevel_ASS_SHAPING_COMPLEX();

    

    // ASS_OverrideBits

    Module['ASS_OVERRIDE_DEFAULT'] = _emscripten_enum_ASS_OverrideBits_ASS_OVERRIDE_DEFAULT();

    Module['ASS_OVERRIDE_BIT_STYLE'] = _emscripten_enum_ASS_OverrideBits_ASS_OVERRIDE_BIT_STYLE();

    Module['ASS_OVERRIDE_BIT_SELECTIVE_FONT_SCALE'] = _emscripten_enum_ASS_OverrideBits_ASS_OVERRIDE_BIT_SELECTIVE_FONT_SCALE();

    Module['ASS_OVERRIDE_BIT_FONT_SIZE'] = _emscripten_enum_ASS_OverrideBits_ASS_OVERRIDE_BIT_FONT_SIZE();

    Module['ASS_OVERRIDE_BIT_FONT_SIZE_FIELDS'] = _emscripten_enum_ASS_OverrideBits_ASS_OVERRIDE_BIT_FONT_SIZE_FIELDS();

    Module['ASS_OVERRIDE_BIT_FONT_NAME'] = _emscripten_enum_ASS_OverrideBits_ASS_OVERRIDE_BIT_FONT_NAME();

    Module['ASS_OVERRIDE_BIT_COLORS'] = _emscripten_enum_ASS_OverrideBits_ASS_OVERRIDE_BIT_COLORS();

    Module['ASS_OVERRIDE_BIT_ATTRIBUTES'] = _emscripten_enum_ASS_OverrideBits_ASS_OVERRIDE_BIT_ATTRIBUTES();

    Module['ASS_OVERRIDE_BIT_BORDER'] = _emscripten_enum_ASS_OverrideBits_ASS_OVERRIDE_BIT_BORDER();

    Module['ASS_OVERRIDE_BIT_ALIGNMENT'] = _emscripten_enum_ASS_OverrideBits_ASS_OVERRIDE_BIT_ALIGNMENT();

    Module['ASS_OVERRIDE_BIT_MARGINS'] = _emscripten_enum_ASS_OverrideBits_ASS_OVERRIDE_BIT_MARGINS();

    Module['ASS_OVERRIDE_FULL_STYLE'] = _emscripten_enum_ASS_OverrideBits_ASS_OVERRIDE_FULL_STYLE();

    Module['ASS_OVERRIDE_BIT_JUSTIFY'] = _emscripten_enum_ASS_OverrideBits_ASS_OVERRIDE_BIT_JUSTIFY();

  }
  if (runtimeInitialized) setupEnums();
  else addOnPreMain(setupEnums);
})();
