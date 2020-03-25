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

class ReusableBuffer {
public:
    ReusableBuffer(): buffer(NULL), size(-1), lessen_counter(0) {}
    ~ReusableBuffer() {
        free(buffer);
    }
    void clear() {
        free(buffer);
        buffer = NULL;
        size = -1;
        lessen_counter = 0;
    }
    void *take(int new_size, bool keep_content) {
        if (size >= new_size) {
            if (size >= 1.3 * new_size) {
                // big reduction request
                lessen_counter++;
            } else {
                lessen_counter = 0;
            }
            if (lessen_counter < 10) {
                // not reducing the buffer yet
                return buffer;
            }
        }

        void *newbuf;
        if (keep_content) {
            newbuf = realloc(buffer, new_size);
        } else {
            newbuf = malloc(new_size);
        }
        if (!newbuf) return NULL;

        if (!keep_content) free(buffer);
        buffer = newbuf;
        size = new_size;
        lessen_counter = 0;
        return buffer;
    }
    int capacity() const {
        return size;
    }

private:
    void *buffer;
    int size;
    int lessen_counter;
};

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

typedef struct RenderBlendPart {
    int dest_x, dest_y, dest_width, dest_height;
    unsigned char *image;
    RenderBlendPart *next;
} RenderBlendPart;

typedef struct {
    int changed;
    double blend_time;
    RenderBlendPart *part;
} RenderBlendResult;

// maximum regions - a grid of 3x3
#define MAX_BLEND_STORAGES (3 * 3)
typedef struct {
    RenderBlendPart part;
    ReusableBuffer buf;
    bool taken;
} RenderBlendStorage;

typedef struct {
    double eventFinish, emptyFinish;
    int is_animated;
} EventStopTimesResult;

#define MIN(x, y) (((x) < (y)) ? (x) : (y))
#define MAX(x, y) (((x) > (y)) ? (x) : (y))

class BoundingBox {
public:
    int min_x, max_x, min_y, max_y;

    BoundingBox(): min_x(-1), max_x(-1), min_y(-1), max_y(-1) {}

    bool empty() const {
        return min_x == -1;
    }

    void add(int x1, int y1, int w, int h) {
        int x2 = x1 + w - 1, y2 = y1 + h - 1;
        min_x = (min_x < 0) ? x1 : MIN(min_x, x1);
        min_y = (min_y < 0) ? y1 : MIN(min_y, y1);
        max_x = (max_x < 0) ? x2 : MAX(max_x, x2);
        max_y = (max_y < 0) ? y2 : MAX(max_y, y2);
    }

    bool intersets(const BoundingBox& other) const {
        return !(other.min_x > max_x ||
                 other.max_x < min_x ||
                 other.min_y > max_y ||
                 other.max_y < min_y);
    }

    bool tryMerge(BoundingBox& other) {
        if (!intersets(other)) return false;

        min_x = MIN(min_x, other.min_x);
        min_y = MIN(min_y, other.min_y);
        max_x = MAX(max_x, other.max_x);
        max_y = MAX(max_y, other.max_y);
        return true;
    }

    void clear() {
        min_x = max_x = min_y = max_y = -1;
    }
};

static int _is_move_tag_animated(char *begin, char *end) {
    int params[6];
    int count = 0, value = 0, num_digits = 0;
    for (; begin < end; begin++) {
        switch (*begin) {
            case ' ': // fallthrough
            case '\t':
                break;
            case ',':
                params[count] = value;
                count++;
                value = 0;
                num_digits = 0;
                break;
            default: {
                    int digit = *begin - '0';
                    if (digit < 0 || digit > 9) return 0; // invalid move
                    value = value * 10 + digit;
                    num_digits++;
                    break;
                }
        }
    }
    if (num_digits > 0) {
        params[count] = value;
        count++;
    }
    if (count < 4) return 0; // invalid move

    // move is animated if (x1,y1) != (x2,y2)
    return params[0] != params[2] || params[1] != params[3];
}

