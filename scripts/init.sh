#!/usr/bin/env bash
set -o errexit
set -o pipefail

DAEMON_USER=ldt

mkdir /living
mkdir /living/transient /living/optional /living/persistent /living/critical

chown -R ${DAEMON_USER}:${DAEMON_USER} /living
