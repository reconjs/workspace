import {
  ReconProvider,
  createNode,
  createRoot,
  handleHook,
  usingAtom,
  usingBroadlyAux,
  usingChild,
  usingConstant,
  usingDefined,
  usingDefinedAction,
  usingDefinedAsync,
  usingDefinedEvent,
  usingProvided,
  usingServerAtom,
  usingServerImport,
} from "@reconjs/recon"
import {
  AnyFunction,
  loadPromise, 
  memoize, 
  susync
} from "@reconjs/utils"
import { handleStore } from "../define-store"

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



function usingProxyAtom () {
  return usingAtom (() => {
    // noop
  })
}

const MODEL = {
  __RECON__: "modeled",
  read: () => {
    throw new Error ("[DEFAULT_MODEL] not callable")
  }
}

const MODELS = [ MODEL, MODEL, MODEL]

const getRoot = memoize ((_: AnyFunction) => {
  return createRoot ()
})

const getNode = memoize ((self: AnyFunction) => {
  const root = getRoot (self)

  const consumers = new Set <ReconProvider> ()

  function usingChildConsumers (factory: AnyFunction) {
    usingConstant (() => {
      const list = getConsumers (factory)
      for (const item of list) {
        consumers.add (item)
      }
    })
  }

  return root.exec (() => {
    handleHook (usingDefined, (factory) => {
      usingChildConsumers (factory)
      return usingProxyAtom ()
    })

    handleHook (usingDefinedAsync, (factory) => {
      usingChildConsumers (factory)
      return usingProxyAtom ()
    })

    handleHook (usingDefinedAction, (factory) => {
      usingChildConsumers (factory)
      return usingProxyAtom ()
    })

    handleHook (usingDefinedEvent, (factory) => {
      usingChildConsumers (factory)
      return usingProxyAtom ()
    })

    // TODO: Is this still necessary?
    handleHook (usingServerImport, () => {})

    handleHook (usingServerAtom, () => {
      // TODO: get from request?
      return usingProxyAtom ()
    })

    // @ts-ignore
    handleHook (usingBroadlyAux, () => {
      return usingConstant (() => (factory: AnyFunction) => {
        return factory
      })
    })

    handleHook (usingProvided, (provider) => {
      console.log ("[getConsumers] usingProvided", provider)
      consumers.add (provider)
      return usingProxyAtom ()
    })

    handleStore (() => {
      usingChildConsumers (self)
      return usingProxyAtom ()
    })

    return [
      usingChild (),
      () => Array.from (consumers.values())
    ] as const
  })
})

const getPromise = memoize (async (factory) => {
  console.log ("getting consumers...")

  const [ node, read ] = await susync (() => getNode (factory))
  await node.susync (() => {
    factory (...MODELS)
  })
  return read ()
})

export function getConsumers (factory: AnyFunction) {
  const res = loadPromise (getPromise (factory))
  console.log ("[getConsumers] got consumers", res)
  return res
}
