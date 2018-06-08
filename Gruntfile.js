module.exports = function(grunt) {

    // Project configuration.
    // Build order:
    // fribidi
    // expat
    // freetype
    // fontconfig
    // harfbuzz
    // libass
    // octopus
    // final
    const fs = require('fs');
    const path = require('path');

    var FREETYPE_PC_PATH = [
        path.resolve('./lib/harfbuzz/dist/lib/pkgconfig')
        
    ];
    var FONTCONFIG_PC_PATH = [
        path.resolve('./lib/freetype/dist/lib/pkgconfig'),
        path.resolve('./lib/expat/expat/dist/lib/pkgconfig')
    ];
    var HARFBUZZ_PC_PATH = [
        '../fribidi/dist/lib/pkgconfig',
        '../freetype/dist_hb/lib/pkgconfig',
        '../expat/expat/dist/lib/pkgconfig'
    ];
    var LIBASS_PC_PATH = [
        '../fribidi/dist/lib/pkgconfig',
        '../fontconfig/dist/lib/pkgconfig',
        '../harfbuzz/dist/lib/pkgconfig'
    ];

    var LIBASSJS_PC_PATH = [
        '../lib/freetype/dist/lib/pkgconfig',
        '../lib/expat/expat/dist/lib/pkgconfig',
        '../lib/fribidi/dist/lib/pkgconfig',
        '../lib/fontconfig/dist/lib/pkgconfig',
        '../lib/harfbuzz/dist/lib/pkgconfig',
        '../lib/libass/dist/lib/pkgconfig'
    ];

    var LIBASS_DEPS = [
        'lib/fribidi/dist/lib/libfribidi.so',
	    'lib/freetype/dist/lib/libfreetype.so',
	    'lib/expat/expat/dist/lib/libexpat.so',
	    'lib/harfbuzz/dist/lib/libharfbuzz.so',
        'lib/fontconfig/dist/lib/libfontconfig.so',
        'lib/libass/dist/lib/libass.so'
    ];

    var LIBASSJS_DEPS = [
        
    ];

    var EMCC_COMMON_ARGS = '' +
	'-s TOTAL_MEMORY=134217728 ' +
	'-O3 ' +
	'-s EXPORTED_FUNCTIONS="[\'_main\', \'_malloc\', \'_libassjs_init\', \'_libassjs_quit\', \'_libassjs_resize\', \'_libassjs_render\']" ' +
	'-s EXTRA_EXPORTED_RUNTIME_METHODS="[\'ccall\', \'cwrap\', \'getValue\', \'FS_createPreloadedFile\', \'FS_createFolder\']" ' +
	'-s NO_EXIT_RUNTIME=1 ' +
	'--use-preload-plugins ' +
	'--preload-file default.ttf ' +
	'--preload-file fonts.conf ' +
	'-s ALLOW_MEMORY_GROWTH=1 ' +
	'-s FORCE_FILESYSTEM=1 ' +
    '-o subtitles-octopus-worker.js ';
    
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        exec: {
            fribidi_stage1: {
                cwd: './lib/fribidi',
                cmd: function() {
                    if (!fs.existsSync("./lib/fribidi/configure")) {
                        return [
                            'git reset --hard &&',
                            'patch -Np1 -i "../../build/patches/Fix-Fribidi-Build.patch" &&',
                            'patch -Np1 -i "../../build/patches/fribidi-fixclang.patch" && ',
                            'NOCONFIGURE=1 ./autogen.sh'
                        ].join(' ');
                    } else {
                        return 'echo Bypass';
                    }
                }
            },
            fribidi_stage2: {
                cwd: './lib/fribidi',
                cmd: function() {
                    if (!fs.existsSync("./lib/fribidi/dist/lib/libfribidi.so")) {
                        return [
                            'emconfigure ./configure',
                            'CFLAGS=\'-O3\' NM=llvm-nm',
                            '--prefix="' + path.resolve('./lib/fribidi/dist') + '" ' +
                            '--host=x86-none-linux',
                            '--build=x86_64',
                            '--disable-static',
                            '--enable-shared',
                            '--disable-dependency-tracking',
                            '--disable-debug',
                            '&&',
                            'emmake make -j8 &&',
                            'emmake make install'
                        ].join(' ');
                    } else {
                        return 'echo Bypass';
                    }
                }
            },
            expat_stage1: {
                cwd: './lib/expat/expat',
                cmd: function() {
                    if (!fs.existsSync("./lib/expat/expat/configure")) {
                        return [
                            './buildconf.sh'
                        ].join(' ');
                    } else {
                        return 'echo Bypass';
                    }
                }
            },
            expat_stage2: {
                cwd: './lib/expat/expat',
                cmd: function() {
                    if (!fs.existsSync("./lib/expat/expat/dist/lib/libexpat.so")) {
                        return [
                            'emconfigure ./configure',
                            'CFLAGS=\'-O3\'',
                            '--prefix="' + path.resolve('./lib/expat/expat/dist') + '" ' +
                            '--host=x86-none-linux',
                            '--build=x86_64',
                            '--disable-static',
                            '--enable-shared',
                            '--disable-dependency-tracking',
                            '--without-docbook',
                            '--without-xmlwf',
                            '&&',
                            'emmake make -j8 &&',
                            'emmake make install'
                        ].join(' ');
                    } else {
                        return 'echo Bypass';
                    }
                }
            },
            freetype_hb: {
                cwd: './lib/freetype',
                cmd: function() {
                    if (!fs.existsSync("./lib/freetype/dist_hb/lib/libfreetype.so")) {
                        return [
                            'git reset --hard &&',
                            'NOCONFIGURE=1 ./autogen.sh &&',
                            'emconfigure ./configure',
                            'CFLAGS=\'-O3\'',
                            '--prefix="' + path.resolve('./lib/freetype/dist_hb') + '" ' +
                            '--host=x86-none-linux',
                            '--build=x86_64',
                            '--disable-static',
                            '--enable-shared',
                            '--without-zlib',
                            '--without-bzip2',
                            '--without-png',
                            '--without-harfbuzz',
                            '&&',
                            'emmake make -j8 &&',
                            'emmake make install'
                        ].join(' ');
                    } else {
                        return 'echo Bypass';
                    }
                }
            },
            harfbuzz: {
                cwd: './lib/harfbuzz',
                cmd: function() {
                    if (!fs.existsSync("./lib/harfbuzz/dist/lib/libharfbuzz.so")) {
                        return [
                            'git reset --hard &&',
                            'patch -Np1 -i "../../build/patches/harfbuzz-disablepthreads.patch" &&',
                            'NOCONFIGURE=1 ./autogen.sh &&',
                            'EM_PKG_CONFIG_PATH=' + HARFBUZZ_PC_PATH.join(':'),
                            'emconfigure ./configure',
                            'CFLAGS=\'-O3\'',
                            '--prefix="' + path.resolve('./lib/harfbuzz/dist') + '" ' +
                            '--host=x86-none-linux',
                            '--build=x86_64',
                            '--disable-static',
                            '--enable-shared',
                            '--disable-dependency-tracking',
                            '--with-default-fonts=/fonts',
                            '--without-cairo',
                            '--without-fontconfig',
                            '--without-icu',
                            '--with-freetype',
                            '--without-glib',
                            '&&',
                            'emmake make -j8 &&',
                            'emmake make install'
                        ].join(' ');
                    } else {
                        return 'echo Bypass';
                    }
                }
            },
            freetype: {
                cwd: './lib/freetype',
                cmd: function() {
                    if (!fs.existsSync("./lib/freetype/dist/lib/libfreetype.so")) {
                        return [
                            'git reset --hard &&',
                            'NOCONFIGURE=1 ./autogen.sh &&',
                            'EM_PKG_CONFIG_PATH=' + FREETYPE_PC_PATH.join(':'),
                            'emconfigure ./configure',
                            'CFLAGS=\'-O3\'',
                            '--prefix="' + path.resolve('./lib/freetype/dist') + '" ' +
                            '--host=x86-none-linux',
                            '--build=x86_64',
                            '--disable-static',
                            '--enable-shared',
                            '--without-zlib',
                            '--without-bzip2',
                            '--without-png',
                            '--with-harfbuzz',
                            '&&',
                            'emmake make -j8 &&',
                            'emmake make install'
                        ].join(' ');
                    } else {
                        return 'echo Bypass';
                    }
                }
            },
            fontconfig: {
                cwd: './lib/fontconfig',
                cmd: function() {
                    if (!fs.existsSync("./lib/fontconfig/dist/lib/libfontconfig.so")) {
                        return [
                            'git reset --hard &&',
                            'patch -Np1 -i "../../build/patches/fontconfig-fix.patch" &&',
                            'NOCONFIGURE=1 ./autogen.sh &&',
                            'EM_PKG_CONFIG_PATH=' + FONTCONFIG_PC_PATH.join(':'),
                            'emconfigure ./configure',
                            'CFLAGS=\'-O3\'',
                            '--prefix="' + path.resolve('./lib/fontconfig/dist') + '" ' +
                            '--host=x86-none-linux',
                            '--build=x86_64',
                            '--disable-static',
                            '--enable-shared',
                            '--disable-docs',
                            '--with-default-fonts=/fonts',
                            '&&',
                            'emmake make -j8 &&',
                            'emmake make install'
                        ].join(' ');
                    } else {
                        return 'echo Bypass';
                    }
                }
            },
            libass: {
                cwd: './lib/libass',
                cmd: function() {
                    if (!fs.existsSync("./lib/libass/dist/lib/libass.so")) {
                        return [
                            'git reset --hard &&',
                            'NOCONFIGURE=1 ./autogen.sh &&',
                            'EM_PKG_CONFIG_PATH=' + FONTCONFIG_PC_PATH.join(':') + ':' + LIBASS_PC_PATH.join(':'),
                            'emconfigure ./configure',
                            'CFLAGS=\'-O3\'',
                            '--prefix="' + path.resolve('./lib/libass/dist') + '" ' +
                            '--host=x86-none-linux',
                            '--build=x86_64',
                            '--disable-static',
                            '--enable-shared',
                            '--enable-harfbuzz',
                            '--disable-asm',
                            '--enable-fontconfig',
                            '&&',
                            'emmake make -j8 &&',
                            'emmake make install'
                        ].join(' ');
                    } else {
                        return 'echo Bypass';
                    }
                }
            },
            stage1: {
                cwd: './src',
                cmd: function() {
                    if (!fs.existsSync("./src/subtitles-octopus-worker.bc")) {
                        return [
                            'autoreconf -fi &&',
                            'EM_PKG_CONFIG_PATH=' + LIBASSJS_PC_PATH.join(':'),
                            'emconfigure ./configure --host=x86-none-linux --build=x86_64 &&',
                            'emmake make -j8 &&',
                            'mv subtitlesoctopus subtitles-octopus-worker.bc',
                        ].join(' ');
                    } else {
                        return 'echo Bypass';
                    }
                }
            },
            wasm: {
                cmd: function() {
                    if (fs.existsSync("./src/subtitles-octopus-worker.bc")) {
                        return [
                            'emcc -v src/subtitles-octopus-worker.bc',
                            LIBASS_DEPS.join(' '),
                            '--pre-js src/pre-worker.js',
                            '--post-js src/post-worker.js',
                            '-s WASM=1',
                            '-s "BINARYEN_METHOD=\'native-wasm\'"',
                            '-s "BINARYEN_TRAP_MODE=\'clamp\'"',
                            EMCC_COMMON_ARGS,
                            '&& mv subtitles-octopus-worker.* dist/wasm/ &&',
                            'cp src/subtitles-octopus.js dist/wasm/'
                        ].join(' ');
                    } else {
                        return '';
                    }
                }
            }
        }
    });
  
    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-exec');
  
    // Default task(s).
    grunt.registerTask('default', ['exec']);
  
  };