import { Func, Func0, range, Vunc } from "@reconjs/utils"
import React, { DependencyList, FunctionComponent, memo, MemoExoticComponent, Usable } from "react"
import { CallEffect, Effect } from "../effect"
import { defineStore } from "./store"
import { AsyncGeneratorFunction, GeneratorFunction, Prac, Proc, Returns } from "../types"
import { AnyView, View } from "../use-view"
import { Atom } from "../atomic"

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



// HOOKS

export type ReactHooks = {
  useActionState: (action: Func, init: any) => [ any, Vunc <[ any ]> ],
  useDebugValue: (value: any) => void,
  useDeferredValue: <T>(value: T) => T,
  useCallback: <T>(factory: Func0, deps: any[]) => T,
  useContext: <T>(ctx: React.Context <T>) => T,
  useEffect: (effect: Func0, deps: any[]) => void,
  useId: () => string,
  useImperativeHandle: (ref: any, factory: () => any, deps: any[]) => void,
  useInsertionEffect: (effect: Func0, deps: any[]) => void,
  useLayoutEffect: (effect: Func0, deps: any[]) => void,
  useMemo: <T>(factory: Func0, deps: any[]) => T,
  useOptimistic: (state: any, update: Func) => void,
  useReducer: (reducer: Vunc <[ any, any ]>, init: any) => [ any, Vunc <[ any, any ]> ],
  useRef: (init: any) => { current: any },
  useState: (init: any) => [ any, Vunc ],
  useSyncExternalStore: (store: any) => void,
  useTransition: () => [ boolean, Vunc ],
  use: {
    (ctx: React.Context <any>): any
    (promise: Promise <any>): any
  },
}

type ReconHooks = {
  _use: (func: Func) => any,
  useAtomic: (func: Func, ...args: any[]) => Atom <any>,
  useView: (render: Func) => AnyView,
}

export type ReactDispatcher = ReactHooks & Partial <ReconHooks>

export type ReconDispatcher = ReactHooks & ReconHooks & {
  <T>(factory: () => T): T
}

const REDISPATCHER = {} as ReconDispatcher



// REACT INTERNALS

const COMPONENT_TYPE = doo (() => {
  const UNRENDERED = memo (() => null)
  return UNRENDERED.$$typeof
})

// @ts-ignore
const internals = React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE
if (!internals) {
  // console.log (Object.keys (React))
  throw new Error ("INTERNALS NOT FOUND")
}

export const Dispatcher = {
  get current (): ReactDispatcher|null {
    return internals.H
  },
  set current (dispatcher: ReactDispatcher|null) {
    internals.H = dispatcher
  }
}







// STORE STATE/TYPES

class Bunch <T> {
  constructor (private items: T[] = []) {}

  find (predicate: (item: T) => boolean) {
    return this.items.find (predicate)
  }

  with (item: T): Bunch <T> {
    return new Bunch ([
      ...this.items,
      item,
    ])
  }

  without (predicate: (item: T) => boolean): Bunch <T> {
    const items = this.items.filter ((item) => !predicate (item))
    return new Bunch (items)
  }
}

const EMPTY = new Bunch <any> ([])

type StateSelf = {
  atoms: Bunch <AtomInfo>,
  datas: Bunch <DataInfo>,
  procs: Bunch <ProcInfo>,
  tasks: Bunch <TaskInfo>,
  errors: Bunch <Error>,
}

class StateInfo <S extends StateSelf = StateSelf> {
  constructor (protected readonly self: S) {}

  build (self: S) {
    return new StateInfo <S> (self)
  }

  push (id: symbol) {
    const dispatcher = Dispatcher.current ?? null
    Dispatcher.current = REDISPATCHER

    return new ActiveState ({
      ...this.self,
      dispatcher,
      stack: [ id ],
    })
  }

  edgeOf (atom: Atom <any>) {
    const info = this.findAtom ((x) => x.atom === atom)
    if (!info) throw new Error ("[edgeOf] atom not found")
    return info.edge
  }

  findAtom (predicate: (atom: AtomInfo) => boolean) {
    return this.self.atoms.find (predicate)
  }

