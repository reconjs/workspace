import { Fanc0, Func, Func0, Subscribe, Vunc, createEvent, guidBy, loadPromise, memoize } from "@reconjs/utils"
import { useInitial } from "@reconjs/utils-react"
import {
  Fragment,
  PropsWithChildren,
  createContext,
  use,
  useEffect,
  useReducer,
} from "react"

import { Dispatcher } from "./react"

// TYPES

type AnyGenerator = Generator <any, any, any>

type Proc0 <T = any> = () => Generator <any, T>
export type Proc <T = any, A extends any[] = any[]> = (...args: A) => Generator <any, T>
type Prac <T = any, A extends any[] = any[]> = (...args: A) => AsyncGenerator <any, T>

type Returns <F extends Func> = F extends Proc <infer T> ? T : Awaited <ReturnType <F>>



// MISC

const NEVER = {} as any
const MAX = 200

function doo <T> (func: () => T) {
  return func()
}

function* NON_ITERATOR () {}

const GeneratorFunction = NON_ITERATOR.constructor



// RERENDER

function RERENDER () {
  return Symbol()
}

function useRerender () {
  const [ , rerender ] = useReducer (RERENDER, null)
  return rerender as VoidFunction
}



// RECON TYPES

class ReconEffect {}

class Subscription extends ReconEffect {
  subscribe: Subscribe
  
  constructor (subscribe: Subscribe) {
    super()
    this.subscribe = subscribe
  }
}

class PromiseEffect extends ReconEffect {
  promise: Promise <any>
  
  constructor (promise: Promise <any>) {
    super()
    this.promise = promise
  }
}

class ProvideEffect extends ReconEffect {
  constructor (
    public context: ReconContext <any>, 
    public handle: Func
  ) {
    super()
  }
}

class ConsumeEffect extends ReconEffect {
  params: any[]
  handler?: Func
  
  constructor (
    public context: ReconContext <any>,
    ...params: any[]
  ) {
    super()
    this.params = params
  }
}

class HoistEffect extends ReconEffect {
  constructor (public scope: ReconScope) {
    super()
  }
}

class ErrorEffect extends ReconEffect {
  constructor (public error: any) {
    super()
  }
}



// CONTEXT

type ReconContext <F extends Func> = {
  displayName: string,
  (handle: F): ProvideEffect
  (...args: Parameters <F>): (ReturnType <F> extends AnyGenerator
    ? ReturnType <F>
    : Reconic <ReturnType <F>>
  )
}

export function context <F extends Func> (factory: F) {
  const subcontexts = new Set <ReconContext <any>>()
  const dependencies = new Set <ReconContext <any>>()
  
  function* consume (...params: any[]): Reconic {
    const effect = new ConsumeEffect ($Context, ...params)
    yield effect
    const handler = effect.handler ?? factory
    
    const dispatcher = Dispatcher.create()
    return dispatcher (() => handler (...params))
  }
  
  function context$ (...args: any[]) {
    if (typeof args[0] === "function") {
      return new ProvideEffect ($Context, args[0])
    }
    return consume (...args)
  }
  
  const $Context: ReconContext <F> = context$ as any
  
  // @ts-ignore
  $Context.displayName = `Context#${guidBy ($Context)}`
  return $Context
}


// RECON

export type Reconic <T = any> = T extends Func ? T : Generator <ReconEffect, T>

const NON_RECON = doo (() => {
  function ReconNever () {
    throw new Error ("Recon not found!")
  }
  
  const res: any = ReconNever
  res[Symbol.iterator] = () => {
    throw new Error ("Recon not found!")
  }
  
  return res
})



// REVALIDATOR

function createRevalidator () {
  const { push, subscribe } = createEvent()

  let unsubs = new Set <VoidFunction>()
  const extended = new WeakSet <Subscription>()

  function extend (effect: Subscription) {
    if (extended.has(effect)) return
    extended.add (effect)

    const unsub = effect.subscribe (push)
    unsubs.add (unsub)
  }

  function cleanup() {
    for (const unsub of unsubs) {
      unsub()
    }
    unsubs = new Set()
  }

  const effect = new Subscription (subscribe)

  return { cleanup, extend, effect, push, subscribe }
}



