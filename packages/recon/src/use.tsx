import { Func, Func0, memoize, Vunc, withResolvers } from "@reconjs/utils"
import { Prac, Proc, Returns } from "./types"
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
  iter: Generator <Regenerator, any>,
  scope: symbol,
  viewId: string,
  dispatcher: ReactDispatcher,
  stack: ReconStackState[],
}

type ReconDataState = {
  proc: Func,
  args: any[],
  iter?: Generator <Regenerator, any>,
  promise?: Promise <any>,
  value?: any,
  error?: any,
}

type ReconState = {
  entrypoints: ReconEntrypoint[],
  errors: any[],
  renders: ReconRendered[],
  prerendering?: ReconPrerenderingState,
  data: ReconDataState[],
}

const INITIAL_STATE: ReconState = {
  entrypoints: [],
  errors: [],
  renders: [],
  // stack: [],
  data: [],
}

class ReconTask {}

const NEVER = {} as any

export class Regenerator <T = any> {
  #returns = NEVER as T;
  #throws = NEVER;
  
  #async: {
    promise: Promise <T>,
    resolve: (value: T) => void,
    reject: (error: any) => void,
  }
  
  get promise () {
    return this.#async.promise
  }
  
  constructor () {
    this.#async = {} as any
    this.#async.promise = new Promise <T> ((resolve, reject) => {
      this.#async.resolve = resolve
      this.#async.reject = reject
    })
  }

  *[Symbol.iterator](): Iterator <Regenerator, T> {
    while (true) {
      if (this.#throws !== NEVER) throw this.#throws
      if (this.#returns !== NEVER) return this.#returns
      yield this
    }
  }

  return (that: T) {
    this.#returns = that
    this.#async.resolve (that)
  }

  throw (that: any) {
    this.#throws = that
    this.#async.reject (that)
  }

  next (): { done: boolean, value: T|Regenerator } {
    if (this.#throws) throw this.#throws
    if (this.#returns) return {
      done: true,
      value: this.#returns
    }

    return {
      done: false,
      value: this
    }
  }
}



class Recon <T> extends Regenerator<T> {  
  constructor (
    public proc: Prac|Proc, 
    public args: any[],
  ) {
    super ()
  }
}

const NIL = doo (() => {
  const recon = new Recon (function* () {}, [])
  recon.return (undefined)
  return recon
})



type Reducer <S, T> = (state: S, task?: T) => S

function initManager (reducer: Reducer <ReconState, ReconTask>) {
  let state = { ...INITIAL_STATE }
  
  let handler: Vunc<[ ReconTask ]>|undefined
  
  return function perform (task?: ReconTask) {
    if (task !== undefined) {
      const isTask = task instanceof ReconTask
      if (!isTask) throw new Error ("[perform] Invalid task")
      
      if (handler) {
        handler (task)
        return
      }
    }
    
    const queue = [] as ReconTask[]
    handler = (child) => {
      console.warn("QUEUEING TASK", { child, parent: task })
      queue.push (child)
    }
    
    try {
      /* Not correct...
      if (! (task instanceof ReconTask)) {
        throw new Error ("[initManager] Invalid task")
      }
      */
      
      const next = reducer (state, task)
      if (next !== state) state = { ...next }
      else if (queue.length === 0) return // stability achieved
    }
    catch (error) {
      state = {
        ...state,
        errors: [...state.errors, error ]
      }
    }
    finally {
      handler = undefined
    }
    
    for (let i = 0; i < 100; i++) {
      if (i > 90) throw new Error ("Too much queueing")
      const task = queue.shift()
      if (!task) break
      perform (task)
    }
    
    if (task) perform()
  }
}



// TASKS:

class NonTask extends ReconTask {}

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

class CallTask extends ReconTask {
  returns?: Recon <any>
  
  constructor (public props: {
    proc: Proc,
    args: any[],
  }) {
    super ()
  }
}

class RenderTask extends ReconTask {
  iter!: Generator <Regenerator, any>
  
  constructor (public props: {
    scope: symbol,
    viewId: string,
    proc: Proc,
    args: any[],
  }) {
    super ()
  }
}

class YieldTask extends ReconTask {
  promise?: Promise <any>
  
  constructor (public props: {
    viewId?: string,
    effect: Regenerator,
  }) {
    super ()
  }
}

class HookTask extends ReconTask {
  run!: Func
  
  constructor (public props: {
    hook: string,
    args: any[],
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



function createDispatcher() {
  const dispatcher = {} as Record<string, any>

  const hooks = [
    "_use",
    // "use$",
    "use",
    "useState",
  ]

  for (const hook of hooks) {
    dispatcher[hook] = (...args: any[]) => {
      const task = new HookTask({ hook, args })
      perform (task)
      if (!task.run) {
        throw new Error(`task.run is not defined (hook: ${hook})`)
      }
      return task.run()
    }
  }

  return dispatcher as ReconDispatcher
}



// PERFORM

const perform = initManager ((state, task) => {
  if (task instanceof NonTask) return state
  
  if (task instanceof RenderTask) {
    const { args, proc, scope, viewId } = task.props
    
    const dispatcher = Dispatcher.current
    if (!dispatcher) throw new Error ("Expected dispatcher")
    
    if (state.prerendering) throw new Error ("Expected no prerendering")
    
    const err = state.errors[0]
    task.iter = doo (function* prerender () {
      if (err) throw err
      yield NIL
      return yield* proc (...args)
    })
    
    state = {
      ...state,
      prerendering: {
        dispatcher,
        proc,
        args,
        scope,
        viewId,
        iter: task.iter,
        stack: [],
      },
    }
    
    Dispatcher.current = createDispatcher()
    return state
  }
  
  
  if (task instanceof PrerenderedTask) {
    const { prerendering, ...nextState } = state
        
    if (prerendering) {
      if (prerendering.stack.length > 0) {
        throw new Error ("[PrerenderedTask] stack must be emptied")
      }
      
      Dispatcher.current = prerendering.dispatcher
    }
    
    return nextState as ReconState
  }
  
  
  if (task instanceof CallTask) {
    throw new Error ("[perform] CallTask not implemented")
  }
  
  
  if (task instanceof HookTask) {
    const { hook, args } = task.props
    
    const HANDLERS: Record <string, any> = {
      useState: () => {
        return () => {
          throw new Error("[useState] Unsupported")
        }
        
        const [init] = args
        const hookState = typeof init === "function"
          ? init()
          : init
        
        function setHookState() {
          console.log ("[setHookState] called")
        }
        
        // TODO: Start tracking state...

        return () => {
          return [hookState, setHookState]
        }
      }
    }
    
    const handler = HANDLERS[hook]
    if (handler) {
      task.run = handler()
      return state
    }
    
    
    if (hook === "_use") {
      const [ factory ] = args
      task.run = () => factory()
      
      // TODO: Preserve state
      return state
    }
    if (hook === "use$") {
      throw new Error ("use$ isn't in the dispatcher")
    }
    if (hook === "use") {
      if (args[0] === Recontext) {
        task.run = () => {
          return ROOT
        }
      }
      else {
        task.run = () => {
          throw new Error ("[use] Unsupported")
        }
      }
      return state
    }
    
    throw new Error (`[HookTask] Unsupported hook: ${hook}`)
  }
  
  
  if (task instanceof FinishedTask) {
    const { proc, args } = task.props
    
    function isDataEqual (alpha: any) {
      if (alpha.proc !== proc) return false
      if (alpha.args.length !== args.length) return false
      for (let i = 0; i < alpha.args.length; i++) {
        if (alpha.args[i] !== args[i]) return false
      }
      return true
    }
    
    const data = state.data.map (x => {
      if (isDataEqual (x)) {
        return {
          ...x,
          value: task.props.value,
          error: task.props.error,
          promise: undefined,
        }
      }
      return x
    })
    
    return { ...state, data }
  }
  
  
  if (task instanceof YieldTask) {
    const { effect } = task.props
    
    if (effect === NIL) return state
    if (effect instanceof Recon) {
      const { proc, args } = effect
      
      function isDataEqual (alpha: any) {
        if (alpha.proc !== proc) return false
        if (alpha.args.length !== args.length) return false
        for (let i = 0; i < alpha.args.length; i++) {
          if (alpha.args[i] !== args[i]) return false
        }
        return true
      }
      
      function createSync (proc: Proc): ReconDataState {
        console.log ("[createSync] called")
        const iter = doo (function* () {
          try {
            yield NIL
            return yield* proc (...args)
          }
          finally {
            perform (new NonTask ())
          }
        })

        return {
          proc, 
          args, 
          iter,
          promise: undefined,
        }
      }
      
      function createAsync (proc: Prac): ReconDataState {
        console.log ("[createAsync] called")
        const loader = doo (async function* () {
          // yield Regenerator.nil()
          return yield* proc (...args)
        })
        
        const promise = doo (async () => {
          try {
            for (const _ of loop("createAsync")) {
              const { done, value } = await loader.next()
              if (done) {
                // TODO: Loaded
                perform (new FinishedTask ({ proc, args, value }))
                return
              }
              
              console.log ("--- YIELDED:", { done, value })
              throw new Error ("No yielding...")
            }
          }
          catch (error) {
            perform (new FinishedTask ({ proc, args, error }))
          }
        })
        
        return {
          proc,
          args,
          promise,
        }
      }
      
      const data = state.data.find (isDataEqual) ?? doo (() => {
        console.log ("Creating data...")
        
        const newData = proc instanceof AsyncGeneratorFunction
          ? createAsync (proc as any)
          : createSync (proc as any)
        
        state = {
          ...state,
          data: [
            ...state.data,
            newData,
          ]
        }
        
        return newData
      })
      
      if (data.promise) {
        task.promise = data.promise
        return state
      }
      
      if (!data.iter) {
        console.log ("effect.return")
        
        if (data.error) effect.throw(data.error)
        else effect.return(data.value)
        
        return state
      }
      
      for (const _ of loop ("YieldTask")) {
        const { done, value } = data.iter.next()
        console.log ("YieldTask", { done, value })
        if (done) {
          console.log ("effect.return")
          effect.return (value)
          return state
        }
        if (value === NIL) continue
        
        // TODO: What if it's yielding itself?
        if (value === (data.iter as any)) {
          console.warn ("Recursively yielding itself?")
          return state
        }
        if (value instanceof Regenerator) {
          perform (new YieldTask ({ effect: value }))
          return state
        }
      }
      
      throw new Error ("Unhandled YieldTask")
    }
  }
  
  if (task) console.error ("UNHANLED TASK", task)
  return state
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
    const task = new CallTask({ proc, args })
    perform(task)
    if (!task.returns) throw new Error("NO RETURNS?!")
    return task.returns
  }

  const { use$ } = dispatcher
  // @ts-ignore
  if (use$) return use$ (proc, ...args)

  // TODO: SSR
  // @ts-ignore
  if (!WINDOW) return Fragment

  const scope = use (Recontext)

  // eslint-disable-next-line
  return _use(() => {
    function ReconView (props: any) {
      const viewId = useId()
      return useRecon (props, new RenderTask ({
        viewId,
        scope,
        proc,
        args,
      }))
    }
    
    return memo (ReconView as FunctionComponent)
  })
}



function useRecon (props: any, task: RenderTask) {
  const { viewId } = task.props
  const { use } = Dispatcher.current ?? {}
  if (!use) throw new Error ("use not found")
  
  perform (task)
  
  try {
    let render
    
    if (!task.iter) throw new Error ("[useRecon] no iter")
    const iter = task.iter
    
    for (const _ of loop ("useRecon")) {
      const { done, value } = iter.next()
      console.log ("useRecon", { done, value })
      if (done) {
        render = value
        break
      }
      
      if (value === NIL) continue
      if (value instanceof Regenerator) {
        const task = new YieldTask ({ viewId, effect: value })
        perform (task)
        
        if (task.promise) {
          use (task.promise)
          console.warn ("use did not suspend...")
          throw task.promise
        }
        // TODO: useTask (task)
      }
      else {
        console.log ("[wtf]", value)
        throw new Error ("wtf?")
      }
      
      perform (new PrerenderedTask())
    }
    
    const doneTask = new PrerenderedTask()
    perform (doneTask)
    
    const element = render (props)
    
    const { context } = doneTask
    if (!context) return element
    
    return (
      <Recontext value={context}>
        {element}
      </Recontext>
    )
  }
  finally {
    perform (new PrerenderedTask())
  }
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