  findData (predicate: (data: DataInfo) => boolean) {
    return this.self.datas.find (predicate)
  }

  findProc (predicate: (proc: ProcInfo) => boolean) {
    return this.self.procs.find (predicate)
  }

  findTask (predicate: (task: TaskInfo) => boolean) {
    return this.self.tasks.find (predicate)
  }

  withAtom (atom: AtomInfo) {
    return this.build ({
      ...this.self,
      atoms: this.self.atoms.with (atom),
    })
  }

  withoutAtom (predicate: (atom: AtomInfo) => boolean) {
    return this.build ({
      ...this.self,
      atoms: this.self.atoms.without (predicate),
    })
  }

  withData (data: DataInfo) {
    return this.build ({
      ...this.self,
      datas: this.self.datas.with (data),
    })
  }

  withoutData (predicate: (data: DataInfo) => boolean) {
    return this.build ({
      ...this.self,
      datas: this.self.datas.without (predicate),
    })
  }

  withProc (proc: ProcInfo) {
    return this.build ({
      ...this.self,
      procs: this.self.procs.with (proc),
    })
  }

  withoutProc (predicate: (proc: ProcInfo) => boolean) {
    return this.build ({
      ...this.self,
      procs: this.self.procs.without (predicate),
    })
  }

  withTask (task: TaskInfo) {
    const found = this.self.tasks
      .find ((x) => x.edge.equals (task.edge))
    if (found) return this

    return this.build ({
      ...this.self,
      tasks: this.self.tasks.with (task),
    })
  }

  withoutTask (predicate: (task: TaskInfo) => boolean) {
    return this.build ({
      ...this.self,
      tasks: this.self.tasks.without (predicate),
    })
  }

  withError (error: Error) {
    return this.build ({
      ...this.self,
      errors: this.self.errors.with (error),
    })
  }
}

const INIT_STATE = new StateInfo ({
  atoms: EMPTY,
  datas: EMPTY,
  procs: EMPTY,
  tasks: EMPTY,
  errors: EMPTY,
})



type ActiveSelf = StateSelf & {
  stack: symbol[],
  dispatcher: ReactDispatcher|null,
}

class ActiveState extends StateInfo <ActiveSelf>  {
  constructor (self: ActiveSelf) {
    super (self)
  }

  get dispatcher() {
    return this.self.dispatcher
  }

  build (self: ActiveSelf) {
    return new ActiveState ({
      ...this.self,
      ...self,
    })
  }

  peek() {
    const id = this.self.stack[0]
    const task = this.findTask ((task) => task.id === id)
    if (!task) throw new Error ("[reduceStatus] task not found")
    return task
  }

  push (id: symbol) {
    return this.build ({
      ...this.self,
      stack: [
        id,
        ...this.self.stack,
      ],
    })
  }

  pop() {
    let { stack, dispatcher, ...self } = this.self

    stack = stack.slice (1)

    if (stack.length <= 1) {
      Dispatcher.current = dispatcher
      return new StateInfo (self)
    }

    return this.build ({
      ...self,
      stack,
      dispatcher,
    })
  }
}



// STORE DEFINITION

export class InviewStartEffect extends Effect <void> {}
export class InviewEndEffect extends Effect <void> {}


const _extendStore = defineStore (INIT_STATE, (state, effect): StateInfo => {
  if (! (state instanceof StateInfo)) {
    throw new Error ("NOT STATE INFO")
  }
  
  if (effect instanceof InviewEndEffect) {
    return state

    const { inview, ..._state } = state
    if (!inview) throw new Error ("[InviewEndEffect] No inview")
    Dispatcher.current = inview.dispatcher
    return _state
  }

  if (effect instanceof InviewStartEffect) {
    return state

    if (state.inview) throw new Error ("[InviewStartEffect] inview")
    if (state.prerendering) throw new Error ("[InviewStartEffect] prerendering")

    const dispatcher = Dispatcher.current
    if (!dispatcher) {
      throw new Error ("[InviewStartEffect] No dispatcher")
    }

    return {
      ...state,
      inview: {
        dispatcher
      },
    }
  }

  if (effect instanceof EntrypointEffect) {
    return reduceEntrypoint (state, effect)
  }

  if (effect instanceof AtomEffect) {
    return reduceAtom (state, effect)
  }

  if (effect instanceof StatusEffect) {
    return reduceStatus (state, effect)
  }
  
  console.error ("Unknown effect:", effect)
  throw new Error ("[defineStore] Unknown effect")
})

