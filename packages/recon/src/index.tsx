import { Fanc, Fanc0, Func, Func0, createEvent, memoize } from "@reconjs/utils"
import { useInitial } from "@reconjs/utils-react"
import {
  PropsWithChildren,
  createContext,
  use,
  useReducer,
} from "react"

import { Dispatcher } from "./react"

const NEVER = {} as any
const MAX = 20

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


// SCOPE
let runCount = 0

type DispatcherRef = {
  scope: ReconScope,
  resolver?: Func,
}

function createBasicDispatcher (ref: DispatcherRef) {
  const dispatcher = Dispatcher.create ()
  
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

export class ReconScope {
  readonly parent?: ReconScope

  constructor (parent?: ReconScope) {
    this.parent = parent
  }
  
  private cache = memoize ((proc: Proc, ...params: any[]) => ({}) as {
    current: Proc0
  })
  
  private get = (proc: Proc, ...params: any[]): Proc0|undefined => {
    const ref = this.cache (proc, ...params)
    
    if (ref.current) return ref.current
    return this.parent?.get?.(proc, ...params)
  }
  
  use = (proc: Proc, ...params: any[]) => {
    // console.log ("Scope::use", proc.displayName ?? proc.name)
    const scope = this
    
    const found = scope.get (proc, ...params)
    if (found) return found
    
    let handler: Proc0
    
    // RUNNER = dispatcher + generator
    function run () {
      if (runCount++ > MAX) throw new Error ("Too much running")
      
      const ref: DispatcherRef = { scope }
      const dispatcher = createBasicDispatcher (ref)
      
      const result = dispatcher (() => {
        const iter = proc (...params)
        // console.log ({ iter })
        
        for (let i = 0; i < MAX; i++) {
          const { done, value } = iter.next()
          if (done) return value
          console.log ("yielded on", value)
        }
        
        throw new Error ("Too much yielding")
      })
      
      const { resolver } = ref
      return { result, resolver }
    }
    
    const initer = doo (function* () {
      run()
      /*
      if (ancestor !== scope) {
        console.log ("Ancestor is the one to use!")
        handler = ancestor.use (proc, ...params)
      }
      */
      // add to the correct place...
    })
    
    let resolved = NEVER
    
    let hooks: any[] = []
    
    function* resolve() {
      yield* initer
      console.log ("finished initer")
      if (handler) return yield* handler()
      if (resolved !== NEVER) return resolved
      
      const { result, resolver } = run()
      console.log ("[resolve]", { result, resolver })
      if (result !== NON_RECON) return result
      if (!resolver) throw new Error ("No resolver!")
      
      const hook = doo (() => {
        let index = -1
        type Hook <T> = { current: T }
        return function <T> (initial: () => T): Hook <T> {
          index += 1
          hooks [index] ??= { current: initial() }
          return hooks [index]
        }
      })
      
      const dispatcher = Dispatcher.create ()
      
      dispatcher.useRef = (init: any) => hook (() => init)
      
      dispatcher.useState = (init: any) => {
        const state = hook (() => {
          if (typeof init !== "function") init = () => init
          return init()
        })
        
        const setState = hook (() => (next: any) => {
          if (typeof next !== "function") next = (_: any) => next
          state.current = next (state.current)
          console.log ("new state", state.current)
          // TODO: rerender
        })
        
        return [ state.current, setState.current ]
      }
      
      resolved = dispatcher (() => {
        try {
          console.group("Calling resolver:")
          return resolver()
        }
        finally {
          console.groupEnd()
        }
      })
      
      return resolved
    }
    
    
    function Recon (...args: any[]) {
      console.log ("Rendering Recon Component")
  
      args = args.filter (x => typeof x !== "undefined")
      if (args.length > 1) {
        console.log (args)
        console.error ("Why are args getting passed to render?")
      }
      
      const { result } = run()
      if (typeof result !== "function") return result
      return result (...args)
    }
    
    
    const res = Recon as any
    
    res[Symbol.iterator] = resolve
    // @ts-ignore
    res.displayName = proc.displayName ?? proc.name ?? "Recon"
    return res as Reconic
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
