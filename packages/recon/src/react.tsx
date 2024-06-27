import { Func, Vunc } from "@reconjs/utils"
import React from "react"
import { Proc } from "./index"

function doo <T> (func: () => T) {
  return func()
}

type ReactHooks = {
  useState: (init: any) => [ any, Vunc <[ any ]> ],
  use: {
    (ctx: React.Context <any>): any
    (promise: Promise <any>): any
  },
}

type ReconHooks = {
  context$: (...params: any[]) => Generator <any, void, any>,
  provide$: (resource: Proc, handler: Func) => void,
  resolve$: Proc,
  use$: (resource: Func, ...params: any[]) => any,
}

type ReactDispatcher = ReactHooks & Partial <ReconHooks>

export type ReconDispatcher = ReactHooks & ReconHooks & {
  <T>(factory: () => T): T
}

// @ts-ignore
const internals = React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE



// what are all the keys that should be added to a dispatcher?
const keys = doo (() => {
  const set = new Set ([ "resolve$", "use$" ])
  let loaded = false

  return () => {
    loaded ||= doo (() => {
      if (!internals.H) return false
      for (const key of Object.keys (internals.H)) {
        set.add (key)
      }
      return true
    })
    return set
  }
})

function createDispatcher (message: string = "not allowed") {
  function useRecon (factory: () => any) {
    const prev = internals.H
    try {
      internals.H = dispatcher
      console.log ({ dispatcher })
      return factory()
    }
    finally {
      internals.H = prev
    }
  }
  
  const dispatcher = useRecon as ReconDispatcher

  for (const key of keys()) {
    // @ts-ignore
    dispatcher[key] = () => {
      throw new Error (`${key} ${message}`)
    }
  }

  return dispatcher
}

export const Dispatcher = {
  get current () {
    return internals.H as ReactDispatcher|null
  },
  create: createDispatcher,
}
