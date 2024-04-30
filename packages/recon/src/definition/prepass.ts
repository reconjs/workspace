import { Func } from "@reconjs/utils"

import { createRoot, defineHook, handleHook } from "../hooks"
import { AnyPrimitive, Recon, ReconType } from "./types"

export type PrepassRef = {
  from: "argument"|"hook",
  index: number,
}

export type PrepassHook = {
  hook: Func,
  args: Array <PrepassRef>,
}

export type PrepassResult = {
  invoke?: Func,
  prepass: Func,
}

export type PrepassDef = {
  args: Array <ReconType>,
  hooks: Array <PrepassHook>,
  result: PrepassResult,
}

const MAP = new Map <Func, PrepassDef> ()



// Define instruction hook

const NEVER_LIST = [] as PrepassHook[]

const usingPrepassHookList = defineHook (() => {
  return NEVER_LIST
})

function prepassOfRefs (refs: Recon[]) {
  return refs.map ((a: any) => {
    if (! a.prepass) throw new Error ("PREPASS MISSING ON REF")
    return a.prepass as PrepassRef
  })
}

/**
 * @returns a prepass register function 
 * (only if we are prepassing).
 */
export function usingPrepasser () {
  const list = usingPrepassHookList ()
  if (list === NEVER_LIST) return

  return (hook: Func, ...args: Recon<AnyPrimitive>[]) => {
    const index = list.length
    list.push ({
      hook,
      args: prepassOfRefs (args),
    })

    const res: any = () => {
      throw new Error ("DO NOT USE")
    }

    res.__RECON__ = "prepass-ref"
    res.prepass = { kind: "hook", index }

    return res

    // TODO: more sophisticated...
    // return result.prepass (...args)
  }
}



// Calculate the instructions:

export function prepassOf (factory: Func, types: ReconType[]) {
  const found = MAP.get (factory)
  if (found) return found

  try {
    const res = createRoot ().exec (() => {
      const def: PrepassDef = {
        args: types,
        hooks: [],
        result: undefined as any,
      }

      handleHook (usingPrepassHookList, () => def.hooks)

      const args = types.map ((_, index) => {
        const ref: any = () => {
          throw new Error ("Not allowed")
        }

        ref.__RECON__ = "prepass-ref"
        ref.prepass = { kind: "argument", index }

        // TODO: update type
        return ref
      })

      def.result = factory (...args)
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
