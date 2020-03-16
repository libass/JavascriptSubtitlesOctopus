/*
    SubtitleOctopus.js
*/

#include <stdio.h>
#include <stdlib.h>
#include <stdarg.h>
#include <string.h>
#include "../lib/libass/libass/ass.h"

#include "libass.cpp"

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#endif

int log_level = 3;

void msg_callback(int level, const char *fmt, va_list va, void *data)
{
    if (level > log_level) // 6 for verbose
        return;
    printf("libass: ");
    vprintf(fmt, va);
    printf("\n");
}

class SubtitleOctopus {
public:
    ASS_Library* ass_library;
    ASS_Renderer* ass_renderer;
    ASS_Track* track;

    int canvas_w;
    int canvas_h;

    int status;

    SubtitleOctopus() {
        status = 0;
        ass_library = NULL;
        ass_renderer = NULL;
        track = NULL;
        canvas_w = 0;
        canvas_h = 0;
    }

    void setLogLevel(int level) {
        log_level = level;
    }

    void initLibrary(int frame_w, int frame_h) {
        ass_library = ass_library_init();
        if (!ass_library) {
            printf("ass_library_init failed!\n");
            exit(2);
        }

        ass_set_message_cb(ass_library, msg_callback, NULL);

        ass_renderer = ass_renderer_init(ass_library);
        if (!ass_renderer) {
            printf("ass_renderer_init failed!\n");
            exit(3);
        }

        resizeCanvas(frame_w, frame_h);

        reloadFonts();
    }

    /* TRACK */
    void createTrack(char* subfile) {
        removeTrack();
        track = ass_read_file(ass_library, subfile, NULL);
        if (!track) {
            printf("Failed to start a track\n");
            exit(4);
        }
    }

    void createTrackMem(char *buf, unsigned long bufsize) {
        removeTrack();
        track = ass_read_memory(ass_library, buf, (size_t)bufsize, NULL);
        if (!track) {
            printf("Failed to start a track\n");
            exit(4);
        }
    }

    void removeTrack() {
        if (track != NULL) {
            ass_free_track(track);
            track = NULL;
        }
    }
    /* TRACK */

    /* CANVAS */
    void resizeCanvas(int frame_w, int frame_h) {
        ass_set_frame_size(ass_renderer, frame_w, frame_h);
        canvas_h = frame_h;
        canvas_w = frame_w;
    }

    ASS_Image* renderImage(double time, int* changed) {
        ASS_Image *img = ass_render_frame(ass_renderer, track, (int) (time * 1000), changed);
        return img;
    }
    /* CANVAS */

    void quitLibrary() {
        ass_free_track(track);
        ass_renderer_done(ass_renderer);
        ass_library_done(ass_library);
    }

    void reloadLibrary() {
        quitLibrary();

        initLibrary(canvas_w, canvas_h);
    }

    void reloadFonts() {
        ass_set_fonts(ass_renderer, "/assets/default.woff2", NULL, ASS_FONTPROVIDER_FONTCONFIG, "/assets/fonts.conf", 1);
    }

    void setMargin(int top, int bottom, int left, int right) {
        ass_set_margins(ass_renderer, top, bottom, left, right);
    }

    int getEventCount() {
        return track->n_events;
    }

    int allocEvent() {
        return ass_alloc_event(track);
    }

    void removeEvent(int eid) {
        ass_free_event(track, eid);
    }

    int getStyleCount() {
        return track->n_styles;
    }

    int getStyleByName(const char* name) {
        for (int n = 0; n < track->n_styles; n++) {
            if (track->styles[n].Name && strcmp(track->styles[n].Name, name) == 0)
                return n;
        }
        return 0;
    }

    int allocStyle() {
        return ass_alloc_style(track);
    }

    void removeStyle(int sid) {
        ass_free_event(track, sid);
    }

    void removeAllEvents() {
        ass_flush_events(track);
    }
};

#define CLAMP_UINT8(value) ((value > 0) ? ((value <= 255) ? (int)value : 255) : 0)

