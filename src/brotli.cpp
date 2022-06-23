// Adjusted from go cbrotli reader https://github.com/google/brotli/blob/7f740f1308336e9ec0afdb9434896307859f5dc9/go/cbrotli/reader.go
//
// Copyright 2016 Google Inc. All Rights Reserved.
//
// Distributed under MIT license.
// See file LICENSE for detail or copy at https://opensource.org/licenses/MIT

#include <stdio.h>
#include <stdlib.h>
#include <stdarg.h>
#include <string.h>
#include <vector>
#include <cstdint>

#include <brotli/decode.h>

static BrotliDecoderResult DecompressStream(BrotliDecoderState* s,
                                            uint8_t* out, size_t out_len,
                                            const uint8_t* in, size_t in_len,
                                            size_t* bytes_written,
                                            size_t* bytes_consumed) {
  size_t in_remaining = in_len;
  size_t out_remaining = out_len;
  BrotliDecoderResult result = BrotliDecoderDecompressStream(
      s, &in_remaining, &in, &out_remaining, &out, NULL);
  *bytes_written = out_len - out_remaining;
  *bytes_consumed = in_len - in_remaining;
  return result;
}

#define BUF_SIZE 1024 * 64

class Brotli {
public:

    static uint8_t* decode(const uint8_t* encoded, int encoded_size, int* decoded_size) {
        *decoded_size = 0;

        BrotliDecoderState* state = BrotliDecoderCreateInstance(NULL, NULL, NULL);
        if (state == NULL){
            return NULL;
        }

        size_t written, consumed;

        const uint8_t* in = encoded;
        size_t in_size = encoded_size;

        std::vector<uint8_t> result_buf;
        uint8_t* out_buf = (uint8_t*)malloc(BUF_SIZE);
        if(out_buf == NULL){
            BrotliDecoderDestroyInstance(state);
            return NULL;
        }

        while(in_size > 0){
            BrotliDecoderResult result = DecompressStream(state, out_buf, BUF_SIZE, in, in_size, &written, &consumed);

            in += consumed;
            in_size -= consumed;


            if(written > 0){
                result_buf.insert(result_buf.end(), out_buf, out_buf + written);
            }

            switch(result){
                case BROTLI_DECODER_RESULT_SUCCESS:
                    break;
                case BROTLI_DECODER_RESULT_ERROR:
                    free(out_buf);
                    BrotliDecoderDestroyInstance(state);
                    return NULL;
                case BROTLI_DECODER_RESULT_NEEDS_MORE_OUTPUT:
                    if(written == 0){
                        free(out_buf);
                        BrotliDecoderDestroyInstance(state);
                        return NULL;
                    }
                    break;
                case BROTLI_DECODER_RESULT_NEEDS_MORE_INPUT:
                    break;
            }
        }

        free(out_buf);
        BrotliDecoderDestroyInstance(state);

        uint8_t* decoded = (uint8_t*)malloc(result_buf.size());
        std::copy(result_buf.begin(), result_buf.end(), decoded);
        *decoded_size = result_buf.size();
        return decoded;
    }

};
