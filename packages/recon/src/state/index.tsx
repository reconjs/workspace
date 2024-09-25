import { createEvent, Func, Func0, guidBy, memoize, range, Subscribe, Vunc } from "@reconjs/utils"
import React, { DependencyList, memo, MemoExoticComponent, useEffect, useState } from "react"
import { CallEffect, Effect } from "../effect"
import { defineStore } from "./store"
import { GeneratorFunction } from "../types"
import { AnyView } from "../use-view"
import { Atom } from "../atomic"
import { faulty } from "./fault"
import { resyncAll } from "../resync"

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
  useUpdate: () => VoidFunction,
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
  console.log (Object.keys (React))
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

  log (label: string) {
    console.group (label)
    for (const item of this.items) {
      console.log (item)
    }
    console.groupEnd()
  }
}

function substate <T> (read: () => Bunch <T>) {
  function withBuild <S> (build: (bunch: Bunch <T>) => S) {
    return {
      get: (predicate: (item: T) => boolean) => {
        const bunch = read()
        const found = bunch.find (predicate)
        if (!found) throw new Error ("[get] not found")
        return found
      },
      find: (predicate: (item: T) => boolean) => {
        const bunch = read()
        return bunch.find (predicate)
      },
      with: (item: T) => {
        const bunch = read()
        return build (bunch.with (item))
      },
      without: (predicate: (item: T) => boolean) => {
        const bunch = read ()
        return build (bunch.without (predicate))
      },
    }
  }

  return {
    withBuild,
  }
}

const EMPTY = new Bunch <any> ([])

type StateSelf = {
  entries: Bunch <EntrypointInfo>,
  pointers: Bunch <PointerInfo>,
  nodes: Bunch <NodeInfo>,
  procs: Bunch <ProcInfo>,
  tasks: Bunch <TaskInfo>,
  errors: Bunch <Error>,
}

class StateInfo <S extends StateSelf = StateSelf> {
  constructor (protected readonly self: S) {}

  protected build (self: S) {
    return new StateInfo <S> (self)
  }

  push (id: symbol) {
    const dispatcher = Dispatcher.current ?? null
    Dispatcher.current = REDISPATCHER

    return new ActiveState ({
      ...this.self,
      dispatcher,
      stack: [ new CallInfo (id, 0) ],
    })
  }

  get entries() {
    return substate (() => this.self.entries)
      .withBuild ((entries) => this.build ({ ...this.self, entries }))
  }

  get pointers() {
    return substate (() => this.self.pointers)
      .withBuild ((pointers) => this.build ({ ...this.self, pointers }))
  }

  get nodes() {
    return substate (() => this.self.nodes)
      .withBuild ((nodes) => this.build ({ ...this.self, nodes }))
  }

  get procs() {
    return substate (() => this.self.procs)
      .withBuild ((procs) => this.build ({ ...this.self, procs }))
  }

  get tasks() {
    return substate (() => this.self.tasks)
      .withBuild ((tasks) => this.build ({ ...this.self, tasks }))
  }

  get errors() {
    return substate (() => this.self.errors)
      .withBuild ((errors) => this.build ({ ...this.self, errors }))
  }

  edgeOf (atom: Atom <any>) {
    const pointer = this.pointers.get ((x) => x.atom === atom)

    if (pointer instanceof EdgePointer) {
      return pointer.edge
    }
    else if (pointer instanceof EntryPointer) {
      const entry = this.entries.get ((x) => x.id === pointer.id)
      return entry.edge
    }
    else {
      throw new Error ("[edgeOf] unknown pointer")
    }
  }

  findNodeByStep (step: symbol) {
    return this.nodes.find ((node) => {
      return node.has (step)
    })
  }

