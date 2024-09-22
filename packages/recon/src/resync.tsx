import { createEvent } from "@reconjs/utils"
import { useSyncExternalStore } from "react"

function noop () {}

function doo <T> (func: () => T) {
  return func()
}



type EventStore = ReturnType <typeof createEvent>

const EVENTS = new Map <string, EventStore> ()

function eventOf (id: string) {
  return EVENTS.get (id) || doo (() => {
    const store = createEvent ()
    EVENTS.set (id, store)
    return store
  })
}

export function resyncAll () {
  for (const store of EVENTS.values()) {
    store.push()
  }
}

export function resync (id: string) {
  eventOf (id).push()
}

export function useResync (id: string) {
  const { subscribe } = eventOf (id)
  return useSyncExternalStore (subscribe, noop, noop)
}
