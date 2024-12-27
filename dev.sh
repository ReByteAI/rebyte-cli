#!/bin/sh

export REBYTE_CLI_DEV=1
deno run --lock=deno.lock -A src/index.ts $@