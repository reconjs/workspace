import { Func, Func0 } from "@reconjs/utils"
import { AnyGenerator, Proc } from "./types"
import { Atom } from "./atomic"

const WINDOW = typeof window !== "undefined" 
  ? window as any 
  : null

function doo <T> (func: () => T) {
  return func()
}

function* loop (debug: string) {
  for (let i = 0; i < 100; i++) {
    yield null
  }
  
  throw new Error (`[loop] too much (${debug})`)
}



const NEVER = doo(() => {
  class Never {}
  return new Never() as any
})

const SKIP = doo (() => {
  class Skip {}
  return new Skip() as any
})



export type Regenerator <T = any> = Generator <Effect|never, T, undefined>

type Regeneration <T = any> = ReturnType <Regenerator<T>["next"]>

export class Effect <T = any> {
  #returns = NEVER as T;
  #throws = NEVER;
  
  #async?: {
    promise: Promise <T>,
    resolve: (value: T) => void,
    reject: (error: any) => void,
  }
  
  return (that: T) {
    this.#returns = that
    if (this.#async) {
      this.#async.resolve (that)
    }
  }

  throw (that: any) {
    this.#throws = that
    if (this.#async) {
      this.#async.reject (that)
    }
  }
  
  get promise() {
    const initPromise = () => {
      if (this.#returns) return Promise.resolve (this.#returns)
      if (this.#throws) return Promise.reject (this.#throws)
      
      return new Promise <T> ((resolve, reject) => {
        this.#async!.resolve = resolve
        this.#async!.reject = reject
      })
    }
    
    if (! this.#async) {
      this.#async = {
        resolve: () => {},
        reject: () => {},
        promise: initPromise(),
      }
    }
    
    return this.#async.promise
  }
  
  /*
  get then () {
    return this.promise.then
  }
  
  get catch () {
    return this.promise.catch
  }
  
  get finally () {
    return this.promise.finally
  }
  */
  
  #iterator: Regenerator <void> = doo (() => {
    const _this = this
    
    return doo <AnyGenerator> (function* () {
      for (const _ of loop ("Effect.#iterator")) {
        yield _this
      }
    })
  })
  
  next(): Regeneration<T> {
    if (this.#throws !== NEVER) throw this.#throws
    if (this.#returns !== NEVER) return {
      done: true,
      value: this.#returns
    }

    try {
      const next = this.#iterator.next()
      if (next.value === SKIP) return this.next()
      if (next.done) throw new Error ("[Atom::next] not possible...")
      return next
    }
    catch (thrown) {
      this.throw (thrown)
      throw thrown
    }
  }
  
  yield (generator: () => Regenerator <void>) {
    const _this = this
    
    const newIterator = doo <Regenerator <void>> (function* () {
      yield SKIP // so that we don't immediately invoke the handler
      try {
        const iter = generator()
        for (const _ of loop ("Atom::yield")) {
          const { done, value } = iter.next()
          if (done) return
          yield value
        }
      }
      catch (thrown) {
        _this.throw (thrown)
      }
    })
    
    const prevIterator = this.#iterator
    
    this.#iterator = doo (function* () {
      yield* newIterator
      yield* prevIterator
    })
  }

  *[Symbol.iterator](): Iterator <Effect, T> {
    while (true) {
      const { done, value } = this.next()
      
      if (done) return value // @ts-ignore
      yield value // @ts-ignore
    }
  }
}



export class CallEffect extends Effect <Atom <any>> {
  constructor (
    public scope: symbol,
    public func: Func,
    public args: any[]
  ) {
    super()
  }
}



export function remit <F extends Func <Regenerator>> (
  proc: F,
  iterate: Func <Regenerator <void>, [
    Effect
  ]>
): F {
  function* remitted (...args: any[]) {
    const generator = proc (...args)
    
    for (const _ of loop ("remit")) {
      const { done, value } = generator.next()
      if (done) return value
      
      yield* iterate (value)
    }
  }
  
  return remitted as F
}