export function extendStore (...args: Parameters <typeof _extendStore>) {
  return _extendStore (...args)
}

/**
 * Catch-all for unhandled side effects...
 */
export const handleEffect = extendStore (function* (effect: Effect) {
  if (effect instanceof CallEffect) {
    throw new Error ("No more CallEffect")
    // handleCall (effect)
  }
  else {
    yield* effect
  }
})


// #region Atomic Functions

abstract class StepInfo {
  id = Symbol()
}

class ProcInfo {
  constructor (
    public readonly func: Func
  ) {}
}

class ValueProc extends ProcInfo {
  constructor (func: Func) {
    super (func)
  }
}

class AsyncProc extends ProcInfo {
  constructor (func: Func) {
    super (func)
  }
}

// #endregion

// #region Params

/*
 * lazily, broadly resolvable
 */
abstract class ArgInfo {
  abstract equals (other: ArgInfo): boolean
}

class AtomArg extends ArgInfo {
  constructor (
    public readonly scope: symbol,
    public readonly func: Func,
    public readonly args: ArgInfo[],
  ) {
    super()
  }

  equals (other: ArgInfo) {
    if (! (other instanceof AtomArg)) return false
    if (this.scope !== other.scope) return false
    if (this.func !== other.func) return false
    if (this.args.length !== other.args.length) return false
    for (const i of range (this.args.length)) {
      if (!this.args[i].equals (other.args[i])) return false
    }
    return true
  }
}

/**
 * eagerly, specificly resolvable
 */
abstract class ParamInfo extends ArgInfo {}

class AtomParam extends ParamInfo {
  constructor (
    public readonly scope: symbol,
    public readonly func: Func,
    public readonly args: ParamInfo[],
  ) {
    super()
  }

  equals (other: ArgInfo) {
    if (! (other instanceof AtomParam)) return false
    if (this.scope !== other.scope) return false
    if (this.func !== other.func) return false
    if (this.args.length !== other.args.length) return false
    for (const i of range (this.args.length)) {
      if (!this.args[i].equals (other.args[i])) return false
    }
    return true
  }
}

class ValueParam extends ParamInfo {
  constructor (
    public readonly value: any,
  ) {
    super()
  }

  equals (other: ArgInfo) {
    if (! (other instanceof ValueParam)) return false
    return this.value === other.value
  }
}

class EdgeInfo {
  constructor (
    public readonly scope: symbol,
    public readonly func: Func,
    public readonly args: ArgInfo[],
  ) {
    const isValid = args.every ((arg) => arg instanceof ArgInfo)
    if (!isValid) {
      console.log ("[EdgeInfo]", scope, func, args)
      throw new Error ("[EdgeInfo] invalid args")
    }
  }

  equals (other: EdgeInfo) {
    if (this.scope !== other.scope) return false
    if (this.func !== other.func) return false
    if (this.args.length !== other.args.length) return false

    for (const i of range (this.args.length)) {
      if (!this.args[i].equals (other.args[i])) return false
    }
    return true
  }
}

class CleanEdge extends EdgeInfo {
  constructor (
    scope: symbol,
    func: Func,
    args: ParamInfo[],
  ) {
    super (scope, func, args)
  }
}

// #endregion

class DataInfo {
  constructor (
    public readonly edge: CleanEdge,
    public readonly status: Status,
  ) {}
}

// #region Tasks

class TaskInfo {
  id = Symbol()

  constructor (
    public readonly edge: EdgeInfo,
  ) {}
}

class RenderTask extends TaskInfo {
  constructor (
    edge: EdgeInfo,
    public readonly view: string,
  ) {
    super (edge)
  }
}

