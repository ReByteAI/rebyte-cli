#!/bin/sh

export REBYTE_CLI_DEV=1
deno run --lock=deno.lock --lock-write -A src/index.ts $@