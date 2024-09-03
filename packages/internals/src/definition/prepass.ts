import { Func } from "@reconjs/utils"

import { createRoot, defineHook, handleHook } from "../hooks"
import {
  AnyPrimitive,
  PrepassDef,
  PrepassHook,
  PrepassRef,
  Recon,
  ReconComponent,
  ReconType
} from "./types"

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

  return (component: ReconComponent, ...args: Recon<AnyPrimitive>[]) => {
    const index = list.length
    list.push ({
      component,
      args: prepassOfRefs (args),
    })

    const res: any = () => {
      throw new Error ("DO NOT USE")
    }

    res.__RECON__ = "local"
    res.prepass = { kind: "hook", index }

    return res
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

        ref.__RECON__ = "local"
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
