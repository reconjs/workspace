import { Func } from "@reconjs/utils"
import React, { FunctionComponent, memo, Usable } from "react"
import { CallEffect, Effect } from "../effect"
import { ReactDispatcher, REDISPATCHER } from "../hooks"
import { defineStore } from "./store"
import { AsyncGeneratorFunction, GeneratorFunction, Prac, Proc, Returns } from "../types"
import { AnyView, View } from "../use-view"

const WINDOW = typeof window !== "undefined" 
  ? window as any 
  : null

function doo <T> (func: () => T) {
  return func()
}

function* loop (debug: string) {
  for (let i = 0; i < 10; i++) {
    yield null
  }
  
  throw new Error (`[loop] too much (${debug})`)
}


// REACT INTERNALS

// @ts-ignore
const internals = React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE
if (!internals) {
  // console.log (Object.keys (React))
  throw new Error ("INTERNALS NOT FOUND")
}

const Dispatcher = {
  get current (): ReactDispatcher|null {
    return internals.H
  },
  set current (dispatcher: ReactDispatcher|null) {
    internals.H = dispatcher
  }
}



// STORE STATE/TYPES

type ReconEntrypoint = {
  context: symbol,
  proc: Proc,
  args: any[],
}

type ReconRendered = {
  scope: symbol,
  viewId: string,
  parent: symbol,
}

type ReconStackState = {
  func: Func,
  args: any[],
  scope: symbol,
  iter: Generator <Effect, any>,
  hooks: [],
}

type ReconPrerenderingState = {
  proc: Proc,
  args: any[],
  // iter: Generator <Regenerator, any>,
  scope: symbol,
  viewId: string,
  dispatcher: ReactDispatcher,
  stack: ReconStackState[],
}

type ReconDataState = {
  func: Func,
  args: any[],
  value?: any,
  error?: any,
  promise?: Promise <any>,
}

type ReconInviewState = {
  dispatcher: ReactDispatcher,
}

export type ReconState = {
  entrypoints: ReconEntrypoint[],
  errors: any[],
  renders: ReconRendered[],
  data: ReconDataState[],
  prerendering?: ReconPrerenderingState,
  inview?: ReconInviewState,
}

const INIT: ReconState = {
  entrypoints: [],
  errors: [],
  renders: [],
  data: [],
}



// STORE DEFINITION

export class InviewStartTask extends Effect <void> {}
export class InviewEndTask extends Effect <void> {}

export class PrerenderTask extends Effect <void> {
  constructor (public props: {
    proc: Proc,
    args: any[],
    scope: symbol,
    viewId: string,
    dispatcher: ReactDispatcher,
  }) {
    super ()
  }
}

export class PrerenderedTask extends Effect <void> {
  constructor (public viewId: string) {
    super ()
  }
}

export class GetDataTask extends Effect <ReconDataState|undefined> {
  constructor (public props: {
    func: Func,
    args: any[],
  }) {
    super ()
  }
}

export class SetDataTask extends Effect <void> {
  constructor (public props: {
    func: Func,
    args: any[],
    value?: any,
    error?: any,
    promise?: Promise<any>,
  }) {
    super ()
  }
}



export const extendStore = defineStore (INIT, (state, effect): ReconState => {
  if (effect instanceof InviewEndTask) {
    const { inview, ..._state } = state
    if (!inview) throw new Error ("[InviewEndTask] No inview")
    Dispatcher.current = inview.dispatcher
    return _state
  }
  else if (state.inview) {
    throw new Error ("[extendStore] inview and effect")
  }
  
  if (effect instanceof InviewStartTask) {
    if (state.inview) throw new Error ("[InviewStartTask] inview")
    if (state.prerendering) throw new Error ("[InviewStartTask] prerendering")

    const dispatcher = Dispatcher.current
    if (!dispatcher) {
      throw new Error ("[InviewStartTask] No dispatcher")
    }

    return {
      ...state,
      inview: {
        dispatcher
      },
    }
  }

  
  
  if (effect instanceof DispatcherTask) {
    const { prerendering } = state
    if (!prerendering) {
      effect.throw (new Error ("No dispatcher"))
    }
    else {
      effect.return (prerendering.dispatcher)
    }
    return state
  }
  
  if (effect instanceof PrerenderTask) {
    state = {
      ...state,
      prerendering: {
        ...effect.props,
        stack: [],
      }
    }
    
    effect.return()
    return state
  }
  
  if (effect instanceof PrerenderedTask) {
    const { prerendering, ...nextState } = state
    
    if (!prerendering) {
      throw new Error ("[prerendered] No prerendering state")
    }
    
    effect.return()
    return nextState
  }
  
  if (effect instanceof GetDataTask) {
    const { func, args } = effect.props
    
    function isDataEqual (alpha: any) {
      if (alpha.func !== func) return false
      if (alpha.args.length !== args.length) return false
      for (let i = 0; i < alpha.args.length; i++) {
        if (alpha.args[i] !== args[i]) return false
      }
      return true
    }
    
    const found = state.data.find (isDataEqual)
    effect.return (found)
    if (found) return state
    return {
      ...state,
      data: [
        ...state.data,
        {
          func,
          args,
        }
      ]
    }
  }
  
  if (effect instanceof SetDataTask) {
    const { func, args, value, error, promise } = effect.props
    
    function isDataEqual (alpha: any) {
      if (alpha.func !== func) return false
      if (alpha.args.length !== args.length) return false
      for (let i = 0; i < alpha.args.length; i++) {
        if (alpha.args[i] !== args[i]) return false
      }
      return true
    }
    
    const nextData = state.data.map ((curr) => {
      if (isDataEqual (curr)) {
        return {
          ...curr,
          value,
          error,
          promise,
        }
      }
      return curr
    })
    
    effect.return()
    return {
      ...state,
      data: nextData,
    }
  }
  
  console.error ("Unknown task:", effect)
  throw new Error ("[defineStore] Unknown task")
})

