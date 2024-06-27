import { Fanc, Fanc0, Func, Func0, createEvent, memoize } from "@reconjs/utils"
import { useInitial } from "@reconjs/utils-react"
import {
  PropsWithChildren,
  createContext,
  use,
  useReducer,
} from "react"

import { Dispatcher } from "./react"

const MAX = 100

function doo <T> (func: () => T) {
  return func()
}

function RERENDER () {
  return Symbol()
}

function useRerender () {
  const [ , rerender ] = useReducer (RERENDER, null)
  return rerender as VoidFunction
}

type AnyGenerator = Generator <any, any, any>

type Proc0 <T = any> = () => Generator <any, T>
export type Proc <T = any, A extends any[] = any[]> = (...args: A) => Generator <any, T>
type Prac <T = any, A extends any[] = any[]> = (...args: A) => AsyncGenerator <any, T>

type Returns <F extends Func> = F extends Proc <infer T> ? T : Awaited <ReturnType <F>>

abstract class ReconEffect {}



// RECON TYPES

export type Reconic <T = any> = T extends Func ? T : Generator <ReconEffect, T>

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
    const scope = this
    
    const found = scope.get (proc, ...params)
    if (found) return found
    
    let handler: Proc0
    
    
    const initer = doo (function* () {
      const dispatcher = Dispatcher.create ()
      dispatcher.scope = scope
      
      dispatcher (() => {
        const iter = proc (...params)
        
        for (let i = 0; i < MAX; i++) {
          const { done, value } = iter.next()
          if (done) return
          console.log (value)
        }
        
        throw new Error ("Too much yielding")
      })
      
      const ancestor = scope // TODO: Track in runtime?
      if (ancestor !== scope) {
        handler = ancestor.use (proc, ...params)
      }
      // add to the correct place...
    })
    
    
    function* resolve() {
      yield* initer
      if (handler) return yield* handler()
      
      const dispatcher = Dispatcher.create()
      dispatcher.scope = scope
      
      return dispatcher (() => {
        const iter = proc (...params)
        
        for (let i = 0; i < MAX; i++) {
          const { done, value } = iter.next()
          if (done) return value
          console.log (value)
        }
        
        throw new Error ("Too much yielding")
      })
    }
    
    
    function Recon (...args: any[]) {
      console.log ("Rendering Recon Component")
  
      args = args.filter (x => typeof x !== "undefined")
      if (args.length > 1) {
        console.log (args)
        console.error ("Why are args getting passed to render?")
      }
      
      const dispatcher = Dispatcher.create()
      dispatcher.scope = scope
      
      return dispatcher (() => {
        const iter = resolve()
        
        for (let i = 0; i < MAX; i++) {
          const { done, value } = iter.next()
          if (done) {
            let render: Func = () => value
            if (typeof value === "function") render = value
            return render (...args)
          }
          console.log (value)
        }
        
        throw new Error ("Too much yielding")
      })
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
  // @ts-ignore
  const scope = Dispatcher.current?.scope ?? use (ReconContext)
  // eslint-disable-next-line
  // const scope = useInitial (() => new ReconScope (parent))
  // @ts-ignore
  return scope.use (resource, ...params)
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
