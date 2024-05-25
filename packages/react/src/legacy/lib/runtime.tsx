import {
  usingConstant,
  getProviderRef,
  getProviderKey,
  handleHook,
  usingMode,
  usingChild,
  Atom,
  SerializedNode,
  createRoot,
  usingSerializedNode,
  usingStack,
  provide,
  usingHandler,
  ReconContext,
  usingBroadlyAux,
  usingAtom,
  usingDefinedSync,
  usingDefinedAsync,
  MANIFESTS,
  setServerPreloader,
} from "@reconjs/recon"

import {
  Serial,
  loadPromise,
  preflush,
  presolve,
  susync,
} from "@reconjs/utils"

import { StaticMode } from "../static/mode"
import { handleServer } from "./server-hooks"
import {
  usingDefinedAsync_default,
  usingDefined_default,
} from "./provide-defined"
import { handleStore } from "../define-store"

function log (key: string, obj: any) {
  console.log (key, JSON.stringify (obj, null, 2))
}

function createValueAtom <T extends Serial> (
  value: T
): Atom <T> {
  const res: Partial <Atom> = () => value
  res.__RECON__ = "atom"
  return res as any
}



function usingRef <T = any> () {
  return usingConstant (() => ({
    current: undefined as any as T,
  }))
}

function usingFunction <T> (factory: () => T): () => T {
  const ref = usingRef ()

  return usingConstant (() => () => {
    ref.current ||= factory ()
    return ref.current
  })
}

function usingLogRuntime (key: string) {
  const serialized = usingSerializedNode ()
  usingConstant (() => {
    log (key, serialized)
  })
}

interface SerialContext extends ReconContext {
  serialize: () => Promise <{
    key: string,
    value: Serial,
  }>
}

export function handleSerialized () {
  console.log ("handleSerialized")

  handleHook (usingSerializedNode, () => {
    const contexts = usingStack () as SerialContext[]

    const getPromise = usingFunction (async () => {
      const scopes = await Promise.all (contexts.map (c => c.serialize()))
      await preflush ()

      const res: SerializedNode = {
        __RECON__: "runtime",
        scopes,
        data: {},
        manifests: MANIFESTS.read (),
      }
      
      return res
    })

    return loadPromise (getPromise ())
  })
}



export function deserializeNode (serialized: SerializedNode) {
  const root = createRoot ().exec (() => {
    handleHook (usingMode, () => StaticMode)

    handleStore (() => {
      return usingAtom (() => {
        throw new Error ("Attempted to call store in static mode")
      })
    })
    
    handleHook (usingBroadlyAux, (theList) => {
      return usingConstant (() => (factory: () => Serial) => {
        // TODO: REAL IMPLEMENTATION
        return () => null
      })
    })

    const _provide = usingHandler (provide)
    handleHook (provide, (by, arg) => {
      const context = _provide (by, arg) as SerialContext
      context.serialize ||= async () => ({
        key: getProviderKey (by),
        value: await susync (() => arg()),
      })
      return context
    })

    handleSerialized ()

    handleHook (usingDefinedSync, usingDefined_default)
    handleHook (usingDefinedAsync, usingDefinedAsync_default)
    
    handleServer ()

    console.log ("scopes", serialized.scopes)
    const { scopes = [] } = serialized
    for (const { key, value } of scopes.toReversed ()) {
      const provider = getProviderRef (key)
      const atom = createValueAtom (value) as any
      provide (provider, atom)
    }

    return usingChild ()
  })

  console.log ("deserialized the node")
  root.handler.debugLabel = "deserializeNode"

  return root
}