// #endregion

class AtomInfo {
  atom = createAtom()

  constructor (
    public readonly edge: EdgeInfo,
  ) {}
}

// #region Atoms

/**
 * Pending
 */
abstract class Status {}

class Pending extends Status {
  constructor (
    public readonly promise: Promise <void>
  ) {
    super()
  }
}

class Fulfilled extends Status {
  constructor (
    public readonly value: any
  ) {
    super()
  }
}

class Rejected extends Status {
  constructor (
    public readonly reason: any
  ) {
    super()
  }
}

class AtomEffect extends Effect <Status> {
  constructor (
    public readonly atom: Atom <any>
  ) {
    super()
  }
}

class StatusEffect extends Effect <void> {
  constructor (
    public readonly status: Status
  ) {
    super()
  }
}

const performLoadingOf = extendStore (async function* (atom: Atom <any>) {
  const status = yield* new AtomEffect (atom)

  if (status instanceof Fulfilled) return
  if (status instanceof Rejected) throw status.reason
  if (status instanceof Pending) await status.promise
  else {
    console.error ("[performLoadingOf] unknown status", status)
    throw new Error ("[performLoadingOf] unknown status")
  }
})

const handleStatusOf = extendStore (function* (atom: Atom <any>) {
  const status = yield* new AtomEffect (atom)

  if (status instanceof Fulfilled) return "fulfilled"
  if (status instanceof Rejected) return "rejected"
  if (status instanceof Status) return "pending"

  throw new Error ("no status")
})

const handleReasonOf = extendStore (function* (atom: Atom <any>) {
  const status = yield* new AtomEffect (atom)
  if (status instanceof Rejected) return status.reason
  throw new Error ("Atom was not rejected")
})

const handleValueOf = extendStore (function* (atom: Atom <any>) {
  const status = yield* new AtomEffect (atom)
  if (status instanceof Fulfilled) return status.value
  throw new Error ("Atom was not fulfilled")
})

function createAtom() {
  const atom: any = doo (async () => {
    await Promise.resolve()

    try {
      await performLoadingOf (atom)
    }
    catch (err) {
      console.error (err)
    }
  })

  atom[Symbol.iterator] = function* () {
    return yield* new AtomEffect (atom)
  }

  Object.defineProperties (atom, {
    status: {
      get() {
        return handleStatusOf (atom)
      },
      set (_) {
        // noop
      }
    },
    reason: {
      get() {
        return handleReasonOf (atom)
      },
      set (_) {
        // noop
      }
    },
    value: {
      get() {
        return handleValueOf (atom)
      },
      set (_) {
        // noop
      }
    },
  })

  return atom
}

function reduceStatus (state: StateInfo, { status }: StatusEffect) {
  if (! (state instanceof ActiveState)) {
    throw new Error ("[reduceStatus] state not active")
  }

  // TODO: This is not going to be true when we need to load args...
  const { id, edge } = state.peek()
  const res = state
    .pop()
    .withoutTask ((x) => x.id === id)
    .withData (new DataInfo (edge, status))
  return res
}

const performUpdate = extendStore (async function* (atom: Atom <any>, promise: Promise <any>) {
  const status = await doo (async () => {
    try {
      const value = await promise
      return new Fulfilled (value)
    }
    catch (thrown) {
      return new Rejected (thrown)
    }
  })

  yield new AtomEffect (atom)
  yield new StatusEffect (status)
})

function reduceAtomAux (effect: AtomEffect, edge: EdgeInfo) {
  const { func, args } = edge

  effect.yield (function* () {
    try {
      let result: any
      if (func instanceof GeneratorFunction) {
        // TODO: Intercept effects?
        result = yield* func (...args)
      }
      else {
        result = func (...args)
      }

      if (! (result instanceof Promise)) {
        yield new StatusEffect (new Fulfilled (result))
      }
      else {
        const promise = performUpdate (effect.atom, result)
        yield new StatusEffect (new Pending (promise))
      }
    }
    catch (thrown) {
      if (thrown instanceof Promise) {
        // yield new SuspenseEffect()
      }
      yield new StatusEffect (new Rejected (thrown))
    }
  })
}

