import { Fanc0, Func, Func0, memoize, Vunc, withResolvers } from "@reconjs/utils"
import { AnyGenerator, Prac, Proc, Returns } from "./types"
import {
  act,
  Fragment,
  FunctionComponent,
  memo,
  useId,
  use,
  createContext,
  useMemo,
} from "react"
import { _use, Dispatcher, ReconDispatcher, ReactDispatcher } from "./react"
import { AsyncGeneratorFunction } from "./old"
import { Regenerator, remit } from "./regenerator"
import { AsyncEffect, Effect, flux$ } from "./store"

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

type ReconEntrypoint = {
  context: symbol,
  proc: Proc,
  args: any[],
}

type ReconUsage = {
  scope: symbol,
  parent: symbol,
  proc: Proc,
  args: any[],
}

type ReconRendered = {
  scope: symbol,
  viewId: string,
  parent: symbol,
}

type ReconStackState = {
  proc: Proc,
  args: any[],
  scope: symbol,
  iter: Generator <Regenerator, any>,
  hooks: [],
}

type ReconPrerenderingState = {
  proc: Proc,
  args: any[],
  // iter: Generator <Regenerator, any>,
  scope: symbol,
  viewId: string,
  dispatcher: ReactDispatcher,
  stack: ReconStackState[],
}

type ReconDataState = {
  proc: Func,
  args: any[],
  value?: any,
  error?: any,
  promise?: Promise <any>,
}

type ReconState = {
  entrypoints: ReconEntrypoint[],
  errors: any[],
  renders: ReconRendered[],
  data: ReconDataState[],
  prerendering?: ReconPrerenderingState,
}

const INITIAL_STATE: ReconState = {
  entrypoints: [],
  errors: [],
  renders: [],
  data: []
}

class PrerenderEffect extends Effect <void> {
  constructor (public props: {
    proc: Proc,
    args: any[],
    scope: symbol,
    viewId: string,
    dispatcher: ReactDispatcher,
  }) {
    super ()
  }
}

class DispatcherEffect extends Effect <ReactDispatcher> {}

class PrerenderedEffect extends Effect <void> {
  constructor (public viewId: string) {
    super ()
  }
}

class DataEffect extends Effect <ReconDataState|undefined> {
  constructor (public props: {
    proc: Proc,
    args: any[],
  }) {
    super ()
  }
}

class ResolvedEffect extends Effect <void> {
  constructor (public props: {
    proc: Proc,
    args: any[],
    value?: any,
    error?: any,
    promise?: Promise<any>,
  }) {
    super ()
  }
}



const define$ = flux$ (INITIAL_STATE, (state, effect) => {
  if (effect instanceof AsyncEffect) {
    // Async Effect is just so we know it came from Async
    effect = effect.effect
  }
  
  if (effect instanceof DispatcherEffect) {
    const { prerendering } = state
    if (!prerendering) {
      effect.throw (new Error ("No dispatcher"))
    }
    else {
      effect.return (prerendering.dispatcher)
    }
    return state
  }
  
  if (effect instanceof PrerenderEffect) {
    state = {
      ...state,
      prerendering: {
        ...effect.props,
        stack: [],
      }
    }
    
    effect.return()
    return state
  }
  
  if (effect instanceof PrerenderedEffect) {
    const { prerendering, ...nextState } = state
    
    if (!prerendering) {
      throw new Error ("[prerendered] No prerendering state")
    }
    
    effect.return()
    return nextState
  }
  
  if (effect instanceof DataEffect) {
    const { proc, args } = effect.props
    
    function isDataEqual (alpha: any) {
      if (alpha.proc !== proc) return false
      if (alpha.args.length !== args.length) return false
      for (let i = 0; i < alpha.args.length; i++) {
        if (alpha.args[i] !== args[i]) return false
      }
      return true
    }
    
    const found = state.data.find (isDataEqual)
    effect.return (found)
    if (found) return state
    return {
      ...state,
      data: [
        ...state.data,
        {
          proc,
          args,
        }
      ]
    }
  }
  
  if (effect instanceof ResolvedEffect) {
    const { proc, args, value, error, promise } = effect.props
    
    function isDataEqual (alpha: any) {
      if (alpha.proc !== proc) return false
      if (alpha.args.length !== args.length) return false
      for (let i = 0; i < alpha.args.length; i++) {
        if (alpha.args[i] !== args[i]) return false
      }
      return true
    }
    
    const nextData = state.data.map ((curr) => {
      if (isDataEqual (curr)) {
        return {
          ...curr,
          value,
          error,
          promise,
        }
      }
      return curr
    })
    
    effect.return()
    return {
      ...state,
      data: nextData,
    }
  }
  
  throw new Error ("[define$] Unknown task")
})