// PERSISTENCE HELPER

function buildHooks () {
  console.log ("Creating refs")
  const refs = [] as HookRef[]
  
  return function initHook () {
    let index = -1
    
    return function hook <T> (initial: () => T): HookRef <T> {
      index += 1
      const found = refs [index]
      if (found) {
        console.log ("ref found")
        return found
      }
      
      const current = initial()
      const ref = { current }
      refs [index] = ref
      return ref
    }
  }
}



// REACT DISPATCHER

function buildReactDipatchers (update: VoidFunction) {
  const initHook = buildHooks()
  
  return function getDispatcher () {
    const hook = initHook()
    
    const dispatcher = Dispatcher.create ()
    
    dispatcher.useRef = (init: any) => hook (() => init)
    
    dispatcher.useState = (init: any) => {
      const state = hook (() => {
        if (typeof init === "function") return init()
        return init
      })
      
      const setState = hook (() => (next: any) => {
        if (typeof next === "function") {
          next = next (state.current)
        }
        state.current = next
        console.log ("new state", state.current)
        // TODO: rerender
        update ()
      })
      
      console.log ("useState", { state, setState })
      
      return [ state.current, setState.current ]
    }
    
    return dispatcher
  }
}



// RECON DISPATCHER

type DispatcherVars = {
  scope: ReconScope,
  resolver?: Func,
}

function buildReconDispatchers () {
  const initHook = buildHooks()
  
  const getChildScope = memoize ((parent: ReconScope, ...args: any[]) => {
    return new ReconScope (parent)
  })
  
  return function getDispatcher (vars: DispatcherVars) {
    // const hook = initHook()
    
    const initialScope = vars.scope
    console.log ("getDispatcher scope =", guidBy (vars.scope))
    
    const dispatcher = Dispatcher.create()
    
    dispatcher.use$ = (proc: Func, ...params: any[]) => {
      if (proc instanceof GeneratorFunction) {
        if (initialScope !== vars.scope) {
          console.log ("scope changed!", { initialScope, ...vars })
        }
        const scope = getChildScope (vars.scope, proc, ...params)
        return scope.use (proc, ...params)
      }
      if (typeof proc === "function") {
        vars.resolver = proc
        return NON_RECON
      }
      throw new Error ("use$ must be called with a generator or function!")
    }
    
    return dispatcher
  }
}



// MAKE

const ensureRunIsntLooping = doo (() => {
  let runCount = 0
  
  setInterval(() => {
    runCount -= 10
  }, 100)
  
  return () => {
    if (runCount++ > MAX) throw new Error ("Too much running")
  }
})

type HookRef <T = any> = { current: T }

function nameOf (proc: Proc): string {
  return (proc as any).displayName ?? proc.name
}

