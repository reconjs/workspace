import { handleHook, usingServerImport } from "@reconjs/internals"
import { AnyFunction } from "@reconjs/utils"

const HOOKS: Record <string, AnyFunction> = {}

function getServerImport (key: string) {
  if (typeof key !== "string") throw new Error ("setServerImport requires a string")
  if (!HOOKS [key]) {
    throw new Error (`[getServerImport] missing ${key}`)
  }
  return HOOKS [key]
}

export const setServerImport = (key: string, val: AnyFunction) => {
  if (typeof key !== "string") throw new Error ("setServerImport requires a string")
  if (typeof val !== "function") throw new Error ("setServerImport requires a function")
  // console.log ("[setServerImport]", key)
  HOOKS [key] = val
}

export function handleServerImport () {
  handleHook (usingServerImport, (key, init) => {
    HOOKS [key] ||= init ()
  })

  return getServerImport
}
