import { Vunc, Func, Func0, memoize, range, timeout } from "@reconjs/utils"
import { AnyGenerator, Prac, Proc, Proc0, ReconEffect } from "./types"
import { Dispatcher } from "./react"
import { ReconScope } from "./old"

function doo <T> (func: () => T) {
  return func()
}


class HandleEffect extends ReconEffect {
  // scope!: ReconScope
  
  constructor (
    public proc: Proc,
    public args: any[],
    public init: Vunc <[ Proc0 ]>,
  ) {
    super ()
  }
}


function _atLoop$ () {
  let n = 0
  
  return function atLoop () {
    if (n++ > 5) throw new Error ("[_atLoop$] too much")
  }
}

export function* get$ (proc: Proc, ...args: any[]) {
  let handler = Dispatcher.current?.get$?.(proc, ...args)
  
  const init: HandleEffect["init"] = (nextHandler: Proc0) => {
    handler ??= nextHandler
  }
  
  const atLoop = _atLoop$()
  
  while (!handler) {
    atLoop()
    yield new HandleEffect (proc, args, init)
  }
  
  return yield* handler()
}


function _handlerOf$ () {
  function* handle (proc: Proc, ...args: any[]) {
    // TODO: Intercept args
    const iter = proc (...args)
    
    let scope: ReconScope
    
    for (let i = 0; i < 100; i++) {
      const { done, value } = iter.next()
      if (done) return value
      
      if (value instanceof HandleEffect) {
        // TODO: Scope
        yield value
        continue
      }
      
      throw new Error ("[handlerOf] yielded")
    }
  }

  return memoize ((proc: Proc, ...args: any[]) => {
    return function* handler () {
      return yield* handle (proc, ...args)
    }
  })
}


function resolvers <T> () {
  const result = {} as {
    resolve: (value: T) => void
    reject: (reason?: any) => void
    promise: Promise <T>
  }
  
  result.promise = new Promise <T> ((resolve, reject) => {
    result.resolve = resolve
    result.reject = reject
  })
  
  return result
}


class PhaseIterator {
  private _count = 0
  private current = resolvers <void> ()
  
  revalidate () {
    const prev = this.current
    this.current = resolvers ()
    prev.resolve()
  }
  
  async *[Symbol.asyncIterator] () {
    for (; this._count < 100; this._count++) {
      yield
      await this.current.promise
    }
  }
}

export async function* run$ (proc: Proc0) {
  const phases = new PhaseIterator()
  
  const handlerOf = _handlerOf$()
  
  async function run () {
    const iter = proc()
    
    for (let i = 0; i < 100; i++) {
      const { value, done } = iter.next()
      if (done) return value
      
      // continue if you want...
      if (value instanceof HandleEffect) {
        const { proc, args, init } = value
        const handler = handlerOf (proc, ...args)
        init (handler)
        continue
      }
      
      throw new Error ("Unhandled Yield")
    }
    
    throw new Error ("[run$] too much yielding...")
  }
  
  for await (const _ of phases) {
    yield run()
  }
}



// EXPERIMENTAL

/*
function _handle$ <T extends Func> (func: T, handler: T) {
  
}

function _handler$ <T> (func: T) {
  // lookup handler
  return 
}

function _invoke$ (func, ...args) {
  
}
*/

/*
class ReconOrchestrator {
  use () {
    
  }
  
  useState () {
    
  }
  
  emit () {
    
  }
  
  onYield () {
    
  }
  
  onCall () {
    
  }
  
  onRender () {
    
  }
  
  onMount () {
    
  }
  
  onUnmount () {
    
  }
  
  onEffect () {
    
  }
  
  onResolve () {
    
  }
  
  onReject () {
    
  }
}
*/