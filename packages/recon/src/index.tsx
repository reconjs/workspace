import { Fanc, Func, Subscribe, createEvent, guidBy, memoize } from "@reconjs/utils"
import { PropsWithChildren, createContext, use, useEffect, useId, useReducer } from "react"
import { Prac, PracReturns, Proc, ProcReturns, Recon } from "./types"
import { Dispatcher } from "./react"

class ReconCtx {}

abstract class ReconHook {
  resolver!: ReconResolver
  index!: number
}

// resolve the hooks
class ReconResolver {
  hooks: ReconHook[] = []
}

// something I can always create synchronously
class ReconConsumer {
  ctx!: ReconCtx
  proc!: Proc
  params!: any[]

  event = createEvent()
  private _unsub?: VoidFunction

  private _pointer?: ReconPointer

  get pointer(): ReconPointer|undefined {
    return this._pointer
  }

  set pointer (ptr: ReconPointer) {
    this._unsub?.()
    this._unsub = ptr.event.subscribe (() => {
      this.event.push()
    })
    this._pointer = ptr
  }
}

// something I can turn in to a value
class ReconPointer {
  ctx!: ReconCtx
  proc!: Proc
  params!: any[]
  event = createEvent()
}

const MAX = 100

function doo <T> (func: () => T) {
  return func()
}

const storage = memoize ((...args: any[]): any => ({}))
const symbolOf = memoize ((...args: any[]) => Symbol())

const rerenderOf = memoize ((...args: any[]) => {
  return createEvent()
})

// bysymbol = proc + params + called ctx
// resymbol = proc + hydrated params + hoisted ctx

const ReconContext = createContext (symbolOf())

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
    const hookRefs = storage ("use_state", ++index, ctx, proc, ...params)

    hookRefs.state ||= typeof init === "function"
      ? init()
      : init

    hookRefs.setState ||= function setState (nextState: any) {
      console.log ("setState", nextState)
      const { state, setStateAux } = hookRefs
      // if (setStateAux) return setStateAux (nextState)

      if (typeof nextState === "function") {
        nextState = nextState (state)
      }
      hookRefs.state = nextState
      rerender.push()
    }

    const { state, setState } = hookRefs
    return [ state, setState ]
  }

  return dispatcher (() => {
    const generator = proc (...params)

    for (let i = 0; i < MAX; i++) {
      const { done, value } = generator.next()
      if (done) return value
      if (value) {
        // early exiting?
        console.log ("early return", value)
        return value
      }
    }

    throw new Error ("Too much yielding")
  })
}

export function ReconProvider (props: PropsWithChildren <{}>) {
  const id = useId()
  const ctx = symbolOf (id)
  useAutoRerender (ctx)

  return (
    <ReconContext value={ctx}>
      {props.children}
    </ReconContext>
  )
}

const NO_USE: typeof use = () => {
  throw new Error ("use does not exist")
}

function resolve (ctx: symbol, proc: Func <Recon>, ...params: any[]) {
  const rerender = rerenderOf (ctx, proc, ...params)

  const dispatcher = Dispatcher.create()
  const use = Dispatcher.current?.use ?? NO_USE

  dispatcher.use = (arg) => {
    if (arg instanceof Promise) return use (arg)
    throw new Error ("Can't use Context in generator")
  }

  const refs = storage (ctx, proc, ...params)
  refs.provides ??= []

  let forwardCtx = ctx
  let i = -1

  dispatcher.provide$ = function provide$ (resource, handler) {
    forwardCtx = refs.provides [++i]

    forwardCtx ??= doo (() => {
      console.log ("Creating forward CTX")
      const sym = Symbol()
      storage (forwardCtx, resource).symbol = sym
      const refs = storage (sym)
      refs.parent = forwardCtx
      refs.resource = resource
      refs.handler = handler
      return sym
    })

    if (forwardCtx === ctx) {
      throw new Error ("Forward CTX matches CTX")
    }

    refs.provides [i] = forwardCtx
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
    return generatorOf (forwardCtx, proc, ...params)
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

const generatorOf = memoize ((ctx: symbol, resource: Func <Recon>, ...params: any[]) => {
  console.log ("generatorOf", guidBy (ctx))

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
    const resolve$ = Dispatcher.current?.resolve$
    if (!resolve$) throw new Error ("resolve$ does not exist")
    const result = yield* resolve$ (ctx, resource, ...params)
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
  const handler = Dispatcher.current?.use$
  // @ts-ignore
  if (handler) return handler (resource, ...params)
  
  const parent = use (ReconContext)
  const ctx = symbolOf (useId(), parent)
  storage (ctx).parent ??= parent
  // @ts-ignore
  return generatorOf (ctx, resource, ...params)
}

export function provide$ (resource: any, override: Func) {
  const handler = Dispatcher.current?.provide$
  if (!handler) throw new Error ("provide$ does not exist")
  handler (resource, override)
}

export function context$ (...params: any[]) {
  console.log ("context$")

  const handler = Dispatcher.current?.context$
  if (!handler) throw new Error ("context$ does not exist")
  return handler (...params)
}
