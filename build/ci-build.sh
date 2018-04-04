#!/usr/bin/env bash
cd $(dirname $0)/..

# Force to use Python2
ln -sf /usr/bin/python2 /usr/bin/python
ln -sf /usr/bin/python2-config /usr/bin/python-config

make