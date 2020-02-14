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

int main(int argc, char *argv[]) {}

#include "./SubOctpInterface.cpp"