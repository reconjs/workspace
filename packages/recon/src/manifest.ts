import { defineHook, usingConstant } from "./hooks"
import { Store, createStore, isEqual, memoize } from "@reconjs/utils"



const NOT_WINDOW = {}

const getWindow = (): Window & Record <string, any> => {
  if (typeof window !== "undefined") return window
  return NOT_WINDOW as any
}



export type Manifest = {
  kind: string,
}

function doo <T> (func: () => T) {
  return func ()
}

export const MANIFESTS = doo (() => {
  const store = createStore (() => {
    return {} as Record <string, Manifest>
  })

  const { dispatch } = store

  store.dispatch = (manifest) => {
    const curr = store.read ()
    const next = {
      ...manifest,
      ...curr,
    }

    if (isEqual (curr, next)) return
    dispatch (next)
  }

  return store
})

getWindow ().MANIFESTS = MANIFESTS



const NEVER = {} as any

export const manifestBy = memoize ((key: string) => {
  const store = createStore (() => {
    return NEVER as Manifest
  })

  store.read = () => MANIFESTS.read () [key]

  store.dispatch = (manifest) => {
    MANIFESTS.dispatch ({
      [key]: manifest,
    })
  }

  MANIFESTS.subscribe (() => {
    const curr = store.read ()

    const next = doo (() => {
      const all = MANIFESTS.read ()
      return all [key]
    })
    
    if (! isEqual (curr, next)) {
      store.dispatch (next)
    }
  })

  return store
})
