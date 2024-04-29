import { Func } from "@reconjs/utils"

import { createRoot, defineHook, handleHook } from "../hooks"
import { Modeled } from "../models"
import { ReconType } from "./types"

export type PrepassAtom = {
  kind: "atom",
  from: "argument"|"hook",
  index: number,
}

export type PrepassHook = {
  hook: Func,
  args: Array <PrepassAtom>,
}

export type PrepassResult = {
  invoke?: Func,
  prepass: Func,
}

export type PrepassDef = {
  // args: Array <ReconType>,
  hooks: Array <PrepassHook>,
  result: PrepassResult,
}

const MAP = new Map <Func, PrepassDef> ()



// Define instruction hook

const NEVER_LIST = [] as PrepassHook[]

const usingPrepassHookList = defineHook (() => {
  return NEVER_LIST
})

/**
 * @returns a prepass register function 
 * (only if we are prepassing).
 */
export function usingPrepasser () {
  const list = usingPrepassHookList ()
  if (list === NEVER_LIST) return

  return (hook: Func, ...args: any): any => {
    list.push ({
      hook,
      args: [],
    })

    const { result } = prepassOf (hook)
    return result

    // TODO: more sophisticated...
    // return result.prepass (...args)
  }
}



// Calculate the instructions:

export function prepassOf (factory: Func) {
  const found = MAP.get (factory)
  if (found) return found

  try {
    const res = createRoot ().exec (() => {
      // TODO: args
      const def: PrepassDef = {
        // args: [],
        hooks: [],
        result: undefined as any,
      }

      handleHook (usingPrepassHookList, () => def.hooks)
      def.result = factory ()
      return def
    })

    MAP.set (factory, res)
    return res
  }
  catch (thrown) {
    if (thrown instanceof Promise) {
      throw new Error ("Instructions cannot be calculated asynchronously.")
    }
    throw thrown
  }
}
