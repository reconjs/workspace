import {
  AnyFunction,
  loadPromise, 
  memoize, 
  preflush, 
  susync,
} from "@reconjs/utils"
import { 
  createRoot, 
  defineHook, 
  handleHook, 
  usingChild, 
  usingConstant,
} from "./hooks"
import { usingAtom } from "./atom"
import { ReconProvider, usingProvided } from "./providers"
import {
  usingBroadlyAux,
  usingDefinedSync,
  usingDefinedAction,
  usingDefinedAsync,
  usingDefinedEvent,
  usingServerAtom,
  usingServerImport,
} from "./core-hooks"
import { ReconMode, usingMode } from "./mode"

export class ManifestMode extends ReconMode {}

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



export function usingProxyAtom () {
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

const MODELS = [ MODEL, MODEL, MODEL ]

// Consumers

const usingConsumerSet = defineHook ((): Set <ReconProvider> => {
  throw new Error ("[usingConsumerSet] not implemented")
})

export function usingChildConsumers (factory: AnyFunction) {
  const consumers = usingConsumerSet ()

  usingConstant (() => {
    const list = getConsumers (factory)
    for (const item of list) {
      consumers.add (item)
    }
  })
}

// Runners

const getRoot = memoize ((_: AnyFunction) => {
  return createRoot ()
})

const getNode = memoize ((self: AnyFunction) => {
  const root = getRoot (self)

  const consumers = new Set <ReconProvider> ()

  return root.exec (() => {
    handleHook (usingMode, () => ManifestMode)
    handleHook (usingConsumerSet, () => consumers)

    handleHook (usingDefinedSync, (factory) => {
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