const await$ = define$ (async function* (atom: Recon<any>) {
  if (! (atom instanceof Recon)) {
    throw new Error ("[await$] atom expected")
  }
  
  const proc = atom.proc as any
  const { args } = atom
  
  try {
    const iter = proc (...args)

    for (const _ of loop ("await$")) {
      const { done, value } = await iter.next()
      if (done) {
        yield new ResolvedEffect ({ proc, args, value })
        return
      }
      if (value instanceof Effect) {
        yield* value
      }
      throw new Error ("[await$] yielded non-effect")
    }
  }
  catch (error) {
    console.error ("[await$] caught something")
    if (error instanceof Promise) {
      error = new Error ("[await$] caught promise")
    }
    throw error
  }
})



const yield$ = define$ (function* (task: Regenerator) {
  console.log ("[yield$]", task)
  
  if (task instanceof Effect) {
    yield* task
    return
  }
  
  if (task instanceof Recon) {
    const { args } = task
    const proc = task.proc as Proc
    const isAsync = task.proc instanceof AsyncGeneratorFunction
    
    const data = yield* new DataEffect ({ proc, args })
    
    if (!data && isAsync) {
      const promise = await$ (task).catch ((error) => {
        yield$ (new ResolvedEffect ({ proc, args, error }))
      })
      
      yield new ResolvedEffect ({ proc, args, promise })
      return
    }
    
    if (!data) return task.yield (function* () {
      try {
        const value = yield* proc (...args)
        yield new ResolvedEffect ({ proc, args, value })
      }
      catch (thrown) {
        if (thrown instanceof Promise) {
          yield new ResolvedEffect ({ proc, args, promise: thrown })
        }
        else {
          yield new ResolvedEffect ({ proc, args, error: thrown })
        }
      }
    })
    
    if (data.error) {
      if (data.error instanceof Promise) {
        console.error ("[data.error] promise")
      }
      task.throw (data.error)
      return
    }
    
    if (data.promise) {
      task.throw (data.promise)
      return
    }
    
    if (data.value) {
      task.return (data.value)
      return
    }
  
    for (const _ of loop ("yield$")) {
      const { done, value } = task.next()
      if (done) return
      if (value === task) return
      yield$ (value)
    }
  }
  
  throw new Error ("[yield$] invalid task")
})



const prerender$ = define$ (function* (
  viewId: string,
  scope: symbol,
  proc: Proc, 
  ...args: any[]
) {
  const dispatcher = Dispatcher.current
  if (!dispatcher) throw new Error ("Expected dispatcher")

  yield new PrerenderEffect({
    proc,
    args,
    scope,
    viewId,
    dispatcher,
  })
  
  const prerender$ = remit (proc, function* (x) {
    // filter out some effects...
    try {
      yield$ (x)
    }
    catch (thrown) {
      console.error ("[prerender$]", thrown)
      throw thrown
    }
  })
  
  return () => {
    const dispatcher = Dispatcher.current
    Dispatcher.current = DISPATCHER
    
    try {
      const { done, value } = prerender$ (...args).next()
      if (!done) throw new Error ("[prerender$] prerender did not complete")
      
      return { render: value }
    }
    catch (thrown) {
      if (thrown instanceof Promise) {
        use (thrown)
        console.warn("[render$] use did not suspend!?")
        throw thrown
      }
      else {
        throw thrown
      }
    }
    finally {
      try {
        yield$(new PrerenderedEffect(viewId))
      }
      catch (thrown) {
        throw new Error ("PrerenderedEffect failed!!!!")
      }
      Dispatcher.current = dispatcher
    }
  }
})





