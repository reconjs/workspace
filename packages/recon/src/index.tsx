import { Fanc, Func, createEvent, memoize } from "@reconjs/utils"
import { useInitial } from "@reconjs/utils-react"
import {
  PropsWithChildren,
  createContext,
  use,
  useEffect,
  useId,
  useReducer,
} from "react"

import { Dispatcher } from "./react"

const MAX = 100

function doo <T> (func: () => T) {
  return func()
}

const storage = memoize ((...args: any[]): any => ({}))

function RERENDER () {
  return Symbol()
}

function useRerender () {
  const [ , rerender ] = useReducer (RERENDER, null)
  return rerender as VoidFunction
}

type AnyGenerator = Generator <any, any, any>

type Proc <T = any, A extends any[] = any[]> = (...args: A) => Generator <any, T>
type Prac <T = any, A extends any[] = any[]> = (...args: A) => AsyncGenerator <any, T>

type ProcReturns <P extends Proc> = P extends Proc <infer T> ? T : never
type PracReturns <P extends Prac> = P extends Prac <infer T> ? T : never

abstract class ReconEffect {}



// RECON TYPES

export type Recon <T = any> = T extends Func ? T : Generator <ReconEffect, T>

export class ReconConsumer {
  scope: ReconScope
  proc: Proc
  params: any[]

  constructor (scope: ReconScope, proc: Proc, ...params: any[]) {
    this.scope = scope
    this.proc = proc
    this.params = params
  }

  protected _event = createEvent()

  get subscribe () {
    return this._event.subscribe
  }

  private _resolver?: ReconResolver

  get resolver (): ReconResolver {
    // if (!this._resolver) throw new Error ("resolver not initialized")
    return this._resolver as any
  }

  private _unsub?: VoidFunction

  set resolver (resolver: ReconResolver) {
    this._unsub?.()
    this._unsub = resolver.subscribe (() => {
      this._event.push()
    })
    this._resolver = resolver
  }

  [Symbol.iterator] = function* () {}
}

export class ReconResolver extends ReconConsumer {
  constructor (scope: ReconScope, proc: Proc, ...params: any[]) {
    super (scope, proc, ...params)
  }

  private _current: any

  get current (): any {
    return this._current
  }

  set current (next: any) {
    this._current = next
    this._event.push()
  }

  get resolver () {
    return this as ReconResolver
  }

  set resolver (next: ReconResolver) {
    throw new Error ("Cannot override a resolver")
  }

  get push () {
    return this._event.push
  }
}



// CONTEXT

export class ReconScope {
  resolvers: ReconResolver[] = []
  parent?: ReconScope

  constructor (parent?: ReconScope) {
    this.parent = parent
  }

  find = (proc: Proc, ...params: any[]): ReconResolver|undefined => {
    const found = this.resolvers.find ((resolver) => {
      console.log ({ resolver, proc, params })
      if (resolver.proc !== proc) return
      if (resolver.params.length !== params.length) return
      for (let i = 0; i < params.length; i++) {
        if (resolver.params[i] !== params[i]) return
      }
      return true
    })

    console.log (found)
    
    if (found) return found
    if (this.parent) return this.parent.find (proc, ...params)
  }

  hoist = (proc: Proc, ...params: any[]): ReconConsumer => {
    const scope = this
    const found = scope.find (proc, ...params)
    if (found) return found

    const consumer = new ReconConsumer (scope, proc, ...params)

    const initer = doo (function* initialize () {
      const resolver = new ReconResolver (scope, proc, ...params)
      resolver.current = execute (resolver)

      // TODO: Hoist to the correct level
      scope.resolvers.push (resolver)
    })

    // @ts-ignore
    consumer[Symbol.iterator] = function* initialize () {
      if (consumer.resolver) return

      const found1 = scope.find (proc, ...params)
      if (found1) {
        consumer.resolver = found1
        return
      }

      yield* initer

      const found2 = scope.find (proc, ...params)
      if (found2) {
        consumer.resolver = found2
        return
      }

      console.log (self)
      throw new Error ("Unexpected issue with hoisting")
    }

    return consumer
  }
}

const NON_SCOPE = doo (() => {
  const res = new ReconScope()
  res.find = () => {
    throw new Error ("ReconProvider not found!")
  }
  // @ts-ignore
  res.hoist = () => {
    throw new Error ("ReconProvider not found!")
  }
  return res
})

