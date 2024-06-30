import { Fanc, Fanc0, Func, Func0, Subscribe, Vunc, createEvent, memoize, loadPromise } from "@reconjs/utils"
import { useInitial } from "@reconjs/utils-react"
import {
  PropsWithChildren,
  createContext,
  use,
  useEffect,
  useReducer,
} from "react"

import { Dispatcher, ReconDispatcher } from "./react"

const NEVER = {} as any
const MAX = 100

function doo <T> (func: () => T) {
  return func()
}

function* NON_ITERATOR () {}

const GeneratorFunction = NON_ITERATOR.constructor



// TYPES

type AnyGenerator = Generator <any, any, any>

type Proc0 <T = any> = () => Generator <any, T>
export type Proc <T = any, A extends any[] = any[]> = (...args: A) => Generator <any, T>
type Prac <T = any, A extends any[] = any[]> = (...args: A) => AsyncGenerator <any, T>

type Returns <F extends Func> = F extends Proc <infer T> ? T : Awaited <ReturnType <F>>



// RERENDER

function RERENDER () {
  return Symbol()
}

function useRerender () {
  const [ , rerender ] = useReducer (RERENDER, null)
  return rerender as VoidFunction
}



// RECON TYPES

abstract class ReconEffect {}

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


// MAKER
const ensureRunIsntLooping = doo (() => {
  let runCount = 0
  
  setInterval(() => {
    runCount -= 20
  }, 100)
  
  return () => {
    if (runCount++ > MAX) throw new Error ("Too much running")
  }
})

type DispatcherRef = {
  scope: ReconScope,
  resolver?: Func,
}

function assignBasicHooks (
  dispatcher: ReconDispatcher,
  ref: DispatcherRef,
) {  
  dispatcher.use$ = (proc, ...params) => {
    if (proc instanceof GeneratorFunction) {
      return ref.scope.use (proc, ...params)
    }
    if (typeof proc === "function") {
      ref.resolver = proc
      return NON_RECON
    }
    throw new Error ("use$ must be called with a generator or function!")
  }
  
  return dispatcher
}

type HookRef <T = any> = { current: T }

function make(scope: ReconScope, proc: Proc, ...params: any[]) {
  const displayName: string = (proc as any).displayName ?? proc.name

  console.log("Making a Recon instance...", displayName)

  const revalidator = doo(() => {
    const { push, subscribe } = createEvent()

    let unsubs = new Set<VoidFunction>()
    const extended = new WeakSet<Subscription>()

    function extend(effect: Subscription) {
      if (extended.has(effect)) return
      console.log ("extending subscription", displayName)
      extended.add(effect)

      const unsub = effect.subscribe(push)
      unsubs.add(unsub)
    }

    function cleanup() {
      for (const unsub of unsubs) {
        unsub()
      }
      unsubs = new Set()
    }

    const effect = new Subscription(subscribe)

    subscribe(() => {
      console.log("Revalidator effect!")
    })

    return { cleanup, extend, effect, push, subscribe }
  })

  let handler: Proc0

  // RUNNER = dispatcher + generator
  function* run () {
    ensureRunIsntLooping()

    const locals: DispatcherRef = { scope }
    
    const dispatcher = doo(() => {
      const dispatcher = Dispatcher.create()

      dispatcher.use$ = (proc, ...params) => {
        if (proc instanceof GeneratorFunction) {
          return locals.scope.use(proc, ...params)
        }
        if (typeof proc === "function") {
          locals.resolver = proc
          return NON_RECON
        }
        throw new Error("use$ must be called with a generator or function!")
      }
      
      return dispatcher
    })

    const prevDispatcher: any = Dispatcher.current
    Dispatcher.current = dispatcher
      
    try {
      const iter = proc(...params)
      // console.log ({ iter })

      for (let i = 0; i < MAX; i++) {
        const { done, value } = iter.next()
        const { resolver } = locals
        if (done) return { value, resolver }
        console.log ("yielded", value)
        
        if (value instanceof Subscription) {
          console.log("extending...")
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
      }

      throw new Error("Too much yielding")
    }
    finally {
      Dispatcher.current = prevDispatcher
    }
  }

  const initer = doo(function* () {
    yield* run()
    /*
    if (ancestor !== scope) {
      console.log ("Ancestor is the one to use!")
      handler = ancestor.use (proc, ...params)
    }
    */
    // add to the correct place...
  })

  let resolved = NEVER

  revalidator.subscribe(() => {
    resolved = NEVER
  })
  
  const initDispatcher = doo (() => {
    const initHook = doo (() => {
      console.log ("Creating refs")
      const refs = [] as HookRef[]
      
      return () => {
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
    })
    
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
          revalidator.push ()
        })
        
        console.log ("useState", { state, setState })
        
        return [ state.current, setState.current ]
      }
      
      return dispatcher
    }
  })
  
  function* resolve() {
    yield revalidator.effect
    yield* initer
    if (handler) return yield* handler()
    
    if (resolved !== NEVER) {
      if (resolved instanceof Promise) {
        yield new PromiseEffect (resolved)
        if (resolved instanceof Promise) {
          throw new Error ("Promise was not resolved!")
        }
      }
      return resolved
    }
    
    const { value, resolver } = yield* run()
    console.log ("[resolve]", { value, resolver })
    
    if (value !== NON_RECON) {
      resolved = value
      return resolved
    }
    
    if (!resolver) throw new Error ("No resolver!")
    
    const dispatcher = initDispatcher()
    resolved = dispatcher (() => resolver())
    
    if (resolved instanceof Promise) {
      resolved = resolved.then ((x) => {
        console.log ("promise was resolved!!!")
        resolved = x
      })
      
      yield new PromiseEffect (resolved)
      if (resolved instanceof Promise) {
        throw new Error ("Promise was not resolved!")
      }
    }
    
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
    
    const locals: DispatcherRef = { scope }
    const dispatcher = Dispatcher.create()
    assignBasicHooks(dispatcher, locals)
    
    const { use } = Dispatcher.current!

    const render = dispatcher(() => {
      const iter = proc(...params)
      // console.log ({ iter })

      for (let i = 0; i < MAX; i++) {
        const { done, value } = iter.next()
        if (done) return value

        console.log("yielded on", value)
        if (value instanceof Subscription) {
          console.log("extending...")
          revalidator.extend (value)
        }
        else if (value instanceof PromiseEffect) {
          use (value.promise)
        }
      }

      throw new Error("Too much yielding")
    })
    
    if (typeof render !== "function") return render
    return render (...args)
  }
  
  
  const res = Recon as any
  
  res[Symbol.iterator] = resolve
  // @ts-ignore
  res.displayName = displayName
  
  return res as Reconic
}



