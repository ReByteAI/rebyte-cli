// deno-lint-ignore-file no-explicit-any

// @deno-types="https://deno.land/x/chalk_deno@v4.1.1-deno/index.d.ts"
import chalk from "https://deno.land/x/chalk_deno@v4.1.1-deno/source/index.js";

export function green(...args: any[]) {
  chalk.green(...args)
}

export function blue(...args: any[]) {
  chalk.blueBright(...args)
}

export function red(...args: any[]) {
  chalk.red(...args)
}