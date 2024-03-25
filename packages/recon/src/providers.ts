import {
  defineHook,
  handleHook,
  usingChild,
  usingConstant,
  usingHandler,
} from "./hooks"

import { AdaptedSync } from "./adapt"
import { Atom, usingAtom } from "./atom"
import { Modelable } from "./models"
import { memoize, once, presolve } from "@reconjs/utils"

export interface ReconProvider <
  M extends Modelable = Modelable
> {
  __RECON__: "provider",
  (arg: Atom <M>): void,
  consume: () => Atom <M>,
}

export type InferProvider <P extends ReconProvider> =
  P extends ReconProvider <infer M> ? M : never

function ensureProvider (arg: any): arg is ReconProvider {
  if (typeof arg !== "function") throw new Error ("[ensureProvider] not a function")
  if (arg.__RECON__ !== "provider") throw new Error ("[ensureProvider] __RECON__ !== provider")
  if (typeof arg.consume !== "function") throw new Error ("[ensureProvider] no consume method")
  
  return arg
}



export class ReconContext {
  __RECON__ = "context" as const
}

const CONTEXT: ReconContext = new ReconContext ()


// Registry

const refByKey = new Map <string, ReconProvider> ()
const keyByRef = new Map <ReconProvider, string> ()

export function registerProvider (key: string, by: ReconProvider) {
  refByKey.set (key, by)
  keyByRef.set (by, key)
}

export const getFlush = memoize (() => {
  return presolve (async () => {
    return () => {}
  })
})

export function getProviderRef (key: string) {
  const flush = getFlush ()
  flush ()
  const found = refByKey.get (key)
  if (!found) throw new Error (`[getProviderRef] not found (${key})`)
  return found
}

export function getProviderKey (provider: ReconProvider) {
  const found = keyByRef.get (provider)
  if (!found) throw new Error ("[getProviderKey] not found")
  return found
}



// Hooks

// TODO: Is this a temp workaround?
export const usingStack = defineHook (() => {
  return [] as ReconContext[]
})

export const usingContext = defineHook ((...providers: ReconProvider[]) => {
  console.log ("[usingContext] root", ...providers)
  return CONTEXT
})

export const usingProvider = defineHook ((
  context: ReconContext
): ReconProvider => {
  throw new Error ("[usingProvider] not implemented")
})



export const usingProvided = defineHook ((provider: ReconProvider) => {
  ensureProvider (provider)

  const node = usingChild ()

  const getAdapted = usingConstant (() => {
    return once (() => node.exec (() => {
      return provider.consume ()
    }))
  })

  const atom = usingAtom (() => {
    const adapted = getAdapted ()
    return adapted ()
  })

  usingConstant (() => {
    function copyProperty (key: string) {
      Object.defineProperty (atom, key, {
        get () {
          const adapted = getAdapted ()
          // @ts-ignore
          return adapted [key]
        }
      })
    }

    copyProperty ("model")
    copyProperty ("optional")
    copyProperty ("collection")
  })

  return atom
})



let count = 0

export const provide = defineHook ((by: ReconProvider, atom: Atom) => {
  console.log ("providing...", { by, atom })

  const context = usingConstant (() => {
    const res = new ReconContext ()
    // @ts-ignore
    res.debugLabel = `#${++count}`
    return res
  })

  const _usingContext = usingHandler (usingContext)
  handleHook (usingContext, (...providers: ReconProvider[]) => {
    console.log ("[usingContext] handled", ...providers)
    if (providers.includes (by)) return context
    return _usingContext (...providers)
  })

  const _usingProvider = usingHandler (usingProvider)
  handleHook (usingProvider, (ctx: ReconContext) => {
    if (ctx === context) return by
    return _usingProvider (ctx)
  })

  const _usingProvided = usingHandler (usingProvided)
  handleHook (usingProvided, (provider: ReconProvider) => {
    console.log ("usingProvided", { provider, by, atom })
    if (provider === by) {
      console.log ("- match")
      return atom
    }
    return _usingProvided (provider)
  })

  const stack = usingStack ()
  handleHook (usingStack, () => {
    return usingConstant (() => [context, ...stack])
  })

  return context
})


// @ts-ignore
CONTEXT.debugLabel = "CONTEXT"
// @ts-ignore
usingStack.debugLabel = "usingStack"
// @ts-ignore
usingContext.debugLabel = "usingContext"
// @ts-ignore
usingProvider.debugLabel = "usingProvider"
// @ts-ignore
usingProvided.debugLabel = "usingProvided"
// @ts-ignore
provide.debugLabel = "provide"