  withNode (node: NodeInfo) {
    const found = this.self.nodes
      .find ((x) => x.edge.equals (node.edge))

    return this.build ({
      ...this.self,
      nodes: this.self.nodes
        .with (node)
        .without (x => x === found)
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

  log () {
    this.self.entries.log ("entries")
    this.self.pointers.log ("pointers")
    this.self.nodes.log ("nodes")
    this.self.procs.log ("procs")
    this.self.tasks.log ("tasks")
    this.self.errors.log ("errors")
  }

  validate() {}
}

const INIT_STATE = new StateInfo ({
  entries: EMPTY,
  pointers: EMPTY,
  nodes: EMPTY,
  procs: EMPTY,
  tasks: EMPTY,
  errors: EMPTY,
})

type List <T> = [ T, ...T[] ]

type ActiveSelf = StateSelf & {
  stack: List <CallInfo>
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

  get step() {
    const [{ step }] = this.self.stack
    return step
  }

  next() {
    const [ { task, step }, ...stack ] = this.self.stack

    return this.build ({
      ...this.self,
      stack: [
        new CallInfo (task, step + 1),
        ...stack,
      ]
    })
  }

  peek() {
    const [ call ] = this.self.stack
    
    const task = this.tasks.find ((task) => task.id === call.task)
    if (!task) throw new Error ("[peek] task not found")
    return task
  }

  push (id: symbol) {
    const found = this.self.stack.find (x => x.task === id)
    if (found) throw new Error ("[ActiveState] can't push")

    return this.build ({
      ...this.self,
      stack: [
        found ?? new CallInfo (id, 0),
        ...this.self.stack,
      ],
    })
  }

  pop() {
    const { stack, dispatcher, ...self } = this.self
    const [ _, ...nextStack ] = stack

    if (!nextStack.length) {
      Dispatcher.current = dispatcher
      return new StateInfo (self)
    }

    return this.build ({
      ...self,
      stack: nextStack as List <CallInfo>,
      dispatcher,
    })
  }

  log () {
    super.log()
    console.log ("stack", this.self.stack)
  }

  validate () {
    if (!this.self.dispatcher) {
      throw new Error ("[ActiveState] no dispatcher")
    }
    if (!this.self.stack.length) {
      throw new Error ("[ActiveState] no stack")
    }

    for (const { task } of this.self.stack) {
      if (!this.self.tasks.find (x => x.id === task)) {
        throw new Error ("[ActiveState] task (in stack) not found")
      }
    }
  }
}


// STORE DEFINITION

// #region Inline Views

export class InviewStartEffect extends Effect <void> {}
export class InviewEndEffect extends Effect <void> {}

function reduceInviewEnd (state: StateInfo, effect: InviewEndEffect) {
  const { inview, ..._state } = state
  if (!inview) throw new Error ("[InviewEndEffect] No inview")
  Dispatcher.current = inview.dispatcher
  return _state
}

function reduceInviewStart (state: StateInfo, effect: InviewStartEffect) {
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

// #endregion

function reduceActiveState (state: ActiveState, effect: Effect): StateInfo {
  if (effect instanceof UseAtomicEffect) {
    return reduceUseAtomic (state, effect)
  }
  else if (effect instanceof UseStepEffect) {
    return reduceUseStep (state, effect)
  }
  else if (effect instanceof UseUpdateEffect) {
    return reduceUseUpdate (state, effect)
  }

  console.error ("Unknown effect:", effect)
  throw new Error ("[reduceActiveState] Unknown effect")
}

function reduceState (state: StateInfo, effect: Effect): StateInfo {
  if (effect instanceof InviewEndEffect) {
    return state
    // return reduceInviewEnd (state, effect)
  }
  else if (effect instanceof InviewStartEffect) {
    return state
    // return reduceInviewStart (state, effect)
  }
  
  else if (effect instanceof EntrypointEffect) {
    return reduceEntrypoint (state, effect)
  }
  else if (effect instanceof AtomEffect) {
    return reduceAtom (state, effect)
  }
  else if (effect instanceof UpdateEffect) {
    return reduceUpdate (state, effect)
  }
  else if (effect instanceof AsyncUpdateEffect) {
    return reduceUpdateAsync (state, effect)
  }
  else if (effect instanceof RevalidateEffect) {
    return reduceRevalidate (state, effect)
  }
  else if (effect instanceof TaskEffect) {
    return reduceTask (state, effect)
  }
  else if (effect instanceof ForceUpdateEffect) {
    return reduceForceUpdate (state, effect)
  }
  else if (state instanceof ActiveState) {
    return reduceActiveState (state, effect)
  }

  console.error ("Unknown effect:", effect)
  throw new Error ("[reduceState] Unknown effect")
}

const _extendStore = defineStore (INIT_STATE, (state, effect): StateInfo => {
  if (! (state instanceof StateInfo)) {
    throw new Error ("NOT STATE INFO")
  }

  let nextState = state

  function dump (msg: string) {
    console.error (msg)

    console.group ("Prev State")
    state.log()
    console.groupEnd()

    if (nextState !== state) {
      console.group ("Next State")
      nextState.log()
      console.groupEnd()
    }
  }

  console.group ("extendStore")
  
  try {
    console.log ("active:", state instanceof ActiveState)
    console.log ("effect:", effect)

    try {
      nextState = reduceState (state, effect)
    }
    catch (err) {
      dump ("error while reducing")
      throw err
    }

    try {
      nextState.validate()
    }
    catch (err) {
      dump ("error while validating")
      throw err
    }

    return nextState
  }
  finally {
    console.groupEnd()
  }
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
    return yield* effect
  }
})

export const handleEffectAsync = extendStore (async function* (effect: Effect) {
  return yield* effect
})


// #region Atomic Functions

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

// #region Steps
// for storing info within a node

abstract class StepInfo {}

class ValueStep extends StepInfo {
  constructor (
    public readonly current: any,
  ) {
    super()
  }
}

class UpdateStep extends StepInfo {
  readonly id = Symbol(`step:${guidBy({})}`)

  constructor () {
    super()
  }
}

// #endregion

// #region Nodes

abstract class NodeInfo {
  abstract edge: EdgeInfo
  protected abstract steps: StepInfo[]

  abstract withStatus (status: Status): CleanNode

  has (step: symbol) {
    return this.steps.some ((x) => x instanceof UpdateStep && x.id === step)
  }
}

class DirtyNode extends NodeInfo {
  constructor (
    public readonly edge: EdgeInfo,
    protected readonly steps: StepInfo[],
  ) {
    super()
  }

  withStep <T extends StateInfo> (state: T, step: StepInfo): T {
    const nextState = state
      .nodes.without (x => x === this)
      .withNode (new DirtyNode (this.edge, [
        ...this.steps,
        step,
      ]))

    return nextState as T
  }

  withStatus (status: Status) {
    if (! (this.edge instanceof CleanEdge)) {
      throw new Error ("[DirtyNode::withStatus] not a clean edge")
    }

    return new CleanNode (this.edge, status, this.steps)
  }
}

class CleanNode extends NodeInfo {
  constructor (
    public readonly edge: CleanEdge,
    public readonly status: Status,
    protected readonly steps: StepInfo[],
  ) {
    super()
  }

  step (index: number) {
    const step = this.steps.find ((_, i) => i === index)
    if (!step) throw new Error ("[step] not found")
    return step
  }

  withStatus (status: Status) {
    return new CleanNode (this.edge, status, this.steps)
  }
}

// #endregion

class ViewInfo {
  constructor (
    public readonly id: string,
    public readonly edge: CleanEdge,
  ) {}
}

// #region Tasks

class CallInfo {
  constructor (
    public readonly task: symbol,
    public readonly step: number,
  ) {}
}

class TaskInfo {
  id = Symbol(`task:${guidBy({})}`)

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

class TaskEffect extends Effect <void> {
  constructor (
    public readonly id: symbol,
  ) {
    super()
  }
}

function reduceTask (state: StateInfo, effect: TaskEffect) {
  effect.return()
  return state.push (effect.id)
}

// #endregion

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

class UpdateEffect extends Effect <void> {
  constructor (
    public readonly status: Status
  ) {
    super()
  }
}

class AsyncUpdateEffect extends Effect <void> {
  constructor (
    public readonly status: Status,
    public readonly edge: EdgeInfo,
  ) {
    super()
  }
}

const performLoadingOf = extendStore (async function* (atom: Atom <any>) {
  console.group ("performLoadingOf")

  try {
    // await Promise.resolve()
    for (const _ of loop ("performLoadingOf")) {
      console.log ("it's loading time...")
      const status = yield* new AtomEffect (atom)

      if (status instanceof Fulfilled) return
      if (status instanceof Rejected) throw status.reason
      if (status instanceof Pending) await status.promise
      else {
        console.error ("[performLoadingOf] unknown status", status)
        throw new Error ("[performLoadingOf] unknown status")
      }
    }
  }
  finally {
    console.groupEnd()
  }
})

const handleStatusOf = extendStore (function* (atom: Atom <any>) {
  console.log ("handleStatusOf")
  const status = yield* new AtomEffect (atom)

  if (status instanceof Fulfilled) return "fulfilled"
  if (status instanceof Rejected) return "rejected"
  if (status instanceof Status) return "pending"

  throw new Error ("no status")
})

const handleReasonOf = extendStore (function* (atom: Atom <any>) {
  console.log ("handleReasonOf")
  const status = yield* new AtomEffect (atom)

  if (status instanceof Rejected) return status.reason
  throw new Error ("Atom was not rejected")
})

const handleValueOf = extendStore (function* (atom: Atom <any>) {
  console.log ("handleValueOf")
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
      faulty.catch (err)
    }
  })

  /* NOTE: This leads to wonky behavior when rendered.
  atom[Symbol.iterator] = function* () {
    return yield* new AtomEffect (atom)
  }
  */

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

function reduceUpdate (state: StateInfo, effect: UpdateEffect) {
  effect.return()

  if (! (state instanceof ActiveState)) {
    console.error ("[reduceUpdate]", state)
    throw new Error ("[reduceUpdate] state not active")
  }

  const { edge } = state.peek()

  const node = state.nodes.get (x => x.edge.equals (edge))

  // TODO: Should we not have tasks?
  return state
    .pop()
    .tasks.without (x => x.edge.equals (edge))
    .withNode (node.withStatus (effect.status))
}

function reduceUpdateAsync (state: StateInfo, effect: AsyncUpdateEffect) {
  effect.return()
  // TODO: This is not going to work when we need to load args...
  const node = state.nodes.get (x => x.edge.equals (effect.edge))

  if (! (node instanceof CleanNode)) {
    throw new Error ("[reduceUpdateAsync] not clean")
  }

  return state.withNode (node.withStatus (effect.status))
}

const performUpdate = extendStore (async function* (
  edge: EdgeInfo, 
  promise: Promise <any>
) {
  const status = await doo (async () => {
    try {
      const value = await promise
      return new Fulfilled (value)
    }
    catch (thrown) {
      return new Rejected (thrown)
    }
  })

  yield* new AsyncUpdateEffect (status, edge)
})

function reduceAtomAux (effect: AtomEffect, task: TaskInfo) {
  const { func } = task.edge

  const args = task.edge.args.map (arg => {
    if (arg instanceof ValueParam) {
      return arg.value
    }

    throw new Error ("Atom parameters are not yet supported")
  })

  effect.yield (function* () {
    try {
      let result: any
      yield new TaskEffect (task.id)
      if (func instanceof GeneratorFunction) {
        // TODO: Intercept effects?
        result = yield* func (...args)
      }
      else {
        result = func (...args)
      }

      console.log ("[reduceAtomAux] result", result)

      if (! (result instanceof Promise)) {
        yield* new UpdateEffect (new Fulfilled (result))
      }
      else {
        const promise = performUpdate (task.edge, result)
        yield* new UpdateEffect (new Pending (promise))
      }
    }
    catch (thrown) {
      if (thrown instanceof Promise) {
        // yield new SuspenseEffect()
      }
      yield* new UpdateEffect (new Rejected (thrown))
    }
  })
}

function reduceAtom (state: StateInfo, effect: AtomEffect) {
  console.log ("reduceAtom")

  const edge = state.edgeOf (effect.atom)
  const node = state.nodes.find (x => x.edge.equals (edge))
  const task = state.tasks.find (x => x.edge.equals (edge))

  if (task) {
    if (!node) {
      state = state.withNode (new DirtyNode (edge, []))
    }
    reduceAtomAux (effect, task)
    return state
  }
  /*
  else if (node instanceof DirtyNode) {
    console.warn ("Unexpected dirty node w/o task")
    return state
  }
  */
  else if (node instanceof CleanNode) {
    console.log ("found status!", node.status)
    effect.return (node.status)
    return state
  }
  
  console.error ("[reduceAtom] no strategy", { edge, state })
  throw new Error ("[reduceAtom] no strategy")
}

// #endregion

abstract class PointerInfo {
  atom = createAtom()
}

class EdgePointer extends PointerInfo {
  constructor (
    public readonly edge: EdgeInfo,
  ) {
    super()
  }
}

// #region Entrypoints

class EntryPointer extends PointerInfo {
  constructor (
    public readonly id: string,
  ) {
    super()
  }
}

class EntrypointInfo {
  constructor (
    public readonly id: string,
    public readonly edge: CleanEdge,
  ) {}
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
  // TODO: Back to EdgeInfo
  const edge = new CleanEdge (scope, func, infos)
  return yield* new EntrypointEffect (id, edge)
})

function reduceEntrypoint (
  state: StateInfo,
  effect: EntrypointEffect
): StateInfo {
  const info = new EntryPointer (effect.id)
  state = state.pointers.with (info)

  state = state.entries.without (x => x.id === effect.id)
  state = state.entries.with (new EntrypointInfo (effect.id, effect.edge))

  effect.return (info.atom)

  const data = state.nodes.find ((data) => {
    return data.edge.equals (effect.edge)
  })

  if (data) return state
  return state.withTask (new TaskInfo (effect.edge))
}

// #endregion

// --- APIs ---

// #region revalidate

const _revalidate = extendStore (function* (atom: Atom <any>) {
  yield* new RevalidateEffect (atom)
  resyncAll()
})

export function revalidate (atom: Atom <any>) {
  _revalidate (atom)
}

class RevalidateEffect extends Effect <void> {
  constructor (
    public atom: Atom <any>,
  ) {
    super()
  }
}

function reduceRevalidate (state: StateInfo, effect: RevalidateEffect) {
  const edge = state.edgeOf (effect.atom)
  const node = state.nodes.get (x => x.edge.equals (edge))

  if (node instanceof DirtyNode) {
    throw new Error ("Not implemented yet")
    // state = state.nodes.without (x => x === node)
    // state = state.tasks.without (x => x.edge.equals (edge))
  }

  const task = new TaskInfo (edge)
  effect.return()
  return state.withTask (task)
}

// #endregion

// --- HOOKS ---

// #region use

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

// #endregion

// #region StepInfo & _use

const NEVER = doo (() => {
  class Never {}
  return new Never() as any
})

export class UseStepEffect extends Effect <any> {
  constructor (
    public factory: Func0,
  ) {
    super()
  }
}

REDISPATCHER._use = extendStore (function* (factory: Func0) {
  return yield* new UseStepEffect (factory)
})

function reduceUseStep (state: ActiveState, effect: UseStepEffect) {
  const task = state.peek()

  const node = state.nodes.get (x => x.edge.equals (task.edge))

  if (node instanceof DirtyNode) {
    const value = effect.factory()
    state = node.withStep (state, new ValueStep (value))

    effect.return (value)
    return state.next()
  }
  
  else if (node instanceof CleanNode) {
    const step = node.step (state.step)

    if (! (step instanceof ValueStep)) {
      throw new Error ("[reduceUseStep] step not found")
    }

    effect.return (step.current)
    return state.next()
  }

  throw new Error ("[reduceUseStep] unknown node")
}

/**
 * A hook for a constant
 */
export function _use <T> (factory: () => T): T {
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

// #endregion

// #region useUpdate

class UseUpdateEffect extends Effect <symbol> {
  constructor () {
    super()
  }
}

class ForceUpdateEffect extends Effect <void> {
  constructor (
    public readonly step: symbol,
  ) {
    super()
  }
}

const forceUpdateBy = memoize ((step: symbol) => {
  return function forceUpdate () {
    handleEffect (new ForceUpdateEffect (step))
    resyncAll()
  }
})

REDISPATCHER.useUpdate = function _useUpdate () {
  const id = handleEffect (new UseUpdateEffect())
  return forceUpdateBy (id)
}

function reduceForceUpdate (state: StateInfo, effect: ForceUpdateEffect) {
  const { step } = effect
  const node = state.findNodeByStep (step)
  console.log ("found node", node)

  if (! (node instanceof CleanNode)) {
    throw new Error ("Can't update dirty node")
    // state = state.nodes.without (x => x === node)
    // state = state.tasks.without (x => x.edge.equals (edge))
  }

  const task = new TaskInfo (node.edge)
  effect.return()
  return state.withTask (task)
}

function reduceUseUpdate (state: ActiveState, effect: UseUpdateEffect) {
  const task = state.peek()

  const node = state.nodes.get (x => x.edge.equals (task.edge))

  if (node instanceof DirtyNode) {
    const step = new UpdateStep()
    state = node.withStep (state, step)

    effect.return (step.id)
    return state.next()
  }
  else if (node instanceof CleanNode) {
    const step = node.step (state.step)

    if (! (step instanceof UpdateStep)) {
      throw new Error ("[reduceUseUpdate] step not found")
    }

    effect.return (step.id)
    return state.next()
  }

  throw new Error ("[reduceUseUpdate] unknown node")
}

export function useUpdate () {
  const dispatcher = Dispatcher.current
  if (!dispatcher) throw new Error ("[useUpdate] no dispatcher")

  const { useUpdate } = dispatcher
  if (useUpdate) return useUpdate() // eslint-disable-line

  // eslint-disable-next-line
  const [ _, setSymbol ] = useState (() => Symbol())

  return _use (() => () => {
    setSymbol (() => Symbol())
  })
}

// #endregion

// #region useAtomic

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

function reduceUseAtomic (state: ActiveState, effect: UseAtomicEffect) {
  const args = effect.args.map (x => new ValueParam (x))

  const prev = state.peek()
  // TODO: EdgeInfo
  const edge = new CleanEdge (prev.edge.scope, effect.func, args)

  // TODO: If we have data, we don't need to create a task, right?
  const task = new TaskInfo (edge)
  return state.withTask (task)
}

// #endregion

// #region useView

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

// #region useRef

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

function reduceUseRef (state: StateInfo, effect: UseRefEffect) {
  throw new Error ("useRef not implemented yet")
}

// #endregion

// #region useReducer

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

function reduceUseReducer (state: StateInfo, effect: UseReducerEffect) {
  throw new Error ("[reduceUseReducer] not implemented")
}

// #endregion

// #region useState

REDISPATCHER.useState = function useState (initial: any) {
  const update = useUpdate()

  const ref = _use (() => {
    const state = typeof initial === "function" ? initial() : initial
    return { state }
  })

  const setState = _use (() => (arg: any) => {
    ref.state = typeof arg === "function" 
      ? arg (ref.state)
      : arg
    return update()
  })

  return [ ref.state, setState ]
}

/*
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

function reduceUseState (state: StateInfo, effect: UseStateEffect) {
  throw new Error ("[reduceUseState] not implemented")
}
*/

// #endregion

// #region React Hooks

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
