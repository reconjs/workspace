import { Func, Vunc } from "@reconjs/utils"
import { AsyncGeneratorFunction, Prac, Returns } from "../types"
import { Effect } from "../effect"

type Reproc = (...args: any[]) => Generator <Effect, any>
type Reprac = (...args: any[]) => AsyncGenerator <Effect, any>

function doo <T> (func: Func <T>) {
  return func ()
}

function* loop (debug: string) {
  for (let i = 0; i < 10; i++) {
    yield null
  }
  
  throw new Error (`[loop] too much (${debug})`)
}

const NEVER = doo(() => {
  const res = new Effect()
  res.throw (new Error("[NEVER] should never be called"))
  return res
})



export function defineStore <T> (
  initialState: T,
  reducer: (state: T, effect: Effect) => T,
) {
  let state = initialState
  
  function defineAsyncAction (prac: Reprac) {
    return async function call$ (...args: any[]) {
      const iter = prac (...args)
      
      let prev = NEVER
      
      try {
        for (const _ of loop ("defineAsyncAction")) {
          const { done, value } = await iter.next()
          if (done) return value
          
          if (! (value instanceof Effect)) {
            throw new Error ("[defineAsyncAction] only accepts Effects")
          }
          
          if (prev === value) {
            throw new Error ("[defineASyncAction] should not return the same effect")
          }
          
          const nextState = reducer (state, value)
          if (!nextState) throw new Error ("No next state")
          state = nextState
        }
      }
      catch (error) {
        console.error ("FROM STORE", error)
      }
    }
  }
  
  function defineSyncAction (proc: Reproc) {
    return function call (...args: any[]) {
      const iter = proc (...args)
      
      let prev = NEVER
      
      for (const _ of loop ("defineSyncAction")) {
        const { done, value } = iter.next()
        if (done) return value
        
        if (! (value instanceof Effect)) {
          throw new Error ("[defineSyncAction] only accepts Effects")
        }
        
        if (prev === value) {
          throw new Error ("[defineSyncAction] should not return the same effect")
        }
        
        const nextState = reducer (state, value)
        if (!nextState) throw new Error ("No next state")
        state = nextState
      }
    }
  }
  
  return function defineAction <T extends Reprac|Reproc> (proc: T) {
    type P = Parameters <T>
    type R = T extends Prac 
      ? Promise <Returns <T>> 
      : Returns <T>
    
    const res: any = proc instanceof AsyncGeneratorFunction
      ? defineAsyncAction (proc as any)
      : defineSyncAction (proc as any)
    
    return res as (...args: P) => R
  }
}