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
#else
// make IDE happy
#define emscripten_get_now() 0.0
#endif

int log_level = 3;

typedef struct {
    void *buffer;
    int size;
    int lessen_counter;
} buffer_t;

void* buffer_resize(buffer_t *buf, int new_size, int keep_content) {
    if (buf->size >= new_size) {
        if (buf->size >= 1.3 * new_size) {
            // big reduction request
            buf->lessen_counter++;
        } else {
            buf->lessen_counter = 0;
        }
        if (buf->lessen_counter < 10) {
            // not reducing the buffer yet
            return buf->buffer;
        }
    }

    void *newbuf;
    if (keep_content) {
        newbuf = realloc(buf->buffer, new_size);
    } else {
        newbuf = malloc(new_size);
    }
    if (!newbuf) return NULL;

    if (!keep_content) free(buf->buffer);
    buf->buffer = newbuf;
    buf->size = new_size;
    buf->lessen_counter = 0;
    return buf->buffer;
}

void buffer_init(buffer_t *buf) {
    buf->buffer = NULL;
    buf->size = -1;
    buf->lessen_counter = 0;
}

void buffer_free(buffer_t *buf) {
    free(buf->buffer);
}

void msg_callback(int level, const char *fmt, va_list va, void *data) {
    if (level > log_level) // 6 for verbose
        return;
    printf("libass: ");
    vprintf(fmt, va);
    printf("\n");
}

const float MIN_UINT8_CAST = 0.9 / 255;
const float MAX_UINT8_CAST = 255.9 / 255;

#define CLAMP_UINT8(value) ((value > MIN_UINT8_CAST) ? ((value < MAX_UINT8_CAST) ? (int)(value * 255) : 255) : 0)

typedef struct {
public:
    int changed;
    double blend_time;
    int dest_x, dest_y, dest_width, dest_height;
    unsigned char* image;
} RenderBlendResult;

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
        buffer_init(&m_blend);
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
        buffer_free(&m_blend);
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

    void setMemoryLimits(int glyph_limit, int bitmap_cache_limit) {
        printf("libass: setting total libass memory limits to: glyph=%d MiB, bitmap cache=%d MiB\n",
            glyph_limit, bitmap_cache_limit);
        ass_set_cache_limits(ass_renderer, glyph_limit, bitmap_cache_limit);
    }

    RenderBlendResult* renderBlend(double tm, int force) {
        m_blendResult.blend_time = 0.0;

        ASS_Image *img = ass_render_frame(ass_renderer, track, (int)(tm * 1000), &m_blendResult.changed);
        if (img == NULL || (m_blendResult.changed == 0 && !force)) {
            return NULL;
        }

        double start_blend_time = emscripten_get_now();

        // find bounding rect first
        int min_x = img->dst_x, min_y = img->dst_y;
        int max_x = img->dst_x + img->w - 1, max_y = img->dst_y + img->h - 1;
        ASS_Image *cur;
        for (cur = img->next; cur != NULL; cur = cur->next) {
            if (cur->dst_x < min_x) min_x = cur->dst_x;
            if (cur->dst_y < min_y) min_y = cur->dst_y;
            int right = cur->dst_x + cur->w - 1;
            int bottom = cur->dst_y + cur->h - 1;
            if (right > max_x) max_x = right;
            if (bottom > max_y) max_y = bottom;
        }

        // make float buffer for blending
        int width = max_x - min_x + 1, height = max_y - min_y + 1;
        float* buf = (float*)buffer_resize(&m_blend, sizeof(float) * width * height * 4, 0);
        if (buf == NULL) {
            printf("libass: error: cannot allocate buffer for blending");
            return NULL;
        }
        memset(buf, 0, sizeof(float) * width * height * 4);

        // blend things in
        for (cur = img; cur != NULL; cur = cur->next) {
            int curw = cur->w, curh = cur->h;
            if (curw == 0 || curh == 0) continue; // skip empty images
            int a = (255 - (cur->color & 0xFF));
            if (a == 0) continue; // skip transparent images

            int curs = (cur->stride >= curw) ? cur->stride : curw;
            int curx = cur->dst_x - min_x, cury = cur->dst_y - min_y;

            unsigned char *bitmap = cur->bitmap;
            float normalized_a = a / 255.0;
            float r = ((cur->color >> 24) & 0xFF) / 255.0;
            float g = ((cur->color >> 16) & 0xFF) / 255.0;
            float b = ((cur->color >> 8) & 0xFF) / 255.0;

            int buf_line_coord = cury * width;
            for (int y = 0, bitmap_offset = 0; y < curh; y++, bitmap_offset += curs, buf_line_coord += width)
            {
                for (int x = 0; x < curw; x++)
                {
                    float pix_alpha = bitmap[bitmap_offset + x] * normalized_a / 255.0;
                    float inv_alpha = 1.0 - pix_alpha;
                    
                    int buf_coord = (buf_line_coord + curx + x) << 2;
                    float *buf_r = buf + buf_coord;
                    float *buf_g = buf + buf_coord + 1;
                    float *buf_b = buf + buf_coord + 2;
                    float *buf_a = buf + buf_coord + 3;
                    
                    // do the compositing, pre-multiply image RGB with alpha for current pixel
                    *buf_a = pix_alpha + *buf_a * inv_alpha;
                    *buf_r = r * pix_alpha + *buf_r * inv_alpha;
                    *buf_g = g * pix_alpha + *buf_g * inv_alpha;
                    *buf_b = b * pix_alpha + *buf_b * inv_alpha;
                }
            }
        }

        // now build the result;
        // NOTE: we use a "view" over [float,float,float,float] array of pixels,
        // so we _must_ go left-right top-bottom to not mangle the result
        unsigned int *result = (unsigned int*)buf;
        for (int y = 0, buf_line_coord = 0; y < height; y++, buf_line_coord += width) {
            for (int x = 0; x < width; x++) {
                unsigned int pixel = 0;
                int buf_coord = (buf_line_coord + x) << 2;
                float alpha = buf[buf_coord + 3];
                if (alpha > MIN_UINT8_CAST) {
                    // need to un-multiply the result
                    float value = buf[buf_coord] / alpha;
                    pixel |= CLAMP_UINT8(value); // R
                    value = buf[buf_coord + 1] / alpha;
                    pixel |= CLAMP_UINT8(value) << 8; // G
                    value = buf[buf_coord + 2] / alpha;
                    pixel |= CLAMP_UINT8(value) << 16; // B
                    pixel |= CLAMP_UINT8(alpha) << 24; // A
                }
                result[buf_line_coord + x] = pixel;
            }
        }
        
        // return the thing
        m_blendResult.dest_x = min_x;
        m_blendResult.dest_y = min_y;
        m_blendResult.dest_width = width;
        m_blendResult.dest_height = height;
        m_blendResult.blend_time = emscripten_get_now() - start_blend_time;
        m_blendResult.image = (unsigned char*)result;
        return &m_blendResult;
    }

private:
    buffer_t m_blend;
    RenderBlendResult m_blendResult;
};

int main(int argc, char *argv[]) { return 0; }

#include "./SubOctpInterface.cpp"