static int _is_animated_tag(char *begin, char *end) {
    // strip whitespaces around the tag
    while (begin < end && (*begin == ' ' || *begin == '\t')) begin++;
    while (end > begin && (end[-1] == ' ' || end[-1] == '\t')) end--;

    int length = end - begin;
    if (length < 3 || *begin != '\\') return 0; // too short to be animated or not a command

    switch (begin[1]) {
        case 'k': // fallthrough
        case 'K':
            // \kXX is karaoke
            return 1;
        case 't':
            // \t(...) is transition
            return length >= 4 && begin[2] == '(' && end[-1] == ')';
        case 'm':
            if (length >=7 && end[-1] == ')' && strcmp(begin, "\\move(") == 0) {
                return _is_move_tag_animated(begin + 6, end - 1);
            }
            break;
        case 'f':
            // \fad() or \fade() are fades
            return (length >= 7 && end[-1] == ')' &&
                (strcmp(begin, "\\fad(") == 0 || strcmp(begin, "\\fade(") == 0));
    }

    return 0;
}

static void _remove_tag(char *begin, char *end) {
    // overwrite the tag with whitespace so libass won't see it
    for (; begin < end; begin++) *begin = ' ';
}

static int _is_event_animated(ASS_Event *event, bool drop_animations) {
    // event is complex if it's animated in any way,
    // either by having non-empty Effect or
    // by having tags (enclosed in '{}' in Text)
    if (event->Effect && event->Effect[0] != '\0') {
        if (!drop_animations) return 1;
        event->Effect[0] = '\0';
    }

    int escaped = 0;
    char *tagStart = NULL;
    for (char *p = event->Text; *p != '\0'; p++) {
        switch (*p) {
            case '\\':
                escaped = !escaped;
                break;
            case '{':
                if (!escaped && tagStart == NULL) tagStart = p + 1;
                break;
            case '}':
                if (!escaped && tagStart != NULL) {
                    if (_is_animated_tag(tagStart, p)) {
                        if (!drop_animations) return 1;
                        _remove_tag(tagStart, p);
                    }
                    tagStart = NULL;
                }
                break;
            case ';':
                if (tagStart != NULL) {
                    if (_is_animated_tag(tagStart, p)) {
                        if (!drop_animations) return 1;
                        _remove_tag(tagStart, p + 1 /* +1 is because we want to drop ';' as well */);
                    }
                }
                tagStart = p + 1;
                break;
        }
    }

    return 0;
}

class SubtitleOctopus {
public:
    ASS_Library* ass_library;
    ASS_Renderer* ass_renderer;
    ASS_Track* track;

    int canvas_w;
    int canvas_h;

    int status;

    SubtitleOctopus(): ass_library(NULL), ass_renderer(NULL), track(NULL), canvas_w(0), canvas_h(0), status(0), m_is_event_animated(NULL), m_drop_animations(false) {
    }

    void setLogLevel(int level) {
        log_level = level;
    }

    void setDropAnimations(int value) {
        bool rescan = m_drop_animations != bool(value) && track != NULL;
        m_drop_animations = bool(value);
        if (rescan) rescanAllAnimations();
    }

    int getDropAnimations() const {
        return m_drop_animations;
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
        m_blend.clear();
        m_is_event_animated = NULL;
    }

    /* TRACK */
    void createTrack(char* subfile) {
        removeTrack();
        track = ass_read_file(ass_library, subfile, NULL);
        if (!track) {
            printf("Failed to start a track\n");
            exit(4);
        }
        rescanAllAnimations();
    }

    void createTrackMem(char *buf, unsigned long bufsize) {
        removeTrack();
        track = ass_read_memory(ass_library, buf, (size_t)bufsize, NULL);
        if (!track) {
            printf("Failed to start a track\n");
            exit(4);
        }
        rescanAllAnimations();
    }

