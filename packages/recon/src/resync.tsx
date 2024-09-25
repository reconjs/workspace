import { createEvent, createStore, Store } from "@reconjs/utils"
import { useSyncExternalStore } from "react"

function noop () {}

function doo <T> (func: () => T) {
  return func()
}


const STORES = new Map <string, Store <symbol>> ()

function eventOf (id: string) {
  return STORES.get (id) || doo (() => {
    const store = createStore (() => Symbol())
    STORES.set (id, store)
    return store
  })
}

export function resyncAll () {
  for (const store of STORES.values()) {
    store.dispatch (Symbol())
  }
}

export function resync (id: string) {
  eventOf (id).dispatch (Symbol())
}

export function useResync (id: string) {
  const { subscribe, read } = eventOf (id)
  return useSyncExternalStore (subscribe, read, read)
}
