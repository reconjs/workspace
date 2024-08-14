import { Regenerator, Reiterator } from "./regenerator"
import { Func, Vunc } from "@reconjs/utils"
import { Prac, Returns } from "./types"
import { AsyncGeneratorFunction } from "./old"

type Reproc = (...args: any[]) => Generator <Regenerator, any>
type Reprac = (...args: any[]) => AsyncGenerator <Regenerator, any>

function* loop (debug: string) {
  for (let i = 0; i < 10; i++) {
    yield null
  }
  
  throw new Error (`[loop] too much (${debug})`)
}



export class Effect <T = any> extends Regenerator <T> {
  constructor () {
    super()
    const _this = this
    this.yield (function* () {
      yield _this // only yields itself once!
      throw new Error ("[Effect] must be handled eagerly")
    })
  }
}



export class AsyncEffect <T = any> extends Effect <T> {
  constructor (public effect: Effect <T>) {
    super()
    this.yield (function* () {
      throw new Error ("[AsyncEffect] must be handled asynchronously")
    })
  }
}



export function flux$ <T> (
  initialState: T,
  reducer: (state: T, effect: Effect) => T,
) {
  let state = { ...initialState }
  
  function defineAsync (prac: Reprac) {
    return async function call$ (...args: any[]) {
      const iter = prac (...args)
      
      for (const _ of loop ("flux$::async")) {
        const { done, value } = await iter.next()
        if (done) return value
        if (! (value instanceof Effect)) {
          throw new Error ("[flux$::async] only accepts Effects")
        }
        
        const nextState = reducer (state, new AsyncEffect (value))
        if (!nextState) throw new Error ("No next state")
        state = { ...nextState }
      }
    }
  }
  
  function defineSync (proc: Reproc) {
    return function call$ (...args: any[]) {
      const iter = proc (...args)
      
      for (const _ of loop ("flux$::sync")) {
        const { done, value } = iter.next()
        if (done) return value
        if (! (value instanceof Effect)) {
          throw new Error ("[flux$::sync] only accepts Effects")
        }
        
        const nextState = reducer (state, value)
        if (!nextState) throw new Error ("No next state")
        state = { ...nextState }
      }
    }
  }
  
  return function define$ <T extends Reprac|Reproc> (proc: T) {
    type P = Parameters <T>
    type R = T extends Prac 
      ? Promise <Returns <T>> 
      : Returns <T>
    
    const res: any = proc instanceof AsyncGeneratorFunction
      ? defineAsync (proc as any)
      : defineSync (proc as any)
    
    return res as (...args: P) => R
  }
}