    void removeTrack() {
        if (track != NULL) {
            ass_free_track(track);
            track = NULL;
        }
        free(m_is_event_animated);
        m_is_event_animated = NULL;
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
        m_blend.clear();
        free(m_is_event_animated);
        m_is_event_animated = NULL;
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

    int getEventCount() const {
        return track->n_events;
    }

    int allocEvent() {
        free(m_is_event_animated);
        m_is_event_animated = NULL;
        return ass_alloc_event(track);
    }

    void removeEvent(int eid) {
        free(m_is_event_animated);
        m_is_event_animated = NULL;
        ass_free_event(track, eid);
    }

    int getStyleCount() const {
        return track->n_styles;
    }

    int getStyleByName(const char* name) const {
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
        free(m_is_event_animated);
        m_is_event_animated = NULL;
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
        for (int i = 0; i < MAX_BLEND_STORAGES; i++) {
            m_blendParts[i].taken = false;
        }

        // split rendering region in 9 pieces (as on 3x3 grid)
        int split_x_low = canvas_w / 3, split_x_high = 2 * canvas_w / 3;
        int split_y_low = canvas_h / 3, split_y_high = 2 * canvas_h / 3;
        BoundingBox boxes[MAX_BLEND_STORAGES];
        for (ASS_Image *cur = img; cur != NULL; cur = cur->next) {
            int index = 0;
            int middle_x = cur->dst_x + (cur->w >> 1), middle_y = cur->dst_y + (cur->h >> 1);
            if (middle_y > split_y_high) {
                index += 2 * 3;
            } else if (middle_y > split_y_low) {
                index += 1 * 3;
            }
            if (middle_x > split_x_high) {
                index += 2;
            } else if (middle_y > split_x_low) {
                index += 1;
            }
            boxes[index].add(cur->dst_x, cur->dst_y, cur->w, cur->h);
        }

        // now merge regions as long as there are intersecting regions
        for (;;) {
            bool merged = false;
            for (int box1 = 0; box1 < MAX_BLEND_STORAGES - 1; box1++) {
                if (boxes[box1].empty()) continue;
                for (int box2 = box1 + 1; box2 < MAX_BLEND_STORAGES; box2++) {
                    if (boxes[box2].empty()) continue;
                    if (boxes[box1].tryMerge(boxes[box2])) {
                        boxes[box2].clear();
                        merged = true;
                    }
                }
            }
            if (!merged) break;
        }

        m_blendResult.part = NULL;
        for (int box = 0; box < MAX_BLEND_STORAGES; box++) {
            if (boxes[box].empty()) continue;
            RenderBlendPart *part = renderBlendPart(boxes[box], img);
            if (part == NULL) return NULL;
            part->next = m_blendResult.part;
            m_blendResult.part = part;
        }
        m_blendResult.blend_time = emscripten_get_now() - start_blend_time;

        return &m_blendResult;
    }

    double findNextEventStart(double tm) const {
        if (!track || track->n_events == 0) return -1;

        ASS_Event *cur = track->events;
        long long now = (long long)(tm * 1000);
        long long closest = -1;

        for (int i = 0; i < track->n_events; i++, cur++) {
            long long start = cur->Start;
            if (start < now) {
                if (start + cur->Duration >= now) {
                    // there's currently an event being displayed, we should render it
                    closest = now;
                    break;
                }
            } else if (start < closest || closest == -1) {
                closest = start;
            }
        }

        return closest / 1000.0;
    }

    EventStopTimesResult* findEventStopTimes(double tm) const {
        static EventStopTimesResult result;
        if (!track || track->n_events == 0) {
            result.eventFinish = result.emptyFinish = -1;
            return &result;
        }

        ASS_Event *cur = track->events;
        long long now = (long long)(tm * 1000);

        long long minFinish = -1, maxFinish = -1, minStart = -1;
        int current_animated = 0;

        for (int i = 0; i < track->n_events; i++, cur++) {
            long long start = cur->Start;
            long long finish = start + cur->Duration;
            if (start <= now) {
                if (finish > now) {
                    if (finish < minFinish || minFinish == -1) {
                        minFinish = finish;
                    }
                    if (finish > maxFinish) {
                        maxFinish = finish;
                    }
                    if (!current_animated && m_is_event_animated) current_animated = m_is_event_animated[i];
                }
            } else if (start < minStart || minStart == -1) {
                minStart = start;
            }
        }
        result.is_animated = current_animated;

        if (minFinish != -1) {
            // some event is going on, so we need to re-draw either when it stops
            // or when some other event starts
            result.eventFinish = ((minFinish < minStart) ? minFinish : minStart) / 1000.0;
        } else {
            // there's no current event, so no need to draw anything
            result.eventFinish = -1;
        }

        if (minFinish == maxFinish && (minStart == -1 || minStart > maxFinish)) {
            // there's empty space after this event ends
            result.emptyFinish = minStart / 1000.0;
        } else {
            // there's no empty space after eventFinish happens
            result.emptyFinish = result.eventFinish;
        }

        return &result;
    }

    void rescanAllAnimations() {
        free(m_is_event_animated);
        m_is_event_animated = (int*)malloc(sizeof(int) * track->n_events);
        if (m_is_event_animated == NULL) {
            printf("cannot parse animated events\n");
            exit(5);
        }

        ASS_Event *cur = track->events;
        int *animated = m_is_event_animated;
        for (int i = 0; i < track->n_events; i++, cur++, animated++) {
            *animated = _is_event_animated(cur, m_drop_animations);
        }
    }

private:
    RenderBlendPart* renderBlendPart(const BoundingBox& rect, ASS_Image* img) {
        // make float buffer for blending
        int width = rect.max_x - rect.min_x + 1, height = rect.max_y - rect.min_y + 1;
        float* buf = (float*)m_blend.take(sizeof(float) * width * height * 4, 0);
        if (buf == NULL) {
            printf("libass: error: cannot allocate buffer for blending");
            return NULL;
        }
        memset(buf, 0, sizeof(float) * width * height * 4);

        // blend things in
        for (ASS_Image *cur = img; cur != NULL; cur = cur->next) {
            if (cur->dst_x < rect.min_x || cur->dst_y < rect.min_y) continue; // skip images not fully within render region
            int curw = cur->w, curh = cur->h;
            if (curw == 0 || curh == 0 || cur->dst_x + curw - 1> rect.max_x || cur->dst_y + curh - 1 > rect.max_y) continue; // skip empty images or images outside render region
            int a = (255 - (cur->color & 0xFF));
            if (a == 0) continue; // skip transparent images

            int curs = (cur->stride >= curw) ? cur->stride : curw;
            int curx = cur->dst_x - rect.min_x, cury = cur->dst_y - rect.min_y;

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

        // find closest free buffer
        int needed = sizeof(unsigned int) * width * height;
        RenderBlendStorage *storage = m_blendParts, *bigBuffer = NULL, *smallBuffer = NULL;
        for (int buffer_index = 0; buffer_index < MAX_BLEND_STORAGES; buffer_index++, storage++) {
            if (storage->taken) continue;
            if (storage->buf.capacity() >= needed) {
                if (bigBuffer == NULL || bigBuffer->buf.capacity() > storage->buf.capacity()) bigBuffer = storage;
            } else {
                if (smallBuffer == NULL || smallBuffer->buf.capacity() > storage->buf.capacity()) smallBuffer = storage;
            }
        }

        if (bigBuffer != NULL) {
            storage = bigBuffer;
        } else if (smallBuffer != NULL) {
            storage = smallBuffer;
        } else {
            printf("libass: cannot get a buffer for rendering part!\n");
            return NULL;
        }
           
        unsigned int *result = (unsigned int*)storage->buf.take(needed, false);
        if (result == NULL) {
            printf("libass: cannot make a buffer for rendering part!\n");
            return NULL;
        }
        storage->taken = true;

        // now build the result;
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
        storage->part.dest_x = rect.min_x;
        storage->part.dest_y = rect.min_y;
        storage->part.dest_width = width;
        storage->part.dest_height = height;
        storage->part.image = (unsigned char*)result;
        return &storage->part;
    }

    ReusableBuffer m_blend;
    RenderBlendResult m_blendResult;
    RenderBlendStorage m_blendParts[MAX_BLEND_STORAGES];
    int *m_is_event_animated;
    bool m_drop_animations;
};

int main(int argc, char *argv[]) { return 0; }

#ifdef __EMSCRIPTEN__
#include "./SubOctpInterface.cpp"
#endif
