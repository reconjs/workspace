import { Func } from "@reconjs/utils"

import { Atomizable } from "../atom"
import { defineHook, isReconRunning } from "../hooks"

import {
  InferReconType,
  InferResolverType,
  Recon,
  ReconConstant,
  ReconHook,
  ReconHookResolver,
  ReconType,
  Reconic,
} from "./types"
import { prepassOf } from "./prepass"

interface ReconConstructorAux <
  A extends Atomizable[],
  P extends Recon<Atomizable>[] = {
    [K in keyof A]: Recon <A[K]>
  }
> {
  <F extends () => ReconHookResolver>(fn: F): () => InferResolverType <
    ReturnType <F>
  >
  <F extends (...args: P) => Reconic>(): (...args: P) => ReturnType <F>
}

interface ReconConstructor {
  <A extends ReconType[]> (...args: A): ReconConstructorAux <{
    [K in keyof A]: InferReconType <A[K]>
  }>

  <F extends () => ReconConstant>(fn: F): ReturnType <F>
  <F extends () => ReconHookResolver>(fn: F): () => InferResolverType <ReturnType <F>>

  <F extends () => Reconic>(fn: F): () => ReturnType <F>
  // <F extends Func>(fn: F): never
}

function defineAux (factory: Func, types: ReconType[]) {
  // TODO: prepass! (a bit different from the one I tried before)
  const prepass = prepassOf (factory)

  // depending on the hook, we do different things.
  if (prepass.result instanceof ReconHookResolver) {
    const resolver = prepass.result as ReconHookResolver
    resolver.hook = new ReconHook ({ factory })

    return (...args: Recon[]) => {
      if (isReconRunning()) {
        console.log ("--- Resolve ---")
        return resolver.resolve (...args)
      }
      else if (resolver.invoke) {
        console.log ("--- Invoke ---")
        return resolver.invoke (...args)
      }
      else throw new Error ("Invalid hook call")
    }
  }

  // TODO: Constants
  // TODO: Reconic

  throw new Error ("Result is not valid")
}

function define (...args: any[]) {
  if (args.length === 0) {
    throw new Error ("[recon] define requires an argument")
  }

  const isReconType = (x: any) => x.__RECON__ === "type"

  // TODO: check if all arguments are ReconTypes
  if (args.every (isReconType)) {
    return (fn: Func) => defineAux (fn, args)
  }

  if (args.length > 1) {
    throw new Error (
      "[recon] define only accepts multiple" + 
      "arguments if they are ReconTypes."
    )
  }

  const [ arg ] = args

  if (typeof arg === "function") {
    return defineAux (args[0], [])
  }

  throw new Error ("[recon] define does not accept these arguments")
}



export default define as ReconConstructor


// usingDefined

export const usingDefined = defineHook ((self: Func, ...args: any[]) => {
  return self (...args)
})
