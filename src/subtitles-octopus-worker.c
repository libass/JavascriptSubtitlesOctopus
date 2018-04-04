#include <stdio.h>
#include <stdlib.h>
#include <stdarg.h>
#include <string.h>
#include "../libass/libass/ass.h"

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#endif

ASS_Library *ass_library;
ASS_Renderer *ass_renderer;
ASS_Track *track;

void msg_callback(int level, const char *fmt, va_list va, void *data)
{
    if (level > 5) // 6 for verbose
        return;
    printf("libass: ");
    vprintf(fmt, va);
    printf("\n");
}

void libassjs_init(int frame_w, int frame_h)
{
    char *subfile = "sub.ass";
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

    ass_set_frame_size(ass_renderer, frame_w, frame_h);
    ass_set_fonts(ass_renderer, "default.ttf", NULL, ASS_FONTPROVIDER_FONTCONFIG, "/fonts.conf", 1);

    track = ass_read_file(ass_library, subfile, NULL);
    if (!track) {
        printf("track init failed!\n");
        exit(4);
    }
}

void libassjs_resize(int frame_w, int frame_h)
{
    ass_set_frame_size(ass_renderer, frame_w, frame_h);
}

void libassjs_quit()
{
    ass_free_track(track);
    ass_renderer_done(ass_renderer);
    ass_library_done(ass_library);
}

ASS_Image * libassjs_render(double tm, int *changed)
{
    ASS_Image *img = ass_render_frame(ass_renderer, track, (int) (tm * 1000), changed);
    return img;
}

int main(int argc, char *argv[])
{
    
}
