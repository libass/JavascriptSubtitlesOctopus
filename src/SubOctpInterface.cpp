
#include <emscripten.h>

extern "C" {

// Not using size_t for array indices as the values used by the javascript code are signed.
void array_bounds_check(const int array_size, const int array_idx) {
  if (array_idx < 0 || array_idx >= array_size) {
    EM_ASM({
      throw 'Array index ' + $0 + ' out of bounds: [0,' + $1 + ')';
    }, array_idx, array_size);
  }
}

// ASS_ParserPriv

// ASS_Event

long long EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Event_get_Start_0(ASS_Event* self) {
  return self->Start;
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Event_set_Start_1(ASS_Event* self, long long arg0) {
  self->Start = arg0;
}

long long EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Event_get_Duration_0(ASS_Event* self) {
  return self->Duration;
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Event_set_Duration_1(ASS_Event* self, long long arg0) {
  self->Duration = arg0;
}

int EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Event_get_ReadOrder_0(ASS_Event* self) {
  return self->ReadOrder;
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Event_set_ReadOrder_1(ASS_Event* self, int arg0) {
  self->ReadOrder = arg0;
}

int EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Event_get_Layer_0(ASS_Event* self) {
  return self->Layer;
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Event_set_Layer_1(ASS_Event* self, int arg0) {
  self->Layer = arg0;
}

int EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Event_get_Style_0(ASS_Event* self) {
  return self->Style;
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Event_set_Style_1(ASS_Event* self, int arg0) {
  self->Style = arg0;
}

char* EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Event_get_Name_0(ASS_Event* self) {
  return self->Name;
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Event_set_Name_1(ASS_Event* self, char* arg0) {
  self->Name = arg0;
}

int EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Event_get_MarginL_0(ASS_Event* self) {
  return self->MarginL;
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Event_set_MarginL_1(ASS_Event* self, int arg0) {
  self->MarginL = arg0;
}

int EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Event_get_MarginR_0(ASS_Event* self) {
  return self->MarginR;
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Event_set_MarginR_1(ASS_Event* self, int arg0) {
  self->MarginR = arg0;
}

int EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Event_get_MarginV_0(ASS_Event* self) {
  return self->MarginV;
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Event_set_MarginV_1(ASS_Event* self, int arg0) {
  self->MarginV = arg0;
}

char* EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Event_get_Effect_0(ASS_Event* self) {
  return self->Effect;
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Event_set_Effect_1(ASS_Event* self, char* arg0) {
  self->Effect = arg0;
}

char* EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Event_get_Text_0(ASS_Event* self) {
  return self->Text;
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Event_set_Text_1(ASS_Event* self, char* arg0) {
  self->Text = arg0;
}

// ASS_Renderer

// SubtitleOctopus

SubtitleOctopus* EMSCRIPTEN_KEEPALIVE emscripten_bind_SubtitleOctopus_SubtitleOctopus_0() {
  return new SubtitleOctopus();
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_SubtitleOctopus_setLogLevel_1(SubtitleOctopus* self, int level) {
  self->setLogLevel(level);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_SubtitleOctopus_initLibrary_2(SubtitleOctopus* self, int frame_w, int frame_h) {
  self->initLibrary(frame_w, frame_h);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_SubtitleOctopus_createTrack_1(SubtitleOctopus* self, char* subfile) {
  self->createTrack(subfile);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_SubtitleOctopus_createTrackMem_2(SubtitleOctopus* self, char* buf, unsigned int bufsize) {
  self->createTrackMem(buf, bufsize);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_SubtitleOctopus_removeTrack_0(SubtitleOctopus* self) {
  self->removeTrack();
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_SubtitleOctopus_resizeCanvas_2(SubtitleOctopus* self, int frame_w, int frame_h) {
  self->resizeCanvas(frame_w, frame_h);
}

ASS_Image* EMSCRIPTEN_KEEPALIVE emscripten_bind_SubtitleOctopus_renderImage_2(SubtitleOctopus* self, double time, int* changed) {
  return self->renderImage(time, changed);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_SubtitleOctopus_quitLibrary_0(SubtitleOctopus* self) {
  self->quitLibrary();
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_SubtitleOctopus_reloadLibrary_0(SubtitleOctopus* self) {
  self->reloadLibrary();
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_SubtitleOctopus_reloadFonts_0(SubtitleOctopus* self) {
  self->reloadFonts();
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_SubtitleOctopus_setMargin_4(SubtitleOctopus* self, int top, int bottom, int left, int right) {
  self->setMargin(top, bottom, left, right);
}

int EMSCRIPTEN_KEEPALIVE emscripten_bind_SubtitleOctopus_getEventCount_0(SubtitleOctopus* self) {
  return self->getEventCount();
}

int EMSCRIPTEN_KEEPALIVE emscripten_bind_SubtitleOctopus_allocEvent_0(SubtitleOctopus* self) {
  return self->allocEvent();
}

int EMSCRIPTEN_KEEPALIVE emscripten_bind_SubtitleOctopus_allocStyle_0(SubtitleOctopus* self) {
  return self->allocStyle();
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_SubtitleOctopus_removeEvent_1(SubtitleOctopus* self, int eid) {
  self->removeEvent(eid);
}

int EMSCRIPTEN_KEEPALIVE emscripten_bind_SubtitleOctopus_getStyleCount_0(SubtitleOctopus* self) {
  return self->getStyleCount();
}

int EMSCRIPTEN_KEEPALIVE emscripten_bind_SubtitleOctopus_getStyleByName_1(SubtitleOctopus* self, const char* name) {
  return self->getStyleByName(name);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_SubtitleOctopus_removeStyle_1(SubtitleOctopus* self, int eid) {
  self->removeStyle(eid);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_SubtitleOctopus_removeAllEvents_0(SubtitleOctopus* self) {
  self->removeAllEvents();
}

ASS_Track* EMSCRIPTEN_KEEPALIVE emscripten_bind_SubtitleOctopus_get_track_0(SubtitleOctopus* self) {
  return self->track;
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_SubtitleOctopus_set_track_1(SubtitleOctopus* self, ASS_Track* arg0) {
  self->track = arg0;
}

ASS_Renderer* EMSCRIPTEN_KEEPALIVE emscripten_bind_SubtitleOctopus_get_ass_renderer_0(SubtitleOctopus* self) {
  return self->ass_renderer;
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_SubtitleOctopus_set_ass_renderer_1(SubtitleOctopus* self, ASS_Renderer* arg0) {
  self->ass_renderer = arg0;
}

ASS_Library* EMSCRIPTEN_KEEPALIVE emscripten_bind_SubtitleOctopus_get_ass_library_0(SubtitleOctopus* self) {
  return self->ass_library;
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_SubtitleOctopus_set_ass_library_1(SubtitleOctopus* self, ASS_Library* arg0) {
  self->ass_library = arg0;
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_SubtitleOctopus___destroy___0(SubtitleOctopus* self) {
  delete self;
}

// ASS_Track

int EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Track_get_n_styles_0(ASS_Track* self) {
  return self->n_styles;
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Track_set_n_styles_1(ASS_Track* self, int arg0) {
  self->n_styles = arg0;
}

int EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Track_get_max_styles_0(ASS_Track* self) {
  return self->max_styles;
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Track_set_max_styles_1(ASS_Track* self, int arg0) {
  self->max_styles = arg0;
}

int EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Track_get_n_events_0(ASS_Track* self) {
  return self->n_events;
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Track_set_n_events_1(ASS_Track* self, int arg0) {
  self->n_events = arg0;
}

int EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Track_get_max_events_0(ASS_Track* self) {
  return self->max_events;
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Track_set_max_events_1(ASS_Track* self, int arg0) {
  self->max_events = arg0;
}

ASS_Style* EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Track_get_styles_1(ASS_Track* self, int arg0) {
  return &self->styles[arg0];
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Track_set_styles_2(ASS_Track* self, int arg0, ASS_Style* arg1) {
  self->styles[arg0] = *arg1;
}

ASS_Event* EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Track_get_events_1(ASS_Track* self, int arg0) {
  return &self->events[arg0];
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Track_set_events_2(ASS_Track* self, int arg0, ASS_Event* arg1) {
  self->events[arg0] = *arg1;
}

char* EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Track_get_style_format_0(ASS_Track* self) {
  return self->style_format;
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Track_set_style_format_1(ASS_Track* self, char* arg0) {
  self->style_format = arg0;
}

char* EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Track_get_event_format_0(ASS_Track* self) {
  return self->event_format;
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Track_set_event_format_1(ASS_Track* self, char* arg0) {
  self->event_format = arg0;
}

int EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Track_get_PlayResX_0(ASS_Track* self) {
  return self->PlayResX;
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Track_set_PlayResX_1(ASS_Track* self, int arg0) {
  self->PlayResX = arg0;
}

int EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Track_get_PlayResY_0(ASS_Track* self) {
  return self->PlayResY;
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Track_set_PlayResY_1(ASS_Track* self, int arg0) {
  self->PlayResY = arg0;
}

double EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Track_get_Timer_0(ASS_Track* self) {
  return self->Timer;
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Track_set_Timer_1(ASS_Track* self, double arg0) {
  self->Timer = arg0;
}

int EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Track_get_WrapStyle_0(ASS_Track* self) {
  return self->WrapStyle;
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Track_set_WrapStyle_1(ASS_Track* self, int arg0) {
  self->WrapStyle = arg0;
}

int EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Track_get_ScaledBorderAndShadow_0(ASS_Track* self) {
  return self->ScaledBorderAndShadow;
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Track_set_ScaledBorderAndShadow_1(ASS_Track* self, int arg0) {
  self->ScaledBorderAndShadow = arg0;
}

int EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Track_get_Kerning_0(ASS_Track* self) {
  return self->Kerning;
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Track_set_Kerning_1(ASS_Track* self, int arg0) {
  self->Kerning = arg0;
}

char* EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Track_get_Language_0(ASS_Track* self) {
  return self->Language;
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Track_set_Language_1(ASS_Track* self, char* arg0) {
  self->Language = arg0;
}

int EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Track_get_default_style_0(ASS_Track* self) {
  return self->default_style;
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Track_set_default_style_1(ASS_Track* self, int arg0) {
  self->default_style = arg0;
}

char* EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Track_get_name_0(ASS_Track* self) {
  return self->name;
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Track_set_name_1(ASS_Track* self, char* arg0) {
  self->name = arg0;
}

// ASS_RenderPriv

// ASS_Style

char* EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Style_get_Name_0(ASS_Style* self) {
  return self->Name;
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Style_set_Name_1(ASS_Style* self, char* arg0) {
  self->Name = arg0;
}

char* EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Style_get_FontName_0(ASS_Style* self) {
  return self->FontName;
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Style_set_FontName_1(ASS_Style* self, char* arg0) {
  self->FontName = arg0;
}

double EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Style_get_FontSize_0(ASS_Style* self) {
  return self->FontSize;
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Style_set_FontSize_1(ASS_Style* self, double arg0) {
  self->FontSize = arg0;
}

unsigned int EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Style_get_PrimaryColour_0(ASS_Style* self) {
  return self->PrimaryColour;
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Style_set_PrimaryColour_1(ASS_Style* self, unsigned int arg0) {
  self->PrimaryColour = arg0;
}

unsigned int EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Style_get_SecondaryColour_0(ASS_Style* self) {
  return self->SecondaryColour;
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Style_set_SecondaryColour_1(ASS_Style* self, unsigned int arg0) {
  self->SecondaryColour = arg0;
}

unsigned int EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Style_get_OutlineColour_0(ASS_Style* self) {
  return self->OutlineColour;
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Style_set_OutlineColour_1(ASS_Style* self, unsigned int arg0) {
  self->OutlineColour = arg0;
}

unsigned int EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Style_get_BackColour_0(ASS_Style* self) {
  return self->BackColour;
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Style_set_BackColour_1(ASS_Style* self, unsigned int arg0) {
  self->BackColour = arg0;
}

int EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Style_get_Bold_0(ASS_Style* self) {
  return self->Bold;
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Style_set_Bold_1(ASS_Style* self, int arg0) {
  self->Bold = arg0;
}

int EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Style_get_Italic_0(ASS_Style* self) {
  return self->Italic;
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Style_set_Italic_1(ASS_Style* self, int arg0) {
  self->Italic = arg0;
}

int EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Style_get_Underline_0(ASS_Style* self) {
  return self->Underline;
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Style_set_Underline_1(ASS_Style* self, int arg0) {
  self->Underline = arg0;
}

int EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Style_get_StrikeOut_0(ASS_Style* self) {
  return self->StrikeOut;
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Style_set_StrikeOut_1(ASS_Style* self, int arg0) {
  self->StrikeOut = arg0;
}

double EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Style_get_ScaleX_0(ASS_Style* self) {
  return self->ScaleX;
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Style_set_ScaleX_1(ASS_Style* self, double arg0) {
  self->ScaleX = arg0;
}

double EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Style_get_ScaleY_0(ASS_Style* self) {
  return self->ScaleY;
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Style_set_ScaleY_1(ASS_Style* self, double arg0) {
  self->ScaleY = arg0;
}

double EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Style_get_Spacing_0(ASS_Style* self) {
  return self->Spacing;
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Style_set_Spacing_1(ASS_Style* self, double arg0) {
  self->Spacing = arg0;
}

double EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Style_get_Angle_0(ASS_Style* self) {
  return self->Angle;
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Style_set_Angle_1(ASS_Style* self, double arg0) {
  self->Angle = arg0;
}

int EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Style_get_BorderStyle_0(ASS_Style* self) {
  return self->BorderStyle;
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Style_set_BorderStyle_1(ASS_Style* self, int arg0) {
  self->BorderStyle = arg0;
}

double EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Style_get_Outline_0(ASS_Style* self) {
  return self->Outline;
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Style_set_Outline_1(ASS_Style* self, double arg0) {
  self->Outline = arg0;
}

double EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Style_get_Shadow_0(ASS_Style* self) {
  return self->Shadow;
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Style_set_Shadow_1(ASS_Style* self, double arg0) {
  self->Shadow = arg0;
}

int EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Style_get_Alignment_0(ASS_Style* self) {
  return self->Alignment;
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Style_set_Alignment_1(ASS_Style* self, int arg0) {
  self->Alignment = arg0;
}

int EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Style_get_MarginL_0(ASS_Style* self) {
  return self->MarginL;
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Style_set_MarginL_1(ASS_Style* self, int arg0) {
  self->MarginL = arg0;
}

int EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Style_get_MarginR_0(ASS_Style* self) {
  return self->MarginR;
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Style_set_MarginR_1(ASS_Style* self, int arg0) {
  self->MarginR = arg0;
}

int EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Style_get_MarginV_0(ASS_Style* self) {
  return self->MarginV;
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Style_set_MarginV_1(ASS_Style* self, int arg0) {
  self->MarginV = arg0;
}

int EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Style_get_Encoding_0(ASS_Style* self) {
  return self->Encoding;
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Style_set_Encoding_1(ASS_Style* self, int arg0) {
  self->Encoding = arg0;
}

int EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Style_get_treat_fontname_as_pattern_0(ASS_Style* self) {
  return self->treat_fontname_as_pattern;
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Style_set_treat_fontname_as_pattern_1(ASS_Style* self, int arg0) {
  self->treat_fontname_as_pattern = arg0;
}

double EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Style_get_Blur_0(ASS_Style* self) {
  return self->Blur;
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Style_set_Blur_1(ASS_Style* self, double arg0) {
  self->Blur = arg0;
}

int EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Style_get_Justify_0(ASS_Style* self) {
  return self->Justify;
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Style_set_Justify_1(ASS_Style* self, int arg0) {
  self->Justify = arg0;
}

// ASS_Image

int EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Image_get_w_0(ASS_Image* self) {
  return self->w;
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Image_set_w_1(ASS_Image* self, int arg0) {
  self->w = arg0;
}

int EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Image_get_h_0(ASS_Image* self) {
  return self->h;
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Image_set_h_1(ASS_Image* self, int arg0) {
  self->h = arg0;
}

int EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Image_get_stride_0(ASS_Image* self) {
  return self->stride;
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Image_set_stride_1(ASS_Image* self, int arg0) {
  self->stride = arg0;
}

unsigned char* EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Image_get_bitmap_0(ASS_Image* self) {
  return self->bitmap;
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Image_set_bitmap_1(ASS_Image* self, unsigned char* arg0) {
  self->bitmap = arg0;
}

unsigned int EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Image_get_color_0(ASS_Image* self) {
  return self->color;
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Image_set_color_1(ASS_Image* self, unsigned int arg0) {
  self->color = arg0;
}

int EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Image_get_dst_x_0(ASS_Image* self) {
  return self->dst_x;
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Image_set_dst_x_1(ASS_Image* self, int arg0) {
  self->dst_x = arg0;
}

int EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Image_get_dst_y_0(ASS_Image* self) {
  return self->dst_y;
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Image_set_dst_y_1(ASS_Image* self, int arg0) {
  self->dst_y = arg0;
}

ASS_Image* EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Image_get_next_0(ASS_Image* self) {
  return self->next;
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_ASS_Image_set_next_1(ASS_Image* self, ASS_Image* arg0) {
  self->next = arg0;
}

// VoidPtr

void EMSCRIPTEN_KEEPALIVE emscripten_bind_VoidPtr___destroy___0(void** self) {
  delete self;
}

// ASS_Library

// libass

libass* EMSCRIPTEN_KEEPALIVE emscripten_bind_libass_libass_0() {
  return new libass();
}

int EMSCRIPTEN_KEEPALIVE emscripten_bind_libass_oct_library_version_0(libass* self) {
  return self->oct_library_version();
}

ASS_Library* EMSCRIPTEN_KEEPALIVE emscripten_bind_libass_oct_library_init_0(libass* self) {
  return self->oct_library_init();
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_libass_oct_library_done_1(libass* self, ASS_Library* priv) {
  self->oct_library_done(priv);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_libass_oct_set_fonts_dir_2(libass* self, ASS_Library* priv, const char* fonts_dir) {
  self->oct_set_fonts_dir(priv, fonts_dir);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_libass_oct_set_extract_fonts_2(libass* self, ASS_Library* priv, int extract) {
  self->oct_set_extract_fonts(priv, extract);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_libass_oct_set_style_overrides_2(libass* self, ASS_Library* priv, char** list) {
  self->oct_set_style_overrides(priv, list);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_libass_oct_process_force_style_1(libass* self, ASS_Track* track) {
  self->oct_process_force_style(track);
}

ASS_Renderer* EMSCRIPTEN_KEEPALIVE emscripten_bind_libass_oct_renderer_init_1(libass* self, ASS_Library* priv) {
  return self->oct_renderer_init(priv);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_libass_oct_renderer_done_1(libass* self, ASS_Renderer* priv) {
  self->oct_renderer_done(priv);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_libass_oct_set_frame_size_3(libass* self, ASS_Renderer* priv, int w, int h) {
  self->oct_set_frame_size(priv, w, h);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_libass_oct_set_storage_size_3(libass* self, ASS_Renderer* priv, int w, int h) {
  self->oct_set_storage_size(priv, w, h);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_libass_oct_set_shaper_2(libass* self, ASS_Renderer* priv, ASS_ShapingLevel level) {
  self->oct_set_shaper(priv, level);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_libass_oct_set_margins_5(libass* self, ASS_Renderer* priv, int t, int b, int l, int r) {
  self->oct_set_margins(priv, t, b, l, r);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_libass_oct_set_use_margins_2(libass* self, ASS_Renderer* priv, int use) {
  self->oct_set_use_margins(priv, use);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_libass_oct_set_pixel_aspect_2(libass* self, ASS_Renderer* priv, double par) {
  self->oct_set_pixel_aspect(priv, par);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_libass_oct_set_aspect_ratio_3(libass* self, ASS_Renderer* priv, double dar, double sar) {
  self->oct_set_aspect_ratio(priv, dar, sar);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_libass_oct_set_font_scale_2(libass* self, ASS_Renderer* priv, double font_scale) {
  self->oct_set_font_scale(priv, font_scale);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_libass_oct_set_hinting_2(libass* self, ASS_Renderer* priv, ASS_Hinting ht) {
  self->oct_set_hinting(priv, ht);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_libass_oct_set_line_spacing_2(libass* self, ASS_Renderer* priv, double line_spacing) {
  self->oct_set_line_spacing(priv, line_spacing);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_libass_oct_set_line_position_2(libass* self, ASS_Renderer* priv, double line_position) {
  self->oct_set_line_position(priv, line_position);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_libass_oct_set_fonts_6(libass* self, ASS_Renderer* priv, char* default_font, char* default_family, int dfp, char* config, int update) {
  self->oct_set_fonts(priv, default_font, default_family, dfp, config, update);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_libass_oct_set_selective_style_override_enabled_2(libass* self, ASS_Renderer* priv, int bits) {
  self->oct_set_selective_style_override_enabled(priv, bits);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_libass_oct_set_selective_style_override_2(libass* self, ASS_Renderer* priv, ASS_Style* style) {
  self->oct_set_selective_style_override(priv, style);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_libass_oct_set_cache_limits_3(libass* self, ASS_Renderer* priv, int glyph_max, int bitmap_max_size) {
  self->oct_set_cache_limits(priv, glyph_max, bitmap_max_size);
}

ASS_Image* EMSCRIPTEN_KEEPALIVE emscripten_bind_libass_oct_render_frame_4(libass* self, ASS_Renderer* priv, ASS_Track* track, long long now, int* detect_change) {
  return self->oct_render_frame(priv, track, now, detect_change);
}

ASS_Track* EMSCRIPTEN_KEEPALIVE emscripten_bind_libass_oct_new_track_1(libass* self, ASS_Library* priv) {
  return self->oct_new_track(priv);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_libass_oct_free_track_1(libass* self, ASS_Track* track) {
  self->oct_free_track(track);
}

int EMSCRIPTEN_KEEPALIVE emscripten_bind_libass_oct_alloc_style_1(libass* self, ASS_Track* track) {
  return self->oct_alloc_style(track);
}

int EMSCRIPTEN_KEEPALIVE emscripten_bind_libass_oct_alloc_event_1(libass* self, ASS_Track* track) {
  return self->oct_alloc_event(track);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_libass_oct_free_style_2(libass* self, ASS_Track* track, int sid) {
  self->oct_free_style(track, sid);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_libass_oct_free_event_2(libass* self, ASS_Track* track, int eid) {
  self->oct_free_event(track, eid);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_libass_oct_flush_events_1(libass* self, ASS_Track* track) {
  self->oct_flush_events(track);
}

ASS_Track* EMSCRIPTEN_KEEPALIVE emscripten_bind_libass_oct_read_file_3(libass* self, ASS_Library* library, char* fname, char* codepage) {
  return self->oct_read_file(library, fname, codepage);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_libass_oct_add_font_4(libass* self, ASS_Library* library, char* name, char* data, int data_size) {
  self->oct_add_font(library, name, data, data_size);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_libass_oct_clear_fonts_1(libass* self, ASS_Library* library) {
  self->oct_clear_fonts(library);
}

long long EMSCRIPTEN_KEEPALIVE emscripten_bind_libass_oct_step_sub_3(libass* self, ASS_Track* track, long long now, int movement) {
  return self->oct_step_sub(track, now, movement);
}

// ASS_Hinting
ASS_Hinting EMSCRIPTEN_KEEPALIVE emscripten_enum_ASS_Hinting_ASS_HINTING_NONE() {
  return ASS_HINTING_NONE;
}
ASS_Hinting EMSCRIPTEN_KEEPALIVE emscripten_enum_ASS_Hinting_ASS_HINTING_LIGHT() {
  return ASS_HINTING_LIGHT;
}
ASS_Hinting EMSCRIPTEN_KEEPALIVE emscripten_enum_ASS_Hinting_ASS_HINTING_NORMAL() {
  return ASS_HINTING_NORMAL;
}
ASS_Hinting EMSCRIPTEN_KEEPALIVE emscripten_enum_ASS_Hinting_ASS_HINTING_NATIVE() {
  return ASS_HINTING_NATIVE;
}

// ASS_ShapingLevel
ASS_ShapingLevel EMSCRIPTEN_KEEPALIVE emscripten_enum_ASS_ShapingLevel_ASS_SHAPING_SIMPLE() {
  return ASS_SHAPING_SIMPLE;
}
ASS_ShapingLevel EMSCRIPTEN_KEEPALIVE emscripten_enum_ASS_ShapingLevel_ASS_SHAPING_COMPLEX() {
  return ASS_SHAPING_COMPLEX;
}

// ASS_OverrideBits
ASS_OverrideBits EMSCRIPTEN_KEEPALIVE emscripten_enum_ASS_OverrideBits_ASS_OVERRIDE_DEFAULT() {
  return ASS_OVERRIDE_DEFAULT;
}
ASS_OverrideBits EMSCRIPTEN_KEEPALIVE emscripten_enum_ASS_OverrideBits_ASS_OVERRIDE_BIT_STYLE() {
  return ASS_OVERRIDE_BIT_STYLE;
}
ASS_OverrideBits EMSCRIPTEN_KEEPALIVE emscripten_enum_ASS_OverrideBits_ASS_OVERRIDE_BIT_SELECTIVE_FONT_SCALE() {
  return ASS_OVERRIDE_BIT_SELECTIVE_FONT_SCALE;
}
ASS_OverrideBits EMSCRIPTEN_KEEPALIVE emscripten_enum_ASS_OverrideBits_ASS_OVERRIDE_BIT_FONT_SIZE() {
  return ASS_OVERRIDE_BIT_FONT_SIZE;
}
ASS_OverrideBits EMSCRIPTEN_KEEPALIVE emscripten_enum_ASS_OverrideBits_ASS_OVERRIDE_BIT_FONT_SIZE_FIELDS() {
  return ASS_OVERRIDE_BIT_FONT_SIZE_FIELDS;
}
ASS_OverrideBits EMSCRIPTEN_KEEPALIVE emscripten_enum_ASS_OverrideBits_ASS_OVERRIDE_BIT_FONT_NAME() {
  return ASS_OVERRIDE_BIT_FONT_NAME;
}
ASS_OverrideBits EMSCRIPTEN_KEEPALIVE emscripten_enum_ASS_OverrideBits_ASS_OVERRIDE_BIT_COLORS() {
  return ASS_OVERRIDE_BIT_COLORS;
}
ASS_OverrideBits EMSCRIPTEN_KEEPALIVE emscripten_enum_ASS_OverrideBits_ASS_OVERRIDE_BIT_ATTRIBUTES() {
  return ASS_OVERRIDE_BIT_ATTRIBUTES;
}
ASS_OverrideBits EMSCRIPTEN_KEEPALIVE emscripten_enum_ASS_OverrideBits_ASS_OVERRIDE_BIT_BORDER() {
  return ASS_OVERRIDE_BIT_BORDER;
}
ASS_OverrideBits EMSCRIPTEN_KEEPALIVE emscripten_enum_ASS_OverrideBits_ASS_OVERRIDE_BIT_ALIGNMENT() {
  return ASS_OVERRIDE_BIT_ALIGNMENT;
}
ASS_OverrideBits EMSCRIPTEN_KEEPALIVE emscripten_enum_ASS_OverrideBits_ASS_OVERRIDE_BIT_MARGINS() {
  return ASS_OVERRIDE_BIT_MARGINS;
}
ASS_OverrideBits EMSCRIPTEN_KEEPALIVE emscripten_enum_ASS_OverrideBits_ASS_OVERRIDE_FULL_STYLE() {
  return ASS_OVERRIDE_FULL_STYLE;
}
ASS_OverrideBits EMSCRIPTEN_KEEPALIVE emscripten_enum_ASS_OverrideBits_ASS_OVERRIDE_BIT_JUSTIFY() {
  return ASS_OVERRIDE_BIT_JUSTIFY;
}

}