// SCOPE

export class ReconScope {
  readonly parent?: ReconScope

  constructor (parent?: ReconScope) {
    this.parent = parent
  }
  
  private cache = memoize ((proc: Proc, ...params: any[]) => ({}) as {
    current: Proc0
  })
  
  private get = (proc: Proc, ...params: any[]): Proc0|undefined => {
    const self = this.cache (proc, ...params)
    
    if (self.current) return self.current
    return this.parent?.get?.(proc, ...params)
  }
  
  use = (proc: Proc, ...params: any[]) => {
    const displayName: string = (proc as any).displayName ?? proc.name
    const self = this.cache (proc, ...params)
    
    const found = this.get (proc, ...params)
    if (found) {
      console.log ("[use] found", displayName)
      return found
    }
    
    console.log ("[use] make", displayName)
    self.current = make (this, proc, ...params)
    return self.current
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

const ReconContext = createContext (NON_SCOPE)

export function ReconProvider (props: PropsWithChildren <{}>) {
  // TODO: ID for when suspended
  const scope = useInitial (() => new ReconScope())

  return (
    <ReconContext value={scope}>
      {props.children}
    </ReconContext>
  )
}



// EXECUTION

const NO_USE: typeof use = () => {
  throw new Error ("use does not exist")
}

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
  
  const scope = use (ReconContext)
  // eslint-disable-next-line
  // const scope = useInitial (() => new ReconScope (parent))
  
  // makes sure resource doesn't change
  resource = useInitial (() => resource) // eslint-disable-line
  
  if (resource instanceof GeneratorFunction) {
    // @ts-ignore
    return scope.use (resource, ...params)
  }
  // TODO: What if it's a function?
  throw new Error ("use$ does not support [whatever resource is]")
}

export function provide$ (resource: any, override: Func) {
  /*
  const handler = Dispatcher.current?.provide$
  if (!handler) throw new Error ("provide$ does not exist")
  handler (resource, override)
  */
}

export function context$ (...params: any[]) {
  /*
  console.log ("context$")

  const handler = Dispatcher.current?.context$
  if (!handler) throw new Error ("context$ does not exist")
  return handler (...params)
  */
}
