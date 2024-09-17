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
import { CallEffect, Effect, remit } from "./effect"
import { _use, Dispatcher } from "./state"
import { performEntrypoint } from "./state"

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

const ROOT = Symbol()
const ReconContext = createContext <symbol> (ROOT)



// ATOMIC API

/*

function handleCall (x) {
  // noop
}

const resolveAtom = extendStore (function* (scope, func, ...args) {
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
    return {
      status: "fulfilled",
      value,
    }
  }
  catch (thrown) {
    if (thrown instanceof Promise) {
      return {
        status: "pending",
      }
    }
    else {
      return {
        status: "rejected",
        reason: thrown,
      }
    }
  }
})

const preloadAtom = extendStore (async function* (scope, func, ...args) {
  let callEffect = function* () {
    return yield* new CallEffect (scope, func, args)
  }
  
  // Call handleCall for all CallEffects
  callEffect = remit (callEffect, function* (effect) {
    if (effect instanceof CallEffect) {
      handleCall (effect)
    }
    else {
      handleEffect (effect)
    }
  })

  for (const _ of loop ("preloadAtom")) {
    try {
      const { value } = callEffect().next()
      return value
    }
    catch (thrown) {
      if (thrown instanceof Promise) {
        await thrown
      }
      else {
        throw thrown
      }
    }
  }
})

const createAtom = extendStore (function* (
  scope: symbol,
  id: string,
  func: Func, 
  ...args: any[]
) {
  let loaded = false

  function applyUsability (atom: Atom <any>) {
    let self: any = {}

    Object.defineProperties (atom, {
      status: {
        get() {
          if (!self.status) {
            self = resolveAtom (scope, func, ...args)
            if (self.status !== "pending") {
              loaded = true
            }
          }

          console.assert (self.status)
          return self.status
        },
        set (newStatus) {
          self.status = newStatus
        }
      },
      reason: {
        get() {
          return self.reason
        },
        set (next) {
          self.reason = next
        }
      },
      value: {
        get() {
          return self.value
        },
        set (next) {
          self.value = next
        }
      },
    })
  }

  const atom: any = doo (async () => {
    if (loaded) return
    await preloadAtom (scope, func, ...args)
  })

  applyUsability (atom)

  atom[Symbol.iterator] ??= function* () {
    try {
      return yield* new CallEffect (scope, func, args)
    }
    finally {
      loaded = true
    }
  }

  atom.$$typeof = COMPONENT_TYPE
  atom.type = function ReconView (props: any) {
    const render = use (atom)
    if (typeof render === "function") {
      return render (props)
    }
    else {
      return render
    }
  }

  // yield new CallEffect (scope, func, args)
  return atom as Atom <any>
})
*/



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
