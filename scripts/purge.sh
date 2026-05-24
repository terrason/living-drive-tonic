#!/usr/bin/env bash

set -o errexit
set -o pipefail

rm -d /living/transient /living/optional /living/persistent /living/critical
rm -d /living
