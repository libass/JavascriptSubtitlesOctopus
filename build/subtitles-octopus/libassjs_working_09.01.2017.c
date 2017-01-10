#include <stdio.h>
#include <stdlib.h>
#include <stdarg.h>
#include <string.h>
#include "../libass/libass/ass.h"
#include <SDL/SDL.h>

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#endif

typedef struct image_s {
    int width, height, stride;
    unsigned char *buffer;      // RGB24
} image_t;

ASS_Library *ass_library;
ASS_Renderer *ass_renderer;

SDL_Surface *screen;
ASS_Track *track;

void msg_callback(int level, const char *fmt, va_list va, void *data)
{
    if (level > 5) // 6 for verbose
        return;
    printf("libass: ");
    vprintf(fmt, va);
    printf("\n");
}

void libassjs_init(int frame_w, int frame_h) // , char *subfile
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
	//ass_set_fonts(ass_renderer, "test.ttf", NULL, ASS_FONTPROVIDER_AUTODETECT, NULL, 1);
    //ass_set_fonts(ass_renderer, "test.ttf", "Sans",
    //              ASS_FONTPROVIDER_AUTODETECT, NULL, 1);
	
    track = ass_read_file(ass_library, subfile, NULL);
    if (!track) {
        printf("track init failed!\n");
        exit(4);
    }
	
    SDL_Init(SDL_INIT_VIDEO);
    screen = SDL_SetVideoMode(frame_w, frame_h, 32, SDL_SWSURFACE);
  
	//EM_ASM("SDL.defaults.copyOnLock = false; SDL.defaults.discardOnLock = true; SDL.defaults.opaqueFrontBuffer = false;");
}

void libassjs_resize(int frame_w, int frame_h)
{
    screen = SDL_SetVideoMode(frame_w, frame_h, 32, SDL_SWSURFACE);
	ass_set_frame_size(ass_renderer, frame_w, frame_h);
}

void libassjs_quit()
{
    ass_free_track(track);
    ass_renderer_done(ass_renderer);
    ass_library_done(ass_library);
	
	SDL_Quit();
}

#define _r(c)  ((c)>>24)
#define _g(c)  (((c)>>16)&0xFF)
#define _b(c)  (((c)>>8)&0xFF)
#define _a(c)  ((c)&0xFF)

static void blend_single(SDL_Surface *screen, ASS_Image *img)
{
    int x, y;
    unsigned char opacity = 255 - _a(img->color);
    unsigned char r1 = _r(img->color);
    unsigned char g1 = _g(img->color);
    unsigned char b1 = _b(img->color);
    unsigned char *src;
    unsigned char *dst;
	
	/*SDL_Surface* surf = SDL_CreateRGBSurfaceFrom(img->bitmap, img->w, img->h, 32, img->stride, r, g, b, _a(img->color));
	SDL_Rect dest = { img->dst_x, img->dst_y, img->w, img->h };
	SDL_BlitSurface(surf, NULL, screen, &dest);
	SDL_FreeSurface(surf);
	
	surf = NULL;
	
	return;*/

    src = img->bitmap;
	//dst = dst_canvas;
	dst = ((unsigned char*) screen->pixels) + img->dst_y * screen->pitch + img->dst_x * 4;
	for (y = 0; y < img->h; ++y) {
        for (x = 0; x < img->w; ++x) {
			/*
			// Just colors, can be used for multiple canvases (or merge via separate canvas)
			unsigned k = ((unsigned) src[x]) * opacity / 255;
            dst[x * 4] = r1;
            dst[x * 4 + 1] = g1;
            dst[x * 4 + 2] = b1;
            dst[x * 4 + 3] = k;
            */

            // Colors
            unsigned k = ((unsigned) src[x]) * opacity / 255;
            dst[x * 4] = (k * r1 + (255 - k) * dst[x * 4]) / 255;
            dst[x * 4 + 1] = (k * g1 + (255 - k) * dst[x * 4 + 1]) / 255;
            dst[x * 4 + 2] = (k * b1 + (255 - k) * dst[x * 4 + 2]) / 255;
            dst[x * 4 + 3] = (k * 255 + (255 - k) * dst[x * 4 + 3]) / 255;

			
			/*
			// More complex colors, but results should be same
			double a1 = (opacity / 255.0) * ((unsigned) src[x] / 255.0);
			double a2 = ((double)dst[x * 4 + 3]) / 255.0;
			
			// From https://en.wikipedia.org/wiki/Alpha_compositing
			dst[x * 4] = (r1 * a1 + dst[x * 4] * a2 * (1 - a1)) / (a1 + a2 * (1 - a1));
			dst[x * 4 + 1] = (g1 * a1 + dst[x * 4 + 1] * a2 * (1 - a1)) / (a1 + a2 * (1 - a1));
			dst[x * 4 + 2] = (b1 * a1 + dst[x * 4 + 2] * a2 * (1 - a1)) / (a1 + a2 * (1 - a1));
			// result = topAlpha + bottomAlpha * (1 - topAlpha)
            dst[x * 4 + 3] = (int) ((a1 + a2 * (1 - a1)) * 255);*/
        }
        src += img->stride;
        dst += screen->pitch;
    }
}

static void blend(SDL_Surface *screen, ASS_Image *img)
{
    int cnt = 0;
    while (img) {
        blend_single(screen, img);
        ++cnt;
        img = img->next;
    }
    //printf("%d images blended\n", cnt);
}

void libassjs_render(double tm)
{
	int detect_change = 0;

    ASS_Image *img =
        ass_render_frame(ass_renderer, track, (int) (tm * 1000), &detect_change);

    /*int cnt = 0;
    while (img) {
        ++cnt;
        img = img->next;
    }
    printf("%d images\n", cnt);*/
	
	if (0 || detect_change)
	{
		if (SDL_MUSTLOCK(screen)) SDL_LockSurface(screen);

		/*
		unsigned char *dst;
		dst = (unsigned char*) screen->pixels;
		int x, y;
		
		for (y = 0; y < screen->h; ++y) {
			for (x = 0; x < screen->w; ++x) {
				dst[x * 4] = 0;
				dst[x * 4 + 1] = 0;
				dst[x * 4 + 2] = 0;
				dst[x * 4 + 3] = 0;
			}
			dst += screen->pitch;
		}*/
		
		blend(screen, img);
		
		if (SDL_MUSTLOCK(screen)) SDL_UnlockSurface(screen);
		
		//SDL_Flip(screen);
	}
}

int main(int argc, char *argv[])
{
	
}