void* libassjs_render_blend(double tm, int force, int *dest_x, int *dest_y, int *dest_width, int *dest_height)
{
    int changed;
    ASS_Image *img = ass_render_frame(ass_renderer, track, (int)(tm * 1000), &changed);
    if (img == NULL || (changed == 0 && !force))
    {
        return NULL;
    }

    // find bounding rect first
    int min_x = img->dst_x, min_y = img->dst_y;
    int max_x = img->dst_x + img->w - 1, max_y = img->dst_y + img->h - 1;
    ASS_Image *cur;
    for (cur = img->next; cur != NULL; cur = cur->next)
    {
        if (cur->dst_x < min_x) min_x = cur->dst_x;
        if (cur->dst_y < min_y) min_y = cur->dst_y;
        int right = cur->dst_x + cur->w - 1;
        int bottom = cur->dst_y + cur->h - 1;
        if (right > max_x) max_x = right;
        if (bottom > max_y) max_y = bottom;
    }

    // make float buffer for blending
    int width = max_x - min_x + 1, height = max_y - min_y + 1;
    float* buf = (float*)malloc(sizeof(float) * width * height * 4);
    if (buf == NULL)
    {
        printf("libass: error: cannot allocate buffer for blending");
        return NULL;
    }
    unsigned char *result = (unsigned char*)malloc(sizeof(unsigned char) * width * height * 4);
    if (result == NULL)
    {
        printf("libass: error: cannot allocate result for blending");
        free(buf);
        return NULL;
    }
    memset(buf, 0, sizeof(float) * width * height * 4);
    memset(result, 0, sizeof(unsigned char) * width * height * 4);

    // blend things in
    for (cur = img; cur != NULL; cur = cur->next)
    {
        int curw = cur->w, curh = cur->h;
        if (curw == 0 || curh == 0) continue; // skip empty images
        int curs = (cur->stride >= curw) ? cur->stride : curw, curx = cur->dst_x, cury = cur->dst_y;
        
        unsigned char *bitmap = cur->bitmap;
        float a = (cur->color & 0xFF) / 255.0;

        // premultiply by alpha
        float r = a * ((cur->color >> 24) & 0xFF) / 255.0;
        float g = a * ((cur->color >> 16) & 0xFF) / 255.0;
        float b = a * ((cur->color >> 8) & 0xFF) / 255.0;

        // float a = (255 - (cur->color & 0xFF)) / 255.0;

        for (int y = 0, bitmap_offset = 0; y < curh; y++, bitmap_offset += curs)
        {
            int buf_line_coord = (cury + y) * width;
            for (int x = 0; x < curw; x++)
            {
                // manual bounds check
                //if (x + curx >= width) printf("libass: outside by x");
                //if (y + cury >= height) printf("libass: outside by y");

                float pix_alpha = bitmap[bitmap_offset + x] * a / 255.0;
                float inv_alpha = 1.0 - pix_alpha;
                
                int buf_coord = (buf_line_coord + curx + x) << 2;
                float *buf_r = buf + buf_coord;
                float *buf_g = buf + buf_coord + 1;
                float *buf_b = buf + buf_coord + 2;
                float *buf_a = buf + buf_coord + 3;
                
                float buf_alpha = *buf_a;
                
                // do the compositing
                *buf_a = pix_alpha + buf_alpha * inv_alpha;
                *buf_r = r + *buf_r * inv_alpha;
                *buf_g = g + *buf_g * inv_alpha;
                *buf_b = b + *buf_b * inv_alpha;
            }
        }
    }
    
    // now build the result
    for (int y = 0, buf_line_coord = 0; y < height; y++, buf_line_coord += width)
    {
        for (int x = 0; x < width; x++)
        {
            int buf_coord = (buf_line_coord + x) << 2;
            // need to un-multiply the result
            float alpha = buf[buf_coord + 3];
            if (alpha > 1e-5)
            {
                for (int offset = 0; offset < 3; offset++)
                {
                    float value = buf[buf_coord + offset] / alpha;
                    result[buf_coord + offset] = CLAMP_UINT8(value);
                }
                result[buf_coord + 3] = CLAMP_UINT8(alpha);
            }
        }
    }
    
    // return the thing
    printf("libass: returning result");
    free(buf);
    *dest_x = min_x;
    *dest_y = min_y;
    *dest_width = width;
    *dest_height = height;
    return result;
}

int main(int argc, char *argv[]) {}

#include "./SubOctpInterface.cpp"