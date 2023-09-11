#!/bin/sh

deno compile -A --unstable mod.ts --output rebyte-linux-x64 --target x86_64-unknown-linux-gnu
deno compile -A --unstable mod.ts --output rebyte-macos-arm64 --target aarch64-apple-darwin
deno compile -A --unstable mod.ts --output rebyte-macos-x64 --target x86_64-apple-darwin
