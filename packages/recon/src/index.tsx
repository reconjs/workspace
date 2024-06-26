import { Fanc, Func, createEvent, memoize } from "@reconjs/utils"
import { PropsWithChildren, createContext, use, useEffect, useId, useReducer } from "react"
import { Prac, PracReturns, Proc, ProcReturns, Recon, ReconResolver, ReconConsumer } from "./types"
import { Dispatcher } from "./react"
import { useInitial } from "@reconjs/utils-react"

const MAX = 100

function doo <T> (func: () => T) {
  return func()
}

const storage = memoize ((...args: any[]): any => ({}))
const symbolOf = memoize ((...args: any[]) => Symbol())

const rerenderOf = memoize ((...args: any[]) => {
  return createEvent()
})

// bysymbol = proc + params + called ctx
// resymbol = proc + hydrated params + hoisted ctx



function RERENDER () {
  return Symbol()
}

function useRerender () {
  const [ , rerender ] = useReducer (RERENDER, null)
  return rerender as VoidFunction
}

function useAutoRerender (...deps: any[]) {
  const rerender = useRerender()

  useEffect (() => {
    const unsub = rerenderOf (...deps).subscribe (() => {
      console.log ("auto rerender!")
      rerender()
    })
    return () => unsub()
  }, deps)
}


// CONTEXT

export class ReconScope {
  resolvers: ReconResolver[] = []
  parent?: ReconScope

  find = (proc: Proc, ...params: any[]): ReconResolver|undefined => {
    const found = this.resolvers.find ((resolver) => {
      console.log ({ resolver, proc, params })
      if (resolver.proc !== proc) return
      if (resolver.params.length !== params.length) return
      for (let i = 0; i < params.length; i++) {
        if (resolver.params[i] !== params[i]) return
      }
      return true
    })

    console.log (found)
    
    if (found) return found
    if (this.parent) return this.parent.find (proc, ...params)
  }

  hoist = (proc: Proc, ...params: any[]): ReconConsumer => {
    const scope = this
    const found = scope.find (proc, ...params)
    if (found) return found

    const consumer = new ReconConsumer (scope, proc, ...params)

    const initer = doo (function* initialize () {
      const resolver = new ReconResolver (scope, proc, ...params)
      resolver.current = execute (resolver)
      // TODO: Hoist to the correct level
      scope.resolvers.push (resolver)
    })

    // @ts-ignore
    consumer[Symbol.iterator] = function* initialize () {
      if (consumer.resolver) return

      const found1 = scope.find (proc, ...params)
      if (found1) {
        consumer.resolver = found1
        return
      }

      yield* initer

      const found2 = scope.find (proc, ...params)
      if (found2) {
        consumer.resolver = found2
        return
      }

      console.log (self)
      throw new Error ("Unexpected issue with hoisting")
    }

    return consumer
  }
}

const NON_SCOPE = doo (() => {
  const res = new ReconScope()
  res.find = () => {
    throw new Error ("ReconProvider not found!")
  }
  // @ts-ignore
  res.hoist = () => {
    throw new Error ("ReconProvider not found!")
  }
  return res
})

const ReconContext = createContext (NON_SCOPE)

