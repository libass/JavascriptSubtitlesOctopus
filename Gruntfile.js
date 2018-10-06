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

    const fs = require('fs');
    const path = require('path');

    var FREETYPE_PC_PATH = [
        path.resolve('./lib/harfbuzz/dist/lib/pkgconfig')
    ];
    var FONTCONFIG_PC_PATH = [
        path.resolve('./lib/harfbuzz/dist/lib/pkgconfig'),
        path.resolve('./lib/fribidi/dist/lib/pkgconfig'),
        path.resolve('./lib/freetype/dist/lib/pkgconfig'),
        path.resolve('./lib/expat/expat/dist/lib/pkgconfig')
    ];
    var HARFBUZZ_PC_PATH = [
        path.resolve('./lib/fribidi/dist/lib/pkgconfig'),
        path.resolve('./lib/freetype/dist_hb/lib/pkgconfig'),
        path.resolve('./lib/expat/expat/dist/lib/pkgconfig')
    ];
    var LIBASS_PC_PATH = [
        path.resolve('./lib/fribidi/dist/lib/pkgconfig'),
        path.resolve('./lib/fontconfig/dist/lib/pkgconfig'),
        path.resolve('./lib/harfbuzz/dist/lib/pkgconfig')
    ];

    var LIBASSJS_PC_PATH = [
        path.resolve('./lib/lib/freetype/dist/lib/pkgconfig'),
        path.resolve('./lib/lib/expat/expat/dist/lib/pkgconfig'),
        path.resolve('./lib/lib/fribidi/dist/lib/pkgconfig'),
        path.resolve('./lib/lib/fontconfig/dist/lib/pkgconfig'),
        path.resolve('./lib/lib/harfbuzz/dist/lib/pkgconfig'),
        path.resolve('./lib/lib/libass/dist/lib/pkgconfig')
    ];

    var LIBASS_DEPS = [
        path.resolve('lib/fribidi/dist/lib/libfribidi.so'),
	    path.resolve('lib/freetype/dist/lib/libfreetype.so'),
	    path.resolve('lib/expat/expat/dist/lib/libexpat.so'),
	    path.resolve('lib/harfbuzz/dist/lib/libharfbuzz.so'),
        path.resolve('lib/fontconfig/dist/lib/libfontconfig.so'),
        path.resolve('lib/libass/dist/lib/libass.so')
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
    '-o "subtitles-octopus-worker.js" ';
    
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        exec: {
            fribidi_configure: {
                cwd: './lib/fribidi',
                cmd: function() {
                    if (!fs.existsSync("./lib/fribidi/config.status")) {
                        return [
                            'git reset --hard &&',
                            'patch -Np1 -i "../../build/patches/fribidi_enable-lib-only-build.patch" &&',
                            'NOCONFIGURE=1 ./autogen.sh &&',
                            'emconfigure ./configure ',
                            'CFLAGS=\'-O3\' NM=llvm-nm',
                            '--prefix="' + path.resolve('./lib/fribidi/dist') + '" ' +
                            '--host=x86-none-linux',
                            '--build=x86_64',
                            '--disable-static',
                            '--enable-shared',
                            '--disable-dependency-tracking',
                            '--disable-debug'
                        ].join(' ');
                    } else {
                        return 'echo Bypass';
                    }
                }
            },
            fribidi_build: {
                cwd: './lib/fribidi',
                cmd: function() {
                    if (!fs.existsSync("./lib/fribidi/dist/lib/libfribidi.so")) {
                        return [
                            'emmake make -j8 &&',
                            'emmake make install'
                        ].join(' ');
                    } else {
                        return 'echo Bypass';
                    }
                }
            },
            expat_configure: {
                cwd: './lib/expat/expat',
                cmd: function() {
                    if (!fs.existsSync("./lib/expat/expat/config.status")) {
                        return [
                            './buildconf.sh',
                            '&&',
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
                        ].join(' ');
                    } else {
                        return 'echo Bypass';
                    }
                }
            },
            expat_build: {
                cwd: './lib/expat/expat',
                cmd: function() {
                    if (!fs.existsSync("./lib/expat/expat/dist/lib/libexpat.so")) {
                        return [
                            'emmake make -j8 &&',
                            'emmake make install'
                        ].join(' ');
                    } else {
                        return 'echo Bypass';
                    }
                }
            },
            freetype_hb_configure: {
                cwd: './lib/freetype',
                cmd: function() {
                    if (!fs.existsSync("./lib/freetype/build_hb/config.status")) {
                        return [
                            'NOCONFIGURE=1 ./autogen.sh &&',
                            'mkdir -p build_hb && cd build_hb &&',
                            'emconfigure ../configure',
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
                        ].join(' ');
                    } else {
                        return 'echo Bypass';
                    }
                }
            },
            freetype_hb_build: {
                cwd: './lib/freetype/build_hb',
                cmd: function() {
                    if (!fs.existsSync("./lib/freetype/dist_hb/lib/libfreetype.so")) {
                        return [
                            'emmake make -j8 &&',
                            'emmake make install'
                        ].join(' ');
                    } else {
                        return 'echo Bypass';
                    }
                }
            },
            harfbuzz_configure: {
                cwd: './lib/harfbuzz',
                cmd: function() {
                    if (!fs.existsSync("./lib/harfbuzz/config.status")) {
                        return [
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
                            '--without-glib'
                        ].join(' ');
                    } else {
                        return 'echo Bypass';
                    }
                }
            },
            harfbuzz_build: {
                cwd: './lib/harfbuzz',
                cmd: function() {
                    if (!fs.existsSync("./lib/harfbuzz/dist/lib/libharfbuzz.so")) {
                        return [
                            'emmake make -j8 &&',
                            'emmake make install'
                        ].join(' ');
                    } else {
                        return 'echo Bypass';
                    }
                }
            },
            freetype_configure: {
                cwd: './lib/freetype',
                cmd: function() {
                    if (!fs.existsSync("./lib/freetype/builds/unix/config.status")) {
                        return [
                            'git reset --hard &&',
                            'patch -Np1 -i "../../build/patches/freetype_disable-exports.patch" &&',
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
                            '--with-harfbuzz'
                        ].join(' ');
                    } else {
                        return 'echo Bypass';
                    }
                }
            },
            freetype_build: {
                cwd: './lib/freetype',
                cmd: function() {
                    if (!fs.existsSync("./lib/freetype/dist/lib/libfreetype.so")) {
                        return [
                            'emmake make -j8 &&',
                            'emmake make install'
                        ].join(' ');
                    } else {
                        return 'echo Bypass';
                    }
                }
            },
            fontconfig_configure: {
                cwd: './lib/fontconfig',
                cmd: function() {
                    if (!fs.existsSync("./lib/fontconfig/config.status")) {
                        return [
                            'git reset --hard &&',
                            'patch -Np1 -i "../../build/patches/fontconfig_disable-tests.patch" &&',
                            'patch -Np1 -i "../../build/patches/fontconfig_fix-fcstats-emscripten.patch" &&',
                            'patch -Np1 -i "../../build/patches/fontconfig_use_uuid_generate.patch" &&',
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
                            '--with-default-fonts=/fonts'
                        ].join(' ');
                    } else {
                        return 'echo Bypass';
                    }
                }
            },
            fontconfig_build: {
                cwd: './lib/fontconfig',
                cmd: function() {
                    if (!fs.existsSync("./lib/fontconfig/dist/lib/libfontconfig.so")) {
                        return [
                            'emmake make -j8 &&',
                            'emmake make install'
                        ].join(' ');
                    } else {
                        return 'echo Bypass';
                    }
                }
            },
            libass_configure: {
                cwd: './lib/libass',
                cmd: function() {
                    if (!fs.existsSync("./lib/libass/config.status")) {
                        return [
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
            libass_build: {
                cwd: './lib/libass',
                cmd: function() {
                    if (!fs.existsSync("./lib/libass/dist/lib/libass.so")) {
                        return [
                            'emmake make -j8 &&',
                            'emmake make install'
                        ].join(' ');
                    } else {
                        return 'echo Bypass';
                    }
                }
            },
            octopus_configure: {
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
            octopus_wasm: {
                cmd: function() {
                    if (fs.existsSync("./src/subtitles-octopus-worker.bc")) {
                        return [
                            'rm -frv subtitles-octopus-worker.* ./dist/wasm &&',
                            'mkdir ./dist/wasm &&',
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
            },
            octopus_asmjs: {
                cmd: function() {
                    if (fs.existsSync("./src/subtitles-octopus-worker.bc")) {
                        return [
                            'rm -frv subtitles-octopus-worker.* ./dist/asmjs &&',
                            'mkdir ./dist/asmjs &&',
                            'emcc -v src/subtitles-octopus-worker.bc',
                            LIBASS_DEPS.join(' '),
                            '--pre-js src/pre-worker.js',
                            '--post-js src/post-worker.js',
                            '-s WASM=0',
                            '-s "BINARYEN_METHOD=\'asmjs\'"',
                            '-s "BINARYEN_TRAP_MODE=\'clamp\'"',
                            EMCC_COMMON_ARGS,
                            '&& mv subtitles-octopus-worker.* dist/asmjs/ &&',
                            'cp src/subtitles-octopus.js dist/asmjs/'
                        ].join(' ');
                    } else {
                        return '';
                    }
                }
            },
            octopus_both: {
                cmd: function() {
                    if (fs.existsSync("./src/subtitles-octopus-worker.bc")) {
                        return [
                            'rm -frv subtitles-octopus-worker.* ./dist/both &&',
                            'mkdir ./dist/both &&',
                            'emcc -v src/subtitles-octopus-worker.bc',
                            LIBASS_DEPS.join(' '),
                            '--pre-js src/pre-worker.js',
                            '--post-js src/post-worker.js',
                            '-s WASM=1',
                            '-s "BINARYEN_METHOD=\'native-wasm\'"',
                            '-s "BINARYEN_TRAP_MODE=\'clamp\'"',
                            EMCC_COMMON_ARGS,
                            '&& mv subtitles-octopus-worker.* dist/both/ &&',
                            'cp src/subtitles-octopus.js dist/both/'
                        ].join(' ');
                    } else {
                        return '';
                    }
                }
            },

            // Clean

            fribidi_clean: {
                cwd: './lib/fribidi',
                cmd: function() {
                    return [
                        'git reset --hard && ',
                        'git clean -dfx'
                    ].join(' ');
                }
            },
            expat_clean: {
                cwd: './lib/expat',
                cmd: function() {
                    return [
                        'git reset --hard && ',
                        'git clean -dfx'
                    ].join(' ');
                }
            },
            freetype_clean: {
                cwd: './lib/freetype',
                cmd: function() {
                    return [
                        'git reset --hard && ',
                        'git clean -dfx'
                    ].join(' ');
                }
            },
            harfbuzz_clean: {
                cwd: './lib/harfbuzz',
                cmd: function() {
                    return [
                        'git reset --hard && ',
                        'git clean -dfx'
                    ].join(' ');
                }
            },
            fontconfig_clean: {
                cwd: './lib/fontconfig',
                cmd: function() {
                    return [
                        'git reset --hard && ',
                        'git clean -dfx'
                    ].join(' ');
                }
            },
            libass_clean: {
                cwd: './lib/libass',
                cmd: function() {
                    return [
                        'git reset --hard && ',
                        'git clean -dfx'
                    ].join(' ');
                }
            },
            octopus_clean: {
                cwd: './src',
                cmd: function() {
                    return [
                        'git clean -dfx'
                    ].join(' ');
                }
            },

            // Update

            fribidi_update: {
                cwd: './lib/fribidi',
                cmd: function() {
                    return [
                        'git pull origin master'
                    ].join(' ');
                }
            },
            expat_update: {
                cwd: './lib/expat',
                cmd: function() {
                    return [
                        'git pull origin master'
                    ].join(' ');
                }
            },
            freetype_update: {
                cwd: './lib/freetype',
                cmd: function() {
                    return [
                        'git pull origin master'
                    ].join(' ');
                }
            },
            harfbuzz_update: {
                cwd: './lib/harfbuzz',
                cmd: function() {
                    return [
                        'git pull origin master'
                    ].join(' ');
                }
            },
            fontconfig_update: {
                cwd: './lib/fontconfig',
                cmd: function() {
                    return [
                        'git pull origin master'
                    ].join(' ');
                }
            },
            libass_update: {
                cwd: './lib/libass',
                cmd: function() {
                    return [
                        'git pull origin master'
                    ].join(' ');
                }
            },

            getSubmodules: {
                cmd: function() {
                    return [
                        'git submodule sync --recursive &&',
                        'git submodule update --init --recursive'
                    ].join(' ');
                }
            }
        },
        
    });
  
    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-exec');
  
    // Default task(s).
    grunt.registerTask('default', ['build']);
    grunt.registerTask('build', 'build all dependencies and the project', function() {
        grunt.task.run(
            [
                'exec:fribidi_configure',
                'exec:fribidi_build',
                'exec:expat_configure',
                'exec:expat_build',
                'exec:freetype_hb_configure',
                'exec:freetype_hb_build',
                'exec:harfbuzz_configure',
                'exec:harfbuzz_build',
                'exec:freetype_configure',
                'exec:freetype_build',
                'exec:fontconfig_configure',
                'exec:fontconfig_build',
                'exec:libass_configure',
                'exec:libass_build',
                'exec:octopus_configure',
                'exec:octopus_wasm',
                'exec:octopus_asmjs',
                'exec:octopus_both'
            ]);
    });
    grunt.registerTask('clean', function() {
        grunt.task.run(
            [
                'exec:fribidi_clean',
                'exec:expat_clean',
                'exec:harfbuzz_clean',
                'exec:freetype_clean',
                'exec:fontconfig_clean',
                'exec:libass_clean',
                'exec:octopus_clean'
            ]);
    });
    grunt.registerTask('update', function() {
        grunt.task.run(
            [
                'exec:fribidi_update',
                'exec:expat_update',
                'exec:harfbuzz_update',
                'exec:freetype_update',
                'exec:fontconfig_update',
                'exec:libass_update'
            ]);
    });
    grunt.registerTask('getsubmodules', ['exec:getSubmodules']);
  };