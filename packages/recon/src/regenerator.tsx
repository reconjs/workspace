import { Func, Func0 } from "@reconjs/utils"
import { AnyGenerator, Proc } from "./types"

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



export type Reiterator <T = any> = Generator <Regenerator|never, T, undefined>

type Reiteration <T = any> = ReturnType <Reiterator<T>["next"]>



export class Regenerator <T = any> {
  #returns = NEVER as T;
  #throws = NEVER;
  
  return (that: T) {
    this.#returns = that
    // this.#async.resolve (that)
  }

  throw (that: any) {
    this.#throws = that
    // this.#async.reject (that)
  }
  
  /*
  #async = doo (() => {
    const res = {} as any
    
    res.promise = new Promise <T> ((resolve, reject) => {
      res.resolve = resolve
      res.reject = reject
    })
    
    return res as {
      promise: Promise <T>,
      resolve: (value: T) => void,
      reject: (error: any) => void,
    }
  })
  
  get promise() {
    return this.#async.promise
  }
  */
  
  #iterator: Reiterator <void> = doo (() => {
    const _this = this
    
    return doo <AnyGenerator> (function* () {
      while (true) {
        yield _this
      }
    })
  })
  
  next(): Reiteration<T> {
    if (this.#throws !== NEVER) throw this.#throws
    if (this.#returns !== NEVER) return {
      done: true,
      value: this.#returns
    }

    try {
      const next = this.#iterator.next()
      if (next.value === SKIP) return this.next()
      if (next.done) throw new Error ("[Regenerator::next] not possible...")
      return next
    }
    catch (thrown) {
      this.throw (thrown)
      throw thrown
    }
  }
  
  yield (generator: () => Reiterator <void>) {
    const _this = this
    
    const newIterator = doo <Reiterator <void>> (function* () {
      yield SKIP // so that we don't immediately invoke the handler
      try {
        const iter = generator()
        for (const _ of loop ("Regenerator::yield")) {
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

  *[Symbol.iterator](): Iterator <Regenerator, T> {
    while (true) {
      const { done, value } = this.next()
      
      if (done) return value // @ts-ignore
      yield value // @ts-ignore
    }
  }
}

export function remit <F extends Func <Reiterator>> (
  proc: F,
  iterate: Func <Reiterator <void>, [
    Regenerator
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