function make (scope: ReconScope, proc: Proc, ...params: any[]) {  
  const displayName = nameOf (proc)

  console.log ("[make]", displayName, scope)

  const revalidator = createRevalidator()
  
  const createReconDispatcher = buildReconDispatchers()
  
  const initProviderHook = buildHooks()

  // RUNNER = dispatcher + generator
  function* run (vars: DispatcherVars, hoist?: Vunc<[ ReconScope ]>) {
    ensureRunIsntLooping()

    const dispatcher = createReconDispatcher (vars)
    
    const hook = initProviderHook()
    
    const iter = dispatcher (() => proc (...params))
    // console.log ({ iter })

    for (let i = 0; i < MAX; i++) {
      const { done, value } = dispatcher (() => iter.next())
      if (done) return value
      console.log ("yielded", value)
      
      if (value instanceof Subscription) {
        revalidator.extend (value)
      }
      else if (value instanceof PromiseEffect) {
        let fulfilled = false
        value.promise.finally (() => {
          fulfilled = true
        })
        
        let i = 0
        while (!fulfilled) {
          if (i++ > 10) throw new Error ("Too much waiting")
          yield value
        }
      }
      else if (value instanceof ConsumeEffect) {
        console.log ("CONSUMING", guidBy (value.context))
        if (scope === scope.root) {
          console.warn ("Consuming from root scope!")
        }
        const found = scope.find (value.context)
        if (found) {
          value.handler = found.handler
          // yield new HoistEffect (found)
          if (hoist) console.log ("HOISTING!", found, scope)
          else console.warn ("NOT HOISTING!")
          hoist?.(found)
          yield new HoistEffect (found)
        }
      }
      else if (value instanceof HoistEffect) {
        // yield value
        hoist?.(value.scope)
        yield value
      }
      else if (value instanceof ProvideEffect) {
        const { current } = hook (() => {
          return new ReconScope (vars.scope, value.context, value.handle)
        })
        
        console.log ("PROVIDED!", current.displayName)
        vars.scope = current
      }
      else if (value instanceof ErrorEffect) {
        throw value.error
      }
      else {
        console.warn ("Unexpected yield!")
      }
    }

    throw new Error("Too much yielding")
  }
  
  const createReactDispatcher = buildReactDipatchers (revalidator.push)

  const execute = doo (() => {
    let ancestor = scope.root
    let handler: Proc0
    
    let resolved = NEVER
    revalidator.subscribe (() => {
      resolved = NEVER
    })
    
    const buildHoist = doo (() => {
      return () => {
        // TODO: We shouldn't need to re-evaluate so often...
        const inited = doo (() => {
          if (resolved instanceof Promise) return false
          return resolved !== NEVER
        })
        
        if (inited) return
        return function hoist (consumed: ReconScope) {
          console.log ("Hoisting...", displayName, guidBy (consumed))
          
          if (ancestor.depth >= consumed.depth) return
          if (consumed.depth > scope.depth) {
            console.warn ("Unclear what behavior is expected!")
            return
          }
          if (inited) console.warn ("Why are we changing this now?")
          ancestor = consumed
        }
      }
    })
    
    return function* exec (force?: boolean) {
      if (handler) return yield* handler()
      
      const hoist = buildHoist()
      if (!hoist) yield new HoistEffect (scope)
      if (resolved !== NEVER) return resolved
      
      try {
        const vars: DispatcherVars = { scope }
        const value = yield* run (vars, hoist)
        
        function resolve () {
          if (value !== NON_RECON) return value
          const { resolver } = vars
          if (!resolver) throw new Error ("No resolver!")
          const dispatcher = createReactDispatcher()
          return dispatcher (() => resolver())
        }
        
        if (!force && hoist && ancestor !== scope) {
          console.log ("Ancestor is the one to use!", ancestor)
          handler = () => ancestor.use (proc, ...params)
          // add to the correct place...
          return yield* handler()
        }
        
        resolved = resolve()
      }
      catch (thrown) {
        resolved = thrown
      }
      
      if (resolved instanceof Promise) resolved.then (
        (res) => { resolved = res },
        (err) => { resolved = err },
      )
      
      return resolved
    }
  })
  
  function* resolve() {
    const resolved = yield* execute()
    
    if (resolved instanceof Error) {
      yield new ErrorEffect (resolved)
      throw new Error ("ErrorEffect didn't work!!!")
    }
    
    if (resolved instanceof Promise) {
      yield new PromiseEffect (resolved)
      if (resolved instanceof Promise) {
        throw new Error ("Promise was not resolved!")
      }
    }
    
    yield revalidator.effect
    return resolved
  }
  
  // RUNNER = dispatcher + generator
  
  function Recon (...args: any[]) {
    console.log ("Rendering Recon Component")

    args = args.filter (x => typeof x !== "undefined")
    if (args.length > 1) {
      console.log (args)
      console.error ("Why are args getting passed to render?")
    }
    
    const rerender = useRerender()
    useEffect (() => {
      return revalidator.subscribe (rerender)
    }, [ rerender ])
    
    const vars: DispatcherVars = { scope }
    const dispatcher = createReconDispatcher (vars)
    
    const iter = execute (true)

    const render = dispatcher (() => {
      for (let i = 0; i < MAX; i++) {
        const { done, value } = iter.next()
        if (done) return value
        if (value instanceof Error) {
          console.log ("returned error")
          throw value
        }
        if (value instanceof Promise) {
          loadPromise (value)
        }

        console.log("yielded on", value)
        if (value instanceof Subscription) {
          
        }
        else if (value instanceof PromiseEffect) {
          loadPromise (value.promise)
        }
        else if (value instanceof ErrorEffect) {
          console.error ("Error Effect")
          throw value.error
        }
      }

      throw new Error ("Too much yielding")
    })
    
    if (render instanceof Promise) {
      loadPromise (render)
    }
    if (render instanceof Error) {
      throw render
    }
    if (typeof render !== "function") {
      console.log (render)
      throw new Error (`WTF this is supposed to be a function (in ${displayName})`)
    }
    return (
      <Recontext value={scope}>
        {render(...args)}
      </Recontext>
    )
  }
  
  
  const res = Recon as any
  
  res[Symbol.iterator] = resolve
  // @ts-ignore
  res.displayName = displayName
  
  return res as Reconic
}



