#!/bin/sh

deno compile -A --unstable --output rebyte-linux-x64 --target x86_64-unknown-linux-gnu mod.ts 
deno compile -A --unstable --output rebyte-macos-arm64 --target aarch64-apple-darwin mod.ts
deno compile -A --unstable --output rebyte-macos-x64 --target x86_64-apple-darwin mod.ts
