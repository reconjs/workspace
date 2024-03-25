import { ServerContextJSONValue } from "react"
import { Loadable, asLoadable, loadPromise } from "./loadable"

export type Subscribe = (listener?: VoidFunction) => VoidFunction

export type Source <T> = {
  subscribe: Subscribe,
  read: () => T,
}

export type MutableSource <T, P> = Source <T> & {
  dispatch: (payload: P) => void,
  refresh: () => void,
}

export type Store <T> = MutableSource <T, T>

// Similar to a MutableSource but the "subscription" is platform-level
export type Stream <T, P> = {
  read: () => Promise <T>,
  dispatch: (payload: P) => Promise <void>,
}

export function createEvent () {
  const listeners = new Set <VoidFunction> ()
  const subscribe: Subscribe = (callback) => {
    if (!callback) return () => {}
    listeners.add (callback)
    return () => {
      listeners.delete (callback)
    }
  }

  let erred = false
  
  function push () {
    if (erred) return

    listeners.forEach ((callback) => {
      try {
        return callback()
      }
      catch (error) {
        erred = true
        console.error ("[push] error")
        console.error (error)
      }
    })
  }

  return { push, subscribe }
}

export function createStore <T> (initialize: () => T) {
  let result: T
  let thrown: any
  try {
    result = initialize ()
  }
  catch (_thrown) {
    thrown = _thrown
  }

  const listeners = new Set <VoidFunction> ()

  let erred = false

  const refresh = () => {
    if (erred) return

    listeners.forEach ((callback) => {
      try {
        return callback()
      }
      catch (error) {
        erred = true
        console.error ("[refresh] error")
        console.error (error)
      }
    })
  }

  const res: Store <T> = {
    read: () => {
      if (thrown) throw thrown
      return result
    },
    dispatch: (payload: T) => {
      result = payload
      refresh()
    },
    subscribe: (callback) => {
      if (!callback) return () => {}
      listeners.add (callback)
      return () => {
        listeners.delete (callback)
      }
    },
    refresh,
  }

  return res
}

/**
 * A store which serves as a single entry point for multiple other stores
 * 
 * @param metastore 
 * @returns 
 */
export function createStoreProxy <T> (metastore: Source <Store <T>>) {
  const listeners = new Set <VoidFunction> ()

  function refresh () {
    const next = metastore.read()
    if (curr !== next) {
      cleanup ()
      curr = metastore.read()
      cleanup = curr.subscribe (refresh)
    }
    listeners.forEach ((callback) => {
      callback()
    })
  }

  metastore.subscribe (refresh)
  let curr: Store <T> = metastore.read()
  let cleanup = curr.subscribe (refresh)

  const res: Store <T> = {
    read: () => curr.read (),
    dispatch: (payload: T) => curr.dispatch (payload),
    subscribe: (callback) => {
      if (!callback) return () => {}
      listeners.add (callback)
      return () => {
        listeners.delete (callback)
      }
    },
    refresh,
  }

  return res
}

/**
 * A store which serves as a single entry point for multiple other stores
 * 
 * @param metastore 
 * @returns 
 */
export function createLooseStore <T> (factory: () => Store <T>) {
  const listeners = new Set <VoidFunction> ()

  function refresh () {
    listeners.forEach ((callback) => {
      callback()
    })
  }

  function getStore () {
    const substore = factory ()
    substore.subscribe (refresh)
    return substore
  }

  const res: Store <T> = {
    read: () => getStore().read (),
    dispatch: (payload: T) => getStore().dispatch (payload),
    subscribe: (callback) => {
      if (!callback) return () => {}
      listeners.add (callback)
      return () => {
        listeners.delete (callback)
      }
    },
    refresh,
  }

  return res
}

const NEVER: any = {}

export function createDeferred <T> (): Stare <T> {
  const event = createEvent ()
  const promise = new Promise <void> ((resolve) => {
    event.subscribe (() => {
      resolve ()
      return () => {}
    })
  })

  let value: T = NEVER

  return {
    read: async () => {
      await promise
      return value
    },
    dispatch: async (nextValue: T) => {
      if (value === NEVER) {
        value = nextValue
        event.push ()
      }
    }
  }
}

export function createLazyStare <T> (init: () => Promise <T>): Stare <T> {
  let promise: Loadable <T>|null = null

  return {
    read: async () => {
      promise ||= init()
      return await promise
    },
    dispatch: async (nextValue: T) => {
      throw new Error ("[createLazyStare] dispatch not implemented")
    }
  }
}

/**
 * Stare = Async Store
 */
export type Stare <T = any> = Stream <T, T>

type Streamed = Record <string, ServerContextJSONValue>
export const streamer = createDeferred <Store <Streamed>> ()
