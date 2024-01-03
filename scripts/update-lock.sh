#!/bin/sh

deno cache --unstable --lock=deno.lock --lock-write ./mod.ts