class ReconTask <T = any> extends Regenerator <T> {}

class Recon <T> extends Regenerator <T> {
  constructor (
    public proc: Prac|Proc, 
    public args: any[],
  ) {
    super ()
  }
}

const NIL = doo (() => {
  class Nil extends Recon <any> {
    constructor () {
      super (function* () {
        console.error ("NIL should not be used")
      }, [])
    }
  }
  
  return new Nil()
})



// TASKS:

class FinishedTask extends ReconTask {
  constructor (public props: {
    proc: Proc|Prac,
    args: any[],
    error?: any,
    value?: any,
  }) {
    super ()
  }
}

class PrerenderedTask extends ReconTask {
  context?: symbol
  
  constructor () {
    super ()
  }
}

const DISPATCHER: ReconDispatcher = {} as any

DISPATCHER._use = define$ (function* (init: any) {
  return init()
})

DISPATCHER.use = define$ (function* (arg: any) {
  if (arg === Recontext) return ROOT
  if (arg instanceof Promise) {
    const { use } = yield* new DispatcherEffect()
    return use (arg)
  }
  throw new Error ("[use] unsupported argument")
})

/* TODO:
DISPATCHER.use$ = define$ (function* () {
  
})
*/

// FIXME: Do this for real.
DISPATCHER.useState = define$ <any> (function* (init: any) {
  const initState = typeof init === "function" ? init() : init
  function setState () {
    // noop
  }
  return [ initState, setState ] as const
})



// RENDERING

const ROOT = Symbol()
const Recontext = createContext <symbol> (ROOT)



export function use$ <P extends Proc <FunctionComponent>> (
  resource: P, 
  ...params: Parameters <P>
): Returns <P>

export function use$ (proc: Func, ...args: any[]) {
  const dispatcher = Dispatcher.current

  if (!dispatcher) {
    throw new Error("use$ must be called at the top-level of a React Component or Recon Generator")
    // const task = new CallTask({ proc, args })
    // perform(task)
    // if (!task.returns) throw new Error("NO RETURNS?!")
    // return task.returns
  }

  const { use$ } = dispatcher
  // @ts-ignore
  if (use$) {
    console.log ("[use$] from dispatcher")
    return use$ (proc, ...args)
  }

  // TODO: SSR
  // @ts-ignore
  if (!WINDOW) return Fragment

  const scope = use (Recontext)

  // eslint-disable-next-line
  return _use (() => {
    function ReconView (props: any) {
      console.log("[ReconView] start")
      const viewId = useId()

      const useRecon = prerender$ (viewId, scope, proc, ...args)
      const { render, context }  = useRecon()
      const element = render (props)
      if (!context) return element
      
      return (
        <Recontext value={context}>
          {element}
        </Recontext>
      )
      /*
      return useRecon (props, new RenderTask ({
        viewId,
        scope,
        proc,
        args,
      }))
      */
    }
    
    return memo (ReconView as FunctionComponent)
  })
}



export function get$ <P extends Prac|Proc> (
  proc: P, 
  ...args: Parameters <P>
): Recon <Returns <P>> {
  const dispatcher = Dispatcher.current
  
  if (dispatcher?.get$) {
    return dispatcher.get$ (proc, ...args)
  }
  return new Recon (proc, args)
}
