import {
  AnyFunction,
  loadPromise, 
  memoize, 
  preflush, 
  susync,
} from "@reconjs/utils"
import { 
  ReconProvider,
  createRoot, 
  defineHook, 
  handleHook,
  usingAtom, 
  usingChild, 
  usingConstant,
  usingDefinedAction,
  usingDefinedAsync,
  usingDefinedEvent,
  usingDefinedSync,
  usingProvided,
} from "@reconjs/recon"
import { handleStore } from "../legacy/define-store"

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
    handleHook (usingConsumerSet, () => consumers)

    handleHook (usingDefinedSync, (factory) => {
      usingChildConsumers (factory)
      return usingProxyAtom ()
    })

    handleHook (usingProvided, (provider) => {
      console.log ("[getConsumers] usingProvided", provider)
      consumers.add (provider)
      return usingProxyAtom ()
    })

    handleStore ((factory) => {
      usingChildConsumers (factory)
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
