#!/bin/sh

VERSION="$1"

echo "export const version = \"$VERSION\"" > ./src/version.ts