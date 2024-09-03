import { Func, memoize } from "@reconjs/utils"
import { Proc, Returns } from "./types"
import { createContext, ExoticComponent, memo, Usable, useId, use } from "react"
import { CallEffect, Effect, remit } from "./effect"
import { Dispatcher, ReactDispatcher } from "./react"
import { defineStore } from "./store"
import { extendStore, handleCall, handleEffect } from "./state"

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



// ATOM

const UNCONTEXT = createContext (null)
const UNRENDERED = memo (() => null)

/**
* Atomic hooks will attempt to resolve synchronously
*  - If it works and returns atom then $$typeof will be CONTEXT_TYPE
*    - If we don't do this then we would suspend on resolvable atoms
*  - Otherwise it will return a promise and $$typeof will be Symbol.for ("react.memo")
*/
export type Atom<T> = Usable<T> & {
  [Symbol.iterator]: () => Iterator <Effect, T>,
}



// CONTEXT

const ROOT = Symbol()
const ReconContext = createContext <symbol> (ROOT)



// ATOMIC API

const handleAtom = extendStore (function* (
  scope: symbol,
  id: string,
  func: Func, 
  ...args: any[]
) {  
  function createAtom (usable: Usable <any>): Atom <any> {
    const atom: any = usable
    atom[Symbol.iterator] ??= function* () {
      return yield* new CallEffect (scope, func, args)
    }
    return atom
  }
  
  let callEffect = function* () {
    return yield* new CallEffect (scope, func, args)
  }
  
  // Call handleCall for all CallEffects
  callEffect = remit (callEffect, function* (effect) {
    if (effect instanceof CallEffect) {
      handleCall (effect)
    }
    else {
      yield* effect
    }
  })
  
  try {
    const value = yield* callEffect()
    
    return createAtom ({
      $$typeof: UNCONTEXT.$$typeof,
      // @ts-ignore
      _currentValue: value,
      _currentValue2: value,
    })
  }
  catch (thrown) {
    if (thrown instanceof Promise) {
      return createAtom (thrown)
    }
    else {
      throw thrown
    }
  }
})



export function useAtomic <T extends Func> (
  hook: T, 
  ...args: any[]
): Atom <Returns <T>> {
  const dispatcher = Dispatcher.current
  if (!dispatcher) throw new Error ("useAtomic must be called inside a component")
  if (dispatcher.useAtomic) return dispatcher.useAtomic (hook, ...args)
  
  const id = useId() // eslint-disable-line
  const scope = use (ReconContext) // eslint-disable-line
  const atom = handleAtom (scope, id, hook, ...args)
  console.log ("[useAtomic]", atom)
  return atom
}

export function atomic <T extends Func> (
  hook: T
) {
  type P = Parameters <T>
  type X = Returns <T>
  type R = (
    X extends ExoticComponent <any> ? X
    : X extends Atom <any> ? X
    : Atom <X>
  )
    
  function useRecon (...args: any[]): any {
    return useAtomic (hook, ...args)
  }
  
  return useRecon as Func <R, P>
}