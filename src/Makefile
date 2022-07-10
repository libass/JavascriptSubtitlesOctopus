# If needed, override the following variables via `make VARNAME=VAL ...`
# Note: we only compile and not(!) link here, thus -c
CXX = em++ -c
CXXFLAGS = -O3 -g4
LIBASS_CXXFLAGS = $(shell pkg-config --static --cflags "libass >= 0.14.0")
LOCAL_CXXFLAGS  = -Wall -Wno-deprecated $(LIBASS_CXXFLAGS)

all: subtitles-octopus-worker.bc

SubOctpInterface.cpp: SubtitleOctopus.idl ../build/webidl_binder.py
	@# Our version of WebIDL contains JSO-specific patches
	python3 ../build/webidl_binder.py SubtitleOctopus.idl SubOctpInterface

subtitles-octopus-worker.bc: SubtitleOctopus.cpp libass.cpp SubOctpInterface.cpp
	@# All later dependencies are already included into the first by CPP
	$(CXX) $(LOCAL_CXXFLAGS) $(CXXFLAGS) -o $@ $<

clean:
	rm -f subtitles-octopus-worker.bc
	rm -f SubOctpInterface.cpp WebIDLGrammar.pkl parser.out

.PHONY: all clean