class DispatcherTask extends Effect <ReactDispatcher> {}

export const handleDispatcher = extendStore (function* () {
  return yield* new DispatcherTask()
})



// #region handleCall & handleAsync

/**
* Helper for initializing atoms in the store... 
*
* @param func 
* @param args 
* @returns 
*/
function* invokeAtomic (func: Func, ...args: any[]) {
  const proc = func as Proc
  
  const isAsyncGenerator = func instanceof AsyncGeneratorFunction
  const isGenerator = func instanceof GeneratorFunction
  
  if (isAsyncGenerator) {
    const promise = handleAsync (func, ...args)
    yield* new SetDataTask ({ func, args, promise })
  }
  
  try {
    const value = isGenerator 
      ? yield* proc (...args)
      : proc (...args)
    
    yield* new SetDataTask ({ func, args, value })
  }
  catch (thrown) {
    if (thrown instanceof Promise) {
      const promise = handleAsync (func, ...args)
      yield* new SetDataTask ({ func, args, promise })
    }
    else {
      yield* new SetDataTask ({ func, args, error: thrown })
    }
  }
}


/**
 * Catch all for loading data asynchronously
 */
const handleAsync = extendStore (async function* (func: Prac, ...args: any[]) {
  try {
    // TODO: Figure out what to do with 'this'
    const iter = (func as Prac).call (null, ...args)

    for (const _ of loop ("handleAwait")) {
      const { done, value } = await iter.next()
      if (done) {
        yield new SetDataTask ({ func, args, value })
        return
      }
      if (value instanceof Effect) {
        yield* value
      }
      throw new Error ("[handleAwait] yielded non-effect")
    }
  }
  catch (error) {
    console.error ("[handleAwait] caught something")
    if (error instanceof Promise) {
      error = new Error ("[handleAwait] caught promise")
    }
    yield* new SetDataTask ({ func, args, error })
  }
})

/**
 * Catch all for loading data synchronously
 */
export const handleCall = extendStore (function* (effect: CallEffect) {
  if (! (effect instanceof CallEffect)) {
    throw new Error ("[handleAwait] CallEffect expected")
  }
  
  const { func, args } = effect
  const proc = func as Proc
  
  const isAsyncGenerator = func instanceof AsyncGeneratorFunction
  const isGenerator = func instanceof GeneratorFunction
  
  const data = yield* new GetDataTask ({ func, args })
  
  if (!data) {
    // @ts-ignore
    effect.yield (function* () {
      yield* invokeAtomic (func, ...args)
    })
  }
  else if (data.error) {
    if (data.error instanceof Promise) {
      console.error ("[data.error] promise")
    }
    effect.throw (data.error)
  }
  else if (data.promise) {
    effect.throw (data.promise)
  }
  else if (data.value) {
    effect.return (data.value)
  }
  else {
    for (const _ of loop("handleCall")) {
      const { done, value } = effect.next()
      if (done) return
      if (value === effect) return
      handleEffect (value)
    }
  }
})

// #endregion

/**
 * Catch-all for unhandled side effects...
 */
export const handleEffect = extendStore (function* (effect: Effect) {
  if (effect instanceof CallEffect) {
    handleCall (effect)
  }
  else {
    yield* effect
  }
})