const ReconContext = createContext (NON_SCOPE)

export function ReconProvider (props: PropsWithChildren <{}>) {
  const id = useId() // de-dupe across Suspense
  const scope = useInitial (() => {
    return new ReconScope()
  })

  return (
    <ReconContext value={scope}>
      {props.children}
    </ReconContext>
  )
}



// EXECUTION

function execute (resolver: ReconResolver) {
  let index = -1
  const dispatcher = Dispatcher.create()

  const use = Dispatcher.current?.use ?? NO_USE

  let forwardCtx = resolver.scope

  dispatcher.use = (arg) => {
    if (arg instanceof Promise) return use (arg)
    throw new Error ("Can't use Context in generator")
  }

  dispatcher.use$ = (proc, ...params) => {
    // TODO:
    const gen = generatorOf (forwardCtx, proc, ...params)
    gen.consumer.subscribe (() => {
      resolver.push()
    })
    return gen
  }

  dispatcher.useState = (init: any): any => {
    const hookRefs = storage ("use_state", ++index, resolver)

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
      resolver.push()
    }

    const { state, setState } = hookRefs
    return [ state, setState ]
  }

  return dispatcher (() => {
    const { proc, params } = resolver
    const generator = proc (...params)

    for (let i = 0; i < MAX; i++) {
      const { done, value } = generator.next()
      if (done) return value
      if (value) {
        // early exiting?
        console.log ("early return", value)
        // return value
      }
    }

    throw new Error ("Too much yielding")
  })
}

function consume (consumer: ReconConsumer) {
  const dispatcher = Dispatcher.create()

  const use = Dispatcher.current?.use ?? NO_USE

  let forwardCtx = consumer.scope

  dispatcher.use = (arg) => {
    if (arg instanceof Promise) return use (arg)
    throw new Error ("Can't use Context in generator")
  }

  dispatcher.use$ = (proc, ...params) => {
    // TODO:
    return generatorOf (forwardCtx, proc, ...params)
  }

  return dispatcher (() => {
    for (const effect of consumer) {
      console.log (effect)
    }

    const { resolver } = consumer
    if (!resolver) throw new Error ("Consumer didn't product a resolver")
    return resolver
  })
}

const NO_USE: typeof use = () => {
  throw new Error ("use does not exist")
}

const generatorOf = memoize ((scope: ReconScope, proc: Func <Recon>, ...params: any[]) => {
  console.log (scope)

  const consumer = scope.hoist (proc, ...params)

  const res: any = function Recon (...args: any[]) {
    console.log ("Rendering Recon Component", consumer)

    args = args.filter (x => typeof x !== "undefined")
    if (args.length > 1) {
      console.log (args)
      console.error ("Why are args getting passed to render?")
    }

    const resolver = consume (consumer as any)

    const rerender = useRerender()
    useEffect (() => {
      return resolver.subscribe (rerender)
    }, [ resolver, rerender ])
    
    console.log ("resolver =", resolver)
    // useAutoRerender (consumer)
    const useRender = execute (resolver)
    return useRender (...args)
  }

  // @ts-ignore
  res.consumer = consumer

  // @ts-ignore
  if (proc.displayName) res.displayName = proc.displayName
  else if (proc.name) res.displayName = proc.name

  // res.consumer = consumer

  res[Symbol.iterator] = function* yielding () {
    /*
    const resolver = Dispatcher.current?.resolve$
    if (!resolver) throw new Error ("resolve$ does not exist")
    const result = yield* resolver (ctx, resource, ...params)
    return result
    */
    console.log ("[yielding] start", consumer)
    yield* consumer
    console.log ("[yielding] end", consumer.resolver)
    
    if (!consumer.resolver) {
      throw new Error ("No resolver :(")
    }
    return execute (consumer.resolver)
  }

  return res
})

// Async Generators for lists only?
export function use$ <P extends Prac> (
  resource: P,
  ...params: Parameters <P>
): never

export function use$ <P extends Proc <Recon>> (
  resource: P, 
  ...params: Parameters <P>
): ProcReturns <P>

export function use$ <P extends Proc> (
  resource: P, 
  ...params: Parameters <P>
): Recon <ProcReturns <P>>

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
  // eslint-disable-next-line
  const scope = useInitial (() => new ReconScope (parent))
  // @ts-ignore
  return generatorOf (scope, resource, ...params)
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
