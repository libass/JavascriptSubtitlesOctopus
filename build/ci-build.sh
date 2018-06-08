#!/usr/bin/env bash
cd $(dirname $0)/..

# Force to use Python2
sudo ln -sf /usr/bin/python2 /usr/bin/python
sudo ln -sf /usr/bin/python2-config /usr/bin/python-config

emcc
emcc

make