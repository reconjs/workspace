import { Func } from "@reconjs/utils"

import { Atomizable, InferAtomizableType } from "../atom"
import { defineHook, isReconRunning } from "../hooks"
import { ModelClass, Modeled } from "../models"

import { usingPrepasser } from "./prepass"
import { 
  InferReconType, 
  Recon, 
  ReconConstant, 
  ReconHook, 
  ReconResolver, 
  ReconType, 
  Reconic,
} from "./types"

interface ReconConstructorAux <
  A extends Atomizable[],
  P extends Recon<Atomizable>[] = {
    [K in keyof A]: Recon <A[K]>
  }
> {
  <F extends (...args: P) => ReconHook>(): (...args: P) => ReturnType <ReturnType <F>>
  <F extends (...args: P) => Reconic>(): (...args: P) => ReturnType <F>
}

interface ReconConstructor {
  /*
  <A extends ReconType[]> (...args: A): ReconConstructorAux <{
    [K in keyof A]: InferReconType <A[K]>
  }>
  */

  <F extends () => ReconConstant>(fn: F): ReturnType <F>
  <F extends () => ReconHook>(fn: F): () => ReturnType <ReturnType <F>>

  <F extends () => Reconic>(fn: F): () => ReturnType <F>
  <F extends Func>(fn: F): never
}

/*
function defineAux (factory: Func, types: ReconType[]) {
  const self = factory.bind (null)
  prepassOf (self)

  // TODO: args
  return () => {
    const args = [] as any[]

    if (!isReconRunning ()) {
      // TODO: allow for this to be overridden.
      throw new Error ("Hooks are not running.")
    }

    const prepasser = usingPrepasser ()
    if (prepasser) return prepasser (self, ...args)
    else return usingDefined (self, ...args)
  }
}
*/

// TODO: Run through the prepass!
const prepass = (factory: Func): Reconic => {

  const ANY: any = () => {}
  ANY.__RECON__ = "local" as string
  return ANY
}

function defineAux (factory: Func, types: ReconType[]) {
  // TODO: prepass! (a bit different from the one I tried before)
  // TODO: arguments
  const result = factory()

  // depending on the hook, we do different things.
  if (result.__RECON__ === "hook") {
    result.factory = factory
    return result()
  }
  if (result.__RECON__ === "constant") {
    result.factory = factory
    return result()
  }
  else if (result.__RECON__) {
    throw new Error ("Not implemented yet")
  }

  console.log ("Result:", result)
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

export function createHookResolver (
  factory: (fn: ReconHook) => (...args: Recon[]) => any
) {
  const _hook: Partial <ReconHook> = () => {
    const resolve = factory (hook)

    // TODO: More sophisticated.
    return resolve
  }

  const _resolver: Partial <ReconResolver> = (...args: any[]) => {
    // Allow for overload/resolution to value.
    // return usingResolve (hook, () => {
    //   return hook ()
    // })

    return hook
  }

  _resolver.__RECON__ = "resolver"
  const resolver = _resolver as ReconResolver
  
  _hook.__RECON__ = "hook"
  _hook.resolver = resolver
  const hook = _hook as ReconHook

  return resolver
}

export function createConstantResolver () {

}