export function ReconProvider (props: PropsWithChildren <{}>) {
  const id = useId() // de-dupe across Suspense
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

function execute (resolver: ReconResolver) {
  let index = -1
  const dispatcher = Dispatcher.create()

  const use = Dispatcher.current?.use ?? NO_USE

  let forwardCtx = resolver.scope

  dispatcher.use = (arg) => {
    if (arg instanceof Promise) return use (arg)
    throw new Error ("Can't use Context in generator")
  }

  dispatcher.use$ = (proc, ...params) => {
    // TODO:
    const gen = generatorOf (forwardCtx, proc, ...params)
    gen.consumer.subscribe (() => {
      resolver.push()
    })
    return gen
  }

  dispatcher.useState = (init: any): any => {
    const hookRefs = storage ("use_state", ++index, resolver)

    hookRefs.state ||= typeof init === "function"
      ? init()
      : init

    hookRefs.setState ||= function setState (nextState: any) {
      console.log ("setState", nextState)
      const { state, setStateAux } = hookRefs
      // if (setStateAux) return setStateAux (nextState)

      if (typeof nextState === "function") {
        nextState = nextState (state)
      }
      hookRefs.state = nextState
      resolver.push()
    }

    const { state, setState } = hookRefs
    return [ state, setState ]
  }

  return dispatcher (() => {
    const { proc, params } = resolver
    const generator = proc (...params)

    for (let i = 0; i < MAX; i++) {
      const { done, value } = generator.next()
      if (done) return value
      if (value) {
        // early exiting?
        console.log ("early return", value)
        // return value
      }
    }

    throw new Error ("Too much yielding")
  })
}

function consume (consumer: ReconConsumer) {
  const dispatcher = Dispatcher.create()

  const use = Dispatcher.current?.use ?? NO_USE

  let forwardCtx = consumer.scope

  dispatcher.use = (arg) => {
    if (arg instanceof Promise) return use (arg)
    throw new Error ("Can't use Context in generator")
  }

  dispatcher.use$ = (proc, ...params) => {
    // TODO:
    return generatorOf (forwardCtx, proc, ...params)
  }

  return dispatcher (() => {
    for (const effect of consumer) {
      console.log (effect)
    }

    const { resolver } = consumer
    if (!resolver) throw new Error ("Consumer didn't product a resolver")
    return resolver
  })
}

const NO_USE: typeof use = () => {
  throw new Error ("use does not exist")
}

/*
function resolve (consumer: ReconConsumer) {
  const rerender = rerenderOf (consumer)

  const dispatcher = Dispatcher.create()
  const use = Dispatcher.current?.use ?? NO_USE

  dispatcher.use = (arg) => {
    if (arg instanceof Promise) return use (arg)
    throw new Error ("Can't use Context in generator")
  }

  const refs = storage (consumer)
  refs.provides ??= []

  let forwardCtx = consumer.scope
  let i = -1

  /*
  dispatcher.provide$ = function provide$ (resource, handler) {
    forwardCtx = refs.provides [++i]

    forwardCtx ??= doo (() => {
      console.log ("Creating forward CTX")
      const sym = Symbol()
      storage (forwardCtx, resource).symbol = sym
      const refs = storage (sym)
      refs.parent = forwardCtx
      refs.resource = resource
      refs.handler = handler
      return sym
    })

    if (forwardCtx === ctx) {
      throw new Error ("Forward CTX matches CTX")
    }

    refs.provides [i] = forwardCtx
  }

  /*
  dispatcher.resolve$ = function* resolve$ (ctx, proc, ...params) {
    const res = execute (ctx, proc, ...params)

    rerenderOf (ctx, proc, ...params).subscribe(() => {
      console.log ("child re-rendered")
      // TODO: unsub! move to useEffect?
      rerender.push()
    })

    // TODO: Do this properly
    return res
  }

  dispatcher.use$ = (proc, ...params) => {
    // TODO:
    return generatorOf (forwardCtx, proc, ...params)
  }

  return dispatcher (() => {
    const { proc, params } = consumer
    const generator = proc (...params)

    // @ts-ignore
    if (generator[Symbol.asyncIterator]) throw new Error ("Async Generator")
    if (!generator[Symbol.iterator]) throw new Error ("Expected a Generator")

    for (let i = 0; i < MAX; i++) {
      const curr = generator.next()
      if (curr.done) return curr.value
      console.log (curr)
    }
    throw new Error ("Too much yielding")
  })
}
*/

const generatorOf = memoize ((scope: ReconScope, proc: Func <Recon>, ...params: any[]) => {
  console.log (scope)

  const consumer = scope.hoist (proc, ...params)

  const res: any = function Recon (...args: any[]) {
    console.log ("Rendering Recon Component", consumer)

    args = args.filter (x => typeof x !== "undefined")
    if (args.length > 1) {
      console.log (args)
      console.error ("Why are args getting passed to render?")
    }

    const resolver = consume (consumer as any)

    const rerender = useRerender()
    useEffect (() => {
      return resolver.subscribe (rerender)
    }, [ resolver ])
    
    console.log ("resolver =", resolver)
    // useAutoRerender (consumer)
    const useRender = execute (resolver)
    return useRender (...args)
  }

  // @ts-ignore
  res.consumer = consumer

  // @ts-ignore
  if (proc.displayName) res.displayName = proc.displayName
  else if (proc.name) res.displayName = proc.name

  // res.consumer = consumer

  res[Symbol.iterator] = function* yielding () {
    /*
    const resolver = Dispatcher.current?.resolve$
    if (!resolver) throw new Error ("resolve$ does not exist")
    const result = yield* resolver (ctx, resource, ...params)
    return result
    */
    console.log ("[yielding] start", consumer)
    yield* consumer
    console.log ("[yielding] end", consumer.resolver)
    
    if (!consumer.resolver) {
      throw new Error ("No resolver :(")
    }
    return execute (consumer.resolver)
  }

  return res
})

export function use$ <P extends Prac <Func>> (
  resource: P, 
  ...params: Parameters <P>
): never

export function use$ <T extends Fanc <Func>> (
  resource: T, 
  ...params: Parameters <T>
): never

export function use$ <P extends Proc> (
  resource: P, 
  ...params: Parameters <P>
): Recon <ProcReturns <P>>

export function use$ <P extends Prac> (
  resource: P, 
  ...params: Parameters <P>
): Recon <PracReturns <P>>

export function use$ <T extends Fanc <Func>> (
  resource: T, 
  ...params: Parameters <T>
): never

export function use$ <T extends Fanc> (
  resource: T, 
  ...params: Parameters <T>
): Recon <Awaited <ReturnType <T>>>

export function use$ <T extends Func <Func>> (
  resource: T, 
  ...params: Parameters <T>
): never

export function use$ <T extends Func> (
  resource: T, 
  ...params: Parameters <T>
): Recon <ReturnType <T>>

export function use$ (resource: any, ...params: any[]): never {
  const handler = Dispatcher.current?.use$
  // @ts-ignore
  if (handler) return handler (resource, ...params)
  
  const ctx = use (ReconContext)
  /*
  const id = useId()
  const parent = use (ReconContext)
  storage (id).scope ??= doo (() => {
    const scope = new ReconScope()
    scope.hoist = function* hoist (...args) {
      const resolver = yield* parent.hoist (...args)
    }
    return scope
  })
  const ctx = symbolOf (useId(), parent)
  storage (ctx).parent ??= parent
  */
  // @ts-ignore
  return generatorOf (ctx, resource, ...params)
}

export function provide$ (resource: any, override: Func) {
  const handler = Dispatcher.current?.provide$
  if (!handler) throw new Error ("provide$ does not exist")
  handler (resource, override)
}

export function context$ (...params: any[]) {
  console.log ("context$")

  const handler = Dispatcher.current?.context$
  if (!handler) throw new Error ("context$ does not exist")
  return handler (...params)
}