// SCOPE

export class ReconScope {
  get root (): ReconScope {
    return this.parent?.root ?? this
  }
  
  get depth (): number {
    return this.parent ? this.parent.depth + 1 : 0
  }
  
  readonly displayName: string

  constructor (
    private readonly parent?: ReconScope, 
    public readonly context?: Proc,
    public readonly handler?: Proc0
  ) {
    this.displayName = `Scope#${guidBy (this)}`
  }
  
  private cache = memoize ((proc: Proc, ...params: any[]) => ({}) as {
    current: Reconic
  })
  
  private get = (proc: Proc, ...params: any[]): Proc0|undefined => {
    const self = this.cache (proc, ...params)
    
    if (self.current) return self.current
    return this.parent?.get?.(proc, ...params)
  }
  
  use = (proc: Proc, ...params: any[]) => {
    console.log ("[Scope::use]", nameOf (proc), this)
    
    const self = this.cache (proc, ...params)
    
    const found = this.get (proc, ...params)
    if (found) return found
    
    const made = make (this, proc, ...params)
    
    // const found2 = this.get (proc, ...params)
    // if (found2) return found
    
    self.current = made
    return self.current
  }
  
  find = (context: ReconContext <any>): ReconScope|undefined => {
    console.log ("Finding...", this, context)
    if (this.context === context) {
      return this
    }
    return this.parent?.find (context)
  }
}


// PROVIDER

const NON_SCOPE = doo (() => {
  const res = new ReconScope()
  res.use = () => {
    throw new Error ("ReconProvider not found!")
  }
  return res
})

const Recontext = createContext (NON_SCOPE)

export function ReconProvider (props: PropsWithChildren <{}>) {
  // TODO: ID for when suspended
  const scope = useInitial (() => new ReconScope())

  return (
    <Recontext value={scope}>
      {props.children}
    </Recontext>
  )
}



// EXECUTION

const NO_USE: typeof use = () => {
  throw new Error ("use does not exist")
}

const ssrPromise = new Promise (resolve => resolve (Fragment))

const WINDOW = typeof window !== "undefined" ? window as any : null

// Async Generators for lists?
export function use$ <P extends Prac> (
  resource: P,
  ...params: Parameters <P>
): never

export function use$ <P extends Proc> (
  resource: P, 
  ...params: Parameters <P>
): Returns <P> extends AnyGenerator ? Returns <P> : Reconic <Returns <P>>

export function use$ <T extends Fanc0 <Func>> (arg: T): never
export function use$ <T extends Fanc0> (loader: T): Reconic <Returns <T>>
export function use$ <T extends Func0> (hook: T): Reconic <ReturnType <T>>

export function use$ (resource: any, ...params: any[]): never {
  const use$ = Dispatcher.current?.use$
  // @ts-ignore
  if (use$) return use$ (resource, ...params)
  
  // @ts-ignore
  if (!WINDOW) return use (ssrPromise)
  
  const parent = use (Recontext)
  
  // makes sure resource doesn't change
  resource = useInitial (() => resource) // eslint-disable-line
  const scope = useInitial (() => new ReconScope (parent)) // eslint-disable-line
  
  if (resource instanceof GeneratorFunction) {
    // @ts-ignore
    return scope.use (resource, ...params)
  }
  // TODO: What if it's a function?
  throw new Error ("use$ does not support [whatever resource is]")
}

export function useDispatcherId$ () {
  return Dispatcher.current && guidBy (Dispatcher.current)
}
