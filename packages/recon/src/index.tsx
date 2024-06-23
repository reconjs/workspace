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

const rerenderOf = memoize ((...args: any[]) => {
  return createEvent()
})

// bysymbol = proc + params + called ctx
// resymbol = proc + hydrated params + hoisted ctx

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
    const unsub = rerenderOf (...deps).subscribe (() => {
      console.log ("auto rerender!")
      rerender()
    })
    return () => unsub()
  }, deps)
}

function execute (ctx: string, proc: Func, ...params: any[]) {
  let index = 0
  const dispatcher = Dispatcher.create()
  const rerender = rerenderOf (ctx, proc, ...params)

  dispatcher.useState = (init: any): any => {
    const refs = storage ("use_state", ++index, ctx, proc, ...params)

    refs.state ||= typeof init === "function"
      ? init()
      : init

    refs.setState ||= function setState (nextState: any) {
      console.log ("setState", nextState)
      const { state, setStateAux } = refs
      // if (setStateAux) return setStateAux (nextState)

      if (typeof nextState === "function") {
        nextState = nextState (state)
      }
      refs.state = nextState
      rerender.push()
    }

    const { state, setState } = refs
    return [ state, setState ]
  }

  return dispatcher (() => {
    const generator = proc (...params)

    for (let i = 0; i < MAX; i++) {
      const curr = generator.next()
      if (curr.done) return curr.value
      console.log (curr)
    }

    throw new Error ("Too much yielding")
  })
}

export function ReconProvider (props: PropsWithChildren <{}>) {
  const ctx = useId()
  useAutoRerender (ctx)

  return (
    <ReconContext value={ctx}>
      {props.children}
    </ReconContext>
  )
}

function resolve (ctx: string, proc: Func <Recon>, ...params: any[]) {
  const rerender = rerenderOf (ctx, proc, ...params)

  const dispatcher = Dispatcher.create()
  const { use } = Dispatcher.current

  dispatcher.use = (arg) => {
    if (arg instanceof Promise) return use (arg)
    throw new Error ("Can't use Context in generator.")
  }

  dispatcher.resolve$ = function* resolve$ (ctx, proc, ...params) {
    const res = execute (ctx, proc, ...params)

    rerenderOf (ctx, proc, ...params).subscribe(() => {
      console.log ("child re-rendered")
      // TODO: unsub! move to useEffect?
      rerender.push()
    })

    // TODO: Do this properly
    return res
  }

  dispatcher.use$ = (proc, ...params) => {
    // TODO:
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
  /*
  doo (() => async function register () {
    const refs = storage (ctx)
    refs.renders ??= []
    refs.renders.push ({ resource, params })
    rerenderOf (ctx).push ()
  })
  */

  const res: any = function Recon (props: any, ...args: any[]) {
    console.log ("Rendering Recon Component")

    args = args.filter (x => typeof x !== "undefined")
    if (args.length > 0) {
      console.log (args)
      console.error ("Why are args getting passed to render?")
    }
    useAutoRerender (ctx, resource, ...params)
    const useRender = resolve (ctx, resource, ...params)
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
  const self = Dispatcher.current.use$
  // @ts-ignore
  if (self) return self (resource, ...params)
  
  const ctx = use (ReconContext)
  // @ts-ignore
  return generatorOf (ctx, resource, ...params)
}