function reduceAtom (state: StateInfo, effect: AtomEffect) {
  console.log ("[reduceAtom]")

  const edge = state.edgeOf (effect.atom)
  const data = state.findData (x => x.edge.equals (edge))

  if (data) {
    effect.return (data.status)
    return state
  }

  const task = state.findTask (x => x.edge.equals (edge))
  if (!task) {
    console.log ("[reduceAtom]", state)
    throw new Error ("[reduceAtom] task not found")
  }

  reduceAtomAux (effect, edge)
  return state.push (task.id)
}

// #endregion

// #region Entrypoints

class EntryAtomInfo extends AtomInfo {
  constructor (
    edge: EdgeInfo,
    public readonly id: string,
  ) {
    super (edge)
  }
}

class EntrypointEffect extends Effect <Atom <any>> {
  constructor (
    public readonly id: string,
    public readonly edge: EdgeInfo,
  ) {
    super ()
  }
}

export const performEntrypoint = extendStore (function* (
  id: string,
  scope: symbol,
  func: Func,
  ...args: any[]
) {
  const infos = args
    .map (value => new ValueParam (value))
  const edge = new EdgeInfo (scope, func, infos)
  return yield* new EntrypointEffect (id, edge)
})

function reduceEntrypoint (
  state: StateInfo,
  effect: EntrypointEffect
): StateInfo {
  const info = new EntryAtomInfo (effect.edge, effect.id)
  state = state.withAtom (info)
  effect.return (info.atom)

  const data = state.findData ((data) => {
    return data.edge.equals (effect.edge)
  })

  if (data) return state
  return state.withTask (new TaskInfo (effect.edge))
}

// #endregion



// --- HOOKS ---

// #region _use

export class UsingEffect extends Effect <any> {
  constructor (
    public factory: Func0,
  ) {
    super()
  }
}

REDISPATCHER._use = extendStore (function* (factory: Func0) {
  return yield* new UsingEffect (factory)
})

const NEVER = {} as any

/**
 * A hook for a constant
 */
export function _use <T> (factory: () => T) {
  const dispatcher = Dispatcher.current
  if (!dispatcher) return factory()
  
  const { _use } = dispatcher
  if (_use) return _use (factory)
  
  const ref = dispatcher.useRef (NEVER) // eslint-disable-line

  if (ref.current === NEVER) {
    ref.current = factory()
  }

  return ref.current as T
}

// #endregion _use




// #region Recon Hooks

export class UseAtomicEffect extends Effect <Atom <any>> {
  constructor (
    public func: Func,
    public args: any[],
  ) {
    super()
  }
}

REDISPATCHER.useAtomic = extendStore (function* (func: Func, ...args: any[]) {
  return yield* new UseAtomicEffect (func, args)
})



export class UseViewEffect extends Effect <MemoExoticComponent <any>> {
  constructor (
    public render: Func,
  ) {
    super()
  }
}

REDISPATCHER.useView = extendStore (function* (render: Func) {
  return yield* new UseViewEffect (render)
})

// #endregion



export class UseEffect extends Effect <any> {
  constructor (
    public usable: any,
  ) {
    super()
  }
}

REDISPATCHER.use = extendStore (function* (usable: any) {
  return yield* new UseEffect (usable)
})



// #region React Hooks

export class UseStateEffect extends Effect <[ any, Func ]> {
  constructor (
    public init: any,
  ) {
    super()
  }
}

REDISPATCHER.useState = extendStore (function* (init: any) {
  return yield* new UseStateEffect (init)
})



export class UseIdEffect extends Effect <string> {}

REDISPATCHER.useId = extendStore (function* () {
  return yield* new UseIdEffect ()
})



export class UseMemoEffect extends Effect <any> {
  constructor (
    public factory: any,
    public deps: DependencyList,
  ) {
    super()
  }
}

REDISPATCHER.useMemo = extendStore (function* (factory: any, deps: DependencyList) {
  return yield* new UseMemoEffect (factory, deps)
})



