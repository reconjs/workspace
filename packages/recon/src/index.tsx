import { Fanc, Func, createEvent, memoize } from "@reconjs/utils"
import { useInitial } from "@reconjs/utils-react"
import { PropsWithChildren, createContext, use, useEffect, useId, useReducer, useState } from "react"
import { Prac, PracReturns, Proc, ProcReturns, Recon } from "./types"
import { Dispatcher } from "./react"

const MAX = 100

function doo <T> (func: () => T) {
  return func()
}

const storage = memoize ((...args: any[]): any => ({}))

const ReconContext = createContext <string> (null as any)

function RERENDER () {
  return Symbol()
}

function useRerender () {
  const [ , rerender ] = useReducer (RERENDER, null)
  return rerender as VoidFunction
}

function useAutoRerender (...deps: any[]) {
  const rerender = useRerender()

  useEffect (() => {
    const event = createEvent()
    storage ("rerender", ...deps).push = event.push

    const unsub = event.subscribe (rerender)
    return () => unsub()
  }, deps)
}

function dispatcherOf (ctx: string, proc: Func, ...params: any[]) {
  let index = 0
  const dispatcher = Dispatcher.create()

  dispatcher.useState = (init: any): any => {
    index += 1

    const rerender = storage ("rerender", ctx, proc, ...params)
    const refs = storage ("use_state", index++, ctx, proc, ...params)

    refs.state ||= typeof init === "function"
      ? init()
      : init

    refs.setState ||= function setState (nextState: any) {
      const { state, setStateAux } = refs
      // if (setStateAux) return setStateAux (nextState)

      if (typeof nextState === "function") {
        nextState = nextState (state)
      }
      refs.state = nextState
      rerender.push?.()
      return rerender()
    }

    const { state, setState } = refs
    return [ state, setState ]
  }

  return dispatcher
}

export function ReconProvider (props: PropsWithChildren <{}>) {
  const ctx = useId()
  const rerender = useRerender()

  useEffect (() => {
    const event = createEvent()
    storage ("rerender", ctx).push = event.push
    const unsub = event.subscribe (rerender)
    return () => unsub()
  }, [])

  return (
    <ReconContext value={ctx}>
      {props.children}
    </ReconContext>
  )
}

// procsym = proc + params
// callsym = procsym + called ctx
// datasym = procsym + 

function resolve (ctx: string, proc: Func <Recon>, ...params: any[]) {
  const refs = storage (ctx, proc, params)

  const dispatcher = Dispatcher.create()
  const { use } = Dispatcher.current
  dispatcher.use = use
  dispatcher.resolve$ = function* resolve$ (ctx, proc, ...params) {
    // TODO: 
  }



  dispatcher.use$ = (proc, ...params) => {
    // TODO:
    refs.uses 
    return generatorOf (ctx, proc, ...params)
  }

  return dispatcher (() => {
    const generator = proc (...params)

    // @ts-ignore
    if (generator[Symbol.asyncIterator]) throw new Error ("Async Generator")
    if (!generator[Symbol.iterator]) throw new Error ("Expected a Generator")

    for (let i = 0; i < MAX; i++) {
      const curr = generator.next()
      if (curr.done) return curr.value
      console.log (curr)
    }
    throw new Error ("Too much yielding")
  })
}

const generatorOf = memoize ((ctx: string, resource: Func <Recon>, ...params: any[]) => {
  const res: any = function Recon (props: any, ...args: any[]) {
    if (args.length > 0) console.error ("Why are args getting passed to render?")
    const useRender = resolve (ctx, resource, params)
    return useRender (props)
  }

  // @ts-ignore
  if (resource.displayName) res.displayName = resource.displayName
  else if (resource.name) res.displayName = resource.name

  res[Symbol.iterator] = function* resolve () {
    const result = yield* Dispatcher.current.resolve$ (ctx, resource, ...params)
    return result
  }

  return res
})

export function use$ <P extends Prac <Func>> (
  resource: P, 
  ...params: Parameters <P>
): never

export function use$ <T extends Fanc <Func>> (
  resource: T, 
  ...params: Parameters <T>
): never

export function use$ <P extends Proc> (
  resource: P, 
  ...params: Parameters <P>
): Recon <ProcReturns <P>>

export function use$ <P extends Prac> (
  resource: P, 
  ...params: Parameters <P>
): Recon <PracReturns <P>>

export function use$ <T extends Fanc <Func>> (
  resource: T, 
  ...params: Parameters <T>
): never

export function use$ <T extends Fanc> (
  resource: T, 
  ...params: Parameters <T>
): Recon <Awaited <ReturnType <T>>>

export function use$ <T extends Func <Func>> (
  resource: T, 
  ...params: Parameters <T>
): never

export function use$ <T extends Func> (
  resource: T, 
  ...params: Parameters <T>
): Recon <ReturnType <T>>

export function use$ (resource: any, ...params: any[]): never {
  const ctx = use (ReconContext)
  // @ts-ignore
  return generatorOf (ctx, resource, ...params)
}
