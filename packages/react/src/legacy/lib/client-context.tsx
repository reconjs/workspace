import { ReconContext, ReconNode, getDefinitionKey, usingChild, usingConstant, usingStack } from "@reconjs/internals"
import {
  AnyFunction,
  Source,
  Store,
  asLoadable,
  createStore,
  isEqual,
  memoize,
  susync,
} from "@reconjs/utils"
import { Depository } from "./using-query"

export type Metastored = {
  factory: AnyFunction,
  args: any[],
}

type RefreshSource <T> = Source <T> & {
  refresh: () => void,
}

export interface ClientContext extends ReconContext {
  node: ReconNode,
  source: RefreshSource <Metastored[]>,
  store: (factory: AnyFunction, ...args: any[]) => Store <{
    result?: any,
    thrown?: any,
  }>,
  serialize: () => Promise <Depository>
}



function createSource <T> (read: () => T): RefreshSource <T> {
  const store = createStore (() => ({
    cached: undefined as T|undefined,
  }))

  return {
    subscribe: store.subscribe,
    refresh: () => {
      const { cached } = store.read()
      const curr = read ()
      if (isEqual (cached, curr)) return

      store.read().cached = undefined
      store.refresh()
    },
    read: () => {
      const { cached } = store.read()
      if (cached) return cached

      const res = read ()
      store.read().cached = res
      return res
    },
  }
}



const setOf = memoize ((context: ReconContext) => {
  return new Set <Metastored> ()
})

export const clientContextOf = memoize ((context: ReconContext) => {
  const self = context as ClientContext

  self.source = createSource (() => {
    return Array.from (setOf (self).values())
  })

  self.store = memoize ((factory: AnyFunction, ...args: any[]) => {
    console.log ("initializing store...")

    setOf (self).add ({ factory, args })
    self.source.refresh ()

    let onInit: () => void

    const thrown = asLoadable (
      new Promise <void> ((resolve) => {
        onInit = resolve
      })
    )

    const store = createStore <any> (() => ({ thrown }))

    const unsub = store.subscribe (() => {
      unsub ()
      onInit ()
    })

    return store
  })

  return self
})

function tryx <T> (func: () => T) {
  try {
    return func ()
  }
  catch (thrown) {}
}

export function usingClientSerializer () {
  const node = usingChild ()
  const stack = usingStack ()

  throw new Error ("usingClientSerializer is not finished")

  return usingConstant (() => {
    return async () => {
      const data = {} as Depository

      const contexts = stack
        .map (c => clientContextOf (c))

      // TODO: filter out repeated contexts
      // TODO: queueing
      for (const context of contexts) {
        const metastored = Array.from (setOf (context))
        for (const { factory, args } of metastored) {
          const key = tryx (() => getDefinitionKey (factory))
          if (! key) continue

          const target = (data [key] ??= [])

          let promise: Promise<any>|null = Promise.resolve ()
          while (promise) {
            await promise
            promise = null

            const curr = context.store (factory, args).read ()
            if (curr.thrown instanceof Promise) {
              promise = curr.thrown
              continue
            }

            target.push ({
              value: curr.result,
              error: curr.thrown?.message,
              args,
              scopes: {}, // TODO:
            })
          }
        }
      }

      return data
    }
  })
}
