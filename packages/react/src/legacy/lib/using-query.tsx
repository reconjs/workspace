import {
  Atoms,
  defineHook,
} from "@reconjs/internals"

import { Serial } from "@reconjs/utils"

import { AnyViewDef } from "../types"

// Helper Hooks

// Query

export type Depository = Record <string, Array <{
  value?: Serial,
  error?: string,
  args: Serial[],
  scopes: Record <string, Serial>,
}>>

export function validateDepository (depository: Depository) {
  if (typeof depository !== "object") {
    throw new Error ("Depository must be an object")
  }

  for (const [ key, val ] of Object.entries (depository)) {
    if (typeof key !== "string") {
      throw new Error ("Depository keys must be strings")
    }

    if (!Array.isArray (val)) {
      throw new Error ("Depository values must be arrays")
    }

    for (const item of val) {
      if (typeof item !== "object") {
        throw new Error ("Depository items must be objects")
      }

      if (typeof item.value === "undefined") {
        throw new Error ("Depository items must have a value")
      }

      if (!Array.isArray (item.args)) {
        throw new Error ("Depository items must have args")
      }

      if (! item.scopes) {
        throw new Error ("Depository items must have scopes")
      }

      if (Array.isArray (item.scopes)) {
        throw new Error ("Scopes must be a dict")
      }
    }
  }
}

export const usingQuery = defineHook ((
  definition: AnyViewDef, 
  ...args: Atoms
): Depository => {
  throw new Error ("Not implemented")
})
