import { Func } from "@reconjs/utils"
import { Returns } from "./types"
import { 
  createContext,
  memo, 
  useId, 
  use,
  MemoExoticComponent,
  useEffect,
} from "react"
import { Effect } from "./effect"
import { _use, Dispatcher, performEntrypoint, ScopeSymbol } from "./state"
import { useResync } from "./resync"

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

const COMPONENT_TYPE = doo (() => {
  const UNRENDERED = memo (() => null)
  return UNRENDERED.$$typeof
})

/**
* Atoms are Promises, Iterables, and Components.
*  - As a promise, they are meant to resolve synchronously with `use`.
*  - Otherwise it will return a promise and $$typeof will be Symbol.for ("react.memo")
*/
export type Atom <T> = Promise<T> & {
  [Symbol.iterator]: () => Iterator <Effect, T>,
}



// CONTEXT

const ROOT = new ScopeSymbol()
const ReconContext = createContext <ScopeSymbol> (ROOT)



// ATOMIC API

export function useAtomic <T extends Func> (
  hook: T, 
  ...args: any[]
): Atom <Returns <T>> {
  const dispatcher = Dispatcher.current
  if (!dispatcher) throw new Error ("useAtomic must be called inside a component")
  if (dispatcher.useAtomic) return dispatcher.useAtomic (hook, ...args)
  
  const id = useId() // eslint-disable-line

  // eslint-disable-next-line
  useEffect (() => {

  }, [])

  /* TODO: Sync lifecycles with Recon.
  useLayoutEffect (() => {

  }, [])

  useInsertionEffect (() => {

  }, [])
  */

  useResync (id) // eslint-disable-line
  const scope = use (ReconContext) // eslint-disable-line
  return performEntrypoint (id, scope, hook, ...args)
}



export function atomic <T extends Func> (hook: T) {
  type P = Parameters <T>
  type X = Returns <T>
  type R = (
    X extends MemoExoticComponent <any> ? X
    : X extends Atom <any> ? X
    : Atom <X>
  )

  function useRecon (...args: any[]): any {
    return useAtomic (hook, ...args)
  }
  
  return useRecon as Func <R, P>
}