export class UseEffectEffect extends Effect <void> {
  constructor (
    public effect: any,
    public deps: DependencyList,
  ) {
    super()
  }
}

REDISPATCHER.useEffect = extendStore (function* (effect: any, deps: DependencyList) {
  return yield* new UseEffectEffect (effect, deps)
})



export class UseLayoutEffectEffect extends Effect <void> {
  constructor (
    public effect: any,
    public deps: DependencyList,
  ) {
    super()
  }
}

REDISPATCHER.useLayoutEffect = extendStore (function* (effect: any, deps: DependencyList) {
  return yield* new UseLayoutEffectEffect (effect, deps)
})



export class UseRefEffect extends Effect <any> {
  constructor (
    public current: any,
  ) {
    super()
  }
}

REDISPATCHER.useRef = extendStore (function* (current: any) {
  return yield* new UseRefEffect (current)
})



export class UseContextEffect extends Effect <any> {
  constructor (
    public context: any,
  ) {
    super()
  }
}

REDISPATCHER.useContext = extendStore (function* (context: any) {
  return yield* new UseContextEffect (context)
})



export class UseReducerEffect extends Effect <[ any, Func ]> {
  constructor (
    public reducer: any,
    public init: any,
  ) {
    super()
  }
}

REDISPATCHER.useReducer = extendStore (function* (reducer: any, init: any) {
  return yield* new UseReducerEffect (reducer, init)
})



export class UseCallbackEffect extends Effect <any> {
  constructor (
    public callback: any,
    public deps: DependencyList,
  ) {
    super()
  }
}

REDISPATCHER.useCallback = extendStore (function* (callback: any, deps: DependencyList) {
  return yield* new UseCallbackEffect (callback, deps)
})


export class UseImperativeHandleEffect extends Effect <void> {
  constructor (
    public ref: any,
    public init: any,
    public deps: DependencyList,
  ) {
    super()
  }
}

REDISPATCHER.useImperativeHandle = extendStore (function* (ref: any, init: any, deps: DependencyList) {
  return yield* new UseImperativeHandleEffect (ref, init, deps)
})


export class UseDebugValueEffect extends Effect <void> {
  constructor (
    public value: any,
  ) {
    super()
  }
}

REDISPATCHER.useDebugValue = extendStore (function* (value: any) {
  return yield* new UseDebugValueEffect (value)
})



export class UseDeferredValueEffect extends Effect <any> {
  constructor (
    public value: any,
    public init?: any,
  ) {
    super()
  }
}

REDISPATCHER.useDeferredValue = extendStore (function* (value: any, init?: any) {
  return yield* new UseDeferredValueEffect (value, init)
})



export class UseInsertionEffectEffect extends Effect <void> {
  constructor (
    public effect: any,
    public deps: DependencyList,
  ) {
    super()
  }
}

REDISPATCHER.useInsertionEffect = extendStore (function* (effect: any, deps: DependencyList) {
  return yield* new UseInsertionEffectEffect (effect, deps)
})



export class UseTransitionEffect extends Effect <[ boolean, Func0 ]> {}

REDISPATCHER.useTransition = extendStore (function* () {
  return yield* new UseTransitionEffect ()
})



export class UseOptimisticEffect extends Effect <void> {
  constructor (
    public state: any,
    public update: Func,
  ) {
    super()
  }
}

REDISPATCHER.useOptimistic = extendStore (function* (state: any, update: Func) {
  return yield* new UseOptimisticEffect (state, update)
})



export class UseSyncExternalStoreEffect extends Effect <void> {
  constructor (
    public store: any,
  ) {
    super()
  }
}

REDISPATCHER.useSyncExternalStore = extendStore (function* (store: any) {
  return yield* new UseSyncExternalStoreEffect (store)
})



export class UseActionStateEffect extends Effect <[ any, Vunc <[ any ]> ]> {
  constructor (
    public action: Func,
    public init: any,
  ) {
    super()
  }
}

REDISPATCHER.useActionState = extendStore (function* (action: Func, init: any) {
  return yield* new UseActionStateEffect (action, init)
})

// #endregion


