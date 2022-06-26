#include <stdio.h>
#include <stdlib.h>
#include <stdarg.h>
#include <string.h>
#include <ass/ass.h>

/**
 * This class is a wrapper for Emscripten WebIDL for interface with Javascript
 */
class libass {
public:
    static long oct_library_version() {
        return ass_library_version();
    }
    static ASS_Library* oct_library_init() {
        return ass_library_init();
    }
    static void oct_library_done(ASS_Library *priv) {
        ass_library_done(priv);
    }
    static void oct_set_fonts_dir(ASS_Library *priv, const char *fonts_dir) {
        ass_set_fonts_dir(priv, fonts_dir);
    }
    static void oct_set_extract_fonts(ASS_Library *priv, int extract) {
        ass_set_extract_fonts(priv, extract);
    }
    static void oct_set_style_overrides(ASS_Library *priv, char **list) {
        ass_set_style_overrides(priv, list);
    }
    static void oct_process_force_style(ASS_Track *track) {
        ass_process_force_style(track);
    }
    static ASS_Renderer *oct_renderer_init(ASS_Library *priv) {
        return ass_renderer_init(priv);
    }
    static void oct_renderer_done(ASS_Renderer *priv) {
        ass_renderer_done(priv);
    }
    static void oct_set_frame_size(ASS_Renderer *priv, int w, int h) {
        ass_set_frame_size(priv, w, h);
    }
    static void oct_set_storage_size(ASS_Renderer *priv, int w, int h) {
        ass_set_storage_size(priv, w, h);
    }
    static void oct_set_shaper(ASS_Renderer *priv, ASS_ShapingLevel level) {
        ass_set_shaper(priv, level);
    }
    static void oct_set_margins(ASS_Renderer *priv, int t, int b, int l, int r) {
        ass_set_margins(priv, t, b, l, r);
    }
    static void oct_set_use_margins(ASS_Renderer *priv, int use) {
        ass_set_use_margins(priv, use);
    }
    static void oct_set_pixel_aspect(ASS_Renderer *priv, double par) {
        ass_set_pixel_aspect(priv, par);
    }
    static void oct_set_aspect_ratio(ASS_Renderer *priv, double dar, double sar) {
        ass_set_aspect_ratio(priv, dar, sar);
    }
    static void oct_set_font_scale(ASS_Renderer *priv, double font_scale) {
        ass_set_font_scale(priv, font_scale);
    }
    static void oct_set_hinting(ASS_Renderer *priv, ASS_Hinting ht) {
        ass_set_hinting(priv, ht);
    }
    static void oct_set_line_spacing(ASS_Renderer *priv, double line_spacing) {
        ass_set_line_spacing(priv, line_spacing);
    }
    static void oct_set_line_position(ASS_Renderer *priv, double line_position) {
        ass_set_line_position(priv, line_position);
    }
    static void oct_set_fonts(ASS_Renderer *priv, const char *default_font, const char *default_family, int dfp, const char *config, int update) {
        ass_set_fonts(priv, default_font, default_family, dfp, config, update);
    }
    static void oct_set_selective_style_override_enabled(ASS_Renderer *priv, int bits) {
        ass_set_selective_style_override_enabled(priv, bits);
    }
    static void oct_set_selective_style_override(ASS_Renderer *priv, ASS_Style *style) {
        ass_set_selective_style_override(priv, style);
    }
    static void oct_set_cache_limits(ASS_Renderer *priv, int glyph_max, int bitmap_max_size) {
        ass_set_cache_limits(priv, glyph_max, bitmap_max_size);
    }
    static ASS_Image *oct_render_frame(ASS_Renderer *priv, ASS_Track *track, long long now, int *detect_change) {
        return ass_render_frame(priv, track, now, detect_change);
    }
    static ASS_Track *oct_new_track(ASS_Library *priv) {
        return ass_new_track(priv);
    }
    static void oct_free_track(ASS_Track *track) {
        ass_free_track(track);
    }
    static int oct_alloc_style(ASS_Track *track) {
        return ass_alloc_style(track);
    }
    static int oct_alloc_event(ASS_Track *track) {
        return ass_alloc_event(track);
    }
    static void oct_free_style(ASS_Track *track, int sid) {
        ass_free_style(track, sid);
    }
    static void oct_free_event(ASS_Track *track, int eid) {
        ass_free_event(track, eid);
    }
    static void oct_set_check_readorder(ASS_Track *track, int check_readorder) {
        ass_set_check_readorder(track, check_readorder);
    }
    static void oct_flush_events(ASS_Track *track) {
        ass_flush_events(track);
    }
    static ASS_Track *oct_read_file(ASS_Library *library, char *fname, char *codepage) {
        return ass_read_file(library, fname, codepage);
    }
    static ASS_Track *oct_read_memory(ASS_Library *library, char *buf, unsigned long bufsize, char *codepage) {
        return ass_read_memory(library, buf, bufsize, codepage);
    }
    static int oct_read_styles(ASS_Track *track, char *fname, char *codepage) {
        return ass_read_styles(track, fname, codepage);
    }
    static void oct_add_font(ASS_Library *library, char *name, char *data, int data_size) {
        ass_add_font(library, name, data, data_size);
    }
    static void oct_clear_fonts(ASS_Library *library) {
        ass_clear_fonts(library);
    }
    static long long oct_step_sub(ASS_Track *track, long long now, int movement) {
        return ass_step_sub(track, now, movement);
    }
};
