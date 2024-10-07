import { AnyFunction, Func, Func0, guidBy, loadPromise, memoize, range, Vunc } from "@reconjs/utils"
import React, { 
  DependencyList, 
  memo, 
  MemoExoticComponent, 
  useState,
} from "react"
import { CallEffect, Effect } from "../effect"
import { defineStore } from "./store"
import { GeneratorFunction } from "../types"
import { AnyView } from "../use-view"
import { Atom } from "../atomic"
import { faulty } from "./fault"
import { resyncAll } from "../resync"

// #region utils

const WINDOW = typeof window !== "undefined" 
  ? window as any 
  : null

function doo <T> (func: () => T) {
  return func()
}

function* loop (debug: string) {
  for (let i = 0; i < 20; i++) {
    yield null
  }
  
  throw new Error (`[loop] too much (${debug})`)
}

// #endregion

// #region Hooks Types

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

// #endregion

// #region React Internals

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

// #endregion

// #region Bunch & substate

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

// #endregion

const EMPTY = new Bunch <any> ([])

abstract class InternalSymbol {
  private guid = guidBy ("node:" + guidBy({}))

  toString() {
    return this.guid
  }
}

export class ScopeSymbol extends InternalSymbol {}
class NodeSymbol extends InternalSymbol {}
class TaskSymbol extends InternalSymbol {}

type StateSelf = {
  entries: Bunch <EntrypointInfo>,
  pointers: Bunch <PointerInfo>,
  nodes: Bunch <NodeInfo>,
  nodules: Bunch <NoduleInfo>,
  steps: Bunch <StepInfo>,
  suspenses: Bunch <SuspenseInfo>,
  tasks: Bunch <TaskInfo>,
  errors: Bunch <Error>,
}

// #region StateInfo

class StateInfo <S extends StateSelf = StateSelf> {
  constructor (protected readonly self: S) {}

  protected build (self: S) {
    return new StateInfo <S> (self)
  }

  push (id: TaskSymbol) {
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

  get nodules() {
    return substate (() => this.self.nodules)
      .withBuild ((nodules) => this.build ({ ...this.self, nodules }))
  }

  get steps() {
    return substate (() => this.self.steps)
      .withBuild ((steps) => this.build ({ ...this.self, steps }))
  }

  get suspenses () {
    return substate (() => this.self.suspenses)
      .withBuild ((suspenses) => this.build ({ ...this.self, suspenses }))
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

  findNoduleByPhase (phase: symbol) {
    return this.nodules.find ((nodule) => {
      return nodule.has (phase)
    })
  }

  withNodule (nodule: NoduleInfo) {
    const found = this.self.nodules
      .find ((x) => x.edge.equals (nodule.edge))

    return this.build ({
      ...this.self,
      nodules: this.self.nodules
        .with (nodule)
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
    for (const [ key, val ] of Object.entries (this.self)) {
      if (val instanceof Bunch) {
        val.log (key)
      }
      else {
        console.log (`${key}:`, val)
      }
    }
  }

  validate() {}
}

const INIT_STATE = new StateInfo ({
  entries: EMPTY,
  pointers: EMPTY,
  nodes: EMPTY,
  nodules: EMPTY,
  steps: EMPTY,
  suspenses: EMPTY,
  tasks: EMPTY,
  errors: EMPTY,
})

// #endregion

// #region ActiveState

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

  get phase() {
    const [{ phase }] = this.self.stack
    return phase
  }

  next() {
    const [ { task, phase }, ...stack ] = this.self.stack

    return this.build ({
      ...this.self,
      stack: [
        new CallInfo (task, phase + 1),
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

  push (id: TaskSymbol) {
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

// #endregion

// STORE DEFINITION

// #region Inline Views

export class InviewStartEffect extends Effect <void> {}
export class InviewEndEffect extends Effect <void> {}

/*
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
*/

// #endregion

function reduceActiveState (state: ActiveState, effect: Effect): StateInfo {
  if (effect instanceof UseAtomicEffect) {
    return reduceUseAtomic (state, effect)
  }
  else if (effect instanceof UsePhaseEffect) {
    return reduceUsePhase (state, effect)
  }
  else if (effect instanceof UseUpdateEffect) {
    return reduceUseUpdate (state, effect)
  }
  else if (effect instanceof SuspenseEffect) {
    return reduceSuspense (state, effect)
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
  else if (effect instanceof ProcEffect) {
    return reduceProc (state, effect)
  }
  else if (effect instanceof EntrypointEffect) {
    return reduceEntrypoint (state, effect)
  }
  else if (effect instanceof AtomEffect) {
    return reduceAtom (state, effect)
  }
  else if (effect instanceof StatusSyncEffect) {
    return reduceStatusSync (state, effect)
  }
  else if (effect instanceof StatusAsyncEffect) {
    return reduceStatusAsync (state, effect)
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
  else if (effect instanceof UnsuspenseEffect) {
    return reduceUnsuspense (state, effect)
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

  // console.group ("extendStore")
  
  try {
    // console.log ("active:", state instanceof ActiveState)
    // console.log ("effect:", effect)

    try {
      nextState = reduceState (state, effect)
    }
    catch (err) {
      // dump ("error while reducing")
      throw err
    }

    try {
      nextState.validate()
    }
    catch (err) {
      // dump ("error while validating")
      throw err
    }

    return nextState
  }
  finally {
    // console.groupEnd()
  }
})

export function extendStore (...args: Parameters <typeof _extendStore>) {
  return _extendStore (...args)
}

// #region Handle Effects

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
    public readonly scope: ScopeSymbol,
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
    public readonly scope: ScopeSymbol,
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
    public readonly scope: ScopeSymbol,
    public readonly proc: ProcStepSymbol,
    public readonly args: ArgInfo[],
  ) {
    const isValid = args.every ((arg) => arg instanceof ArgInfo)
    if (!isValid) {
      console.log ("[EdgeInfo]", scope, proc, args)
      throw new Error ("[EdgeInfo] invalid args")
    }
  }

  equals (other: EdgeInfo) {
    if (this.scope !== other.scope) return false
    if (this.proc !== other.proc) return false
    if (this.args.length !== other.args.length) return false

    for (const i of range (this.args.length)) {
      if (!this.args[i].equals (other.args[i])) return false
    }
    return true
  }
}

class CleanEdge extends EdgeInfo {
  constructor (
    scope: ScopeSymbol,
    proc: ProcStepSymbol,
    args: ParamInfo[],
  ) {
    super (scope, proc, args)
  }
}

// #endregion

// #region Steps

class ArgType {}

class AtomArgType extends ArgType {
  constructor (
    public readonly proc: ProcStepSymbol,
  ) {
    super()
  }
}

abstract class StepSymbol extends InternalSymbol {}

abstract class StepInfo {
	abstract id: StepSymbol
}

abstract class CellInfo {
  abstract readonly step: StepSymbol
  abstract readonly node: NodeSymbol
}

// #endregion

// #region Proc

class ProcStepSymbol extends StepSymbol {}

class ProcStep extends StepInfo {
	constructor (
    public readonly id: ProcStepSymbol,
		public readonly proc: AnyFunction,
		public readonly args: ArgType[],
	) {
    super()
  }
}

class ProcEffect extends Effect <ProcStepSymbol> {
  constructor (
    public readonly func: AnyFunction,
    public readonly args: any[],
  ) {
    super()
  }
}

function reduceProc (state: StateInfo, effect: ProcEffect) {
  const step = state.steps
    .find (x => x instanceof ProcStep && x.proc === effect.func)

  if (step) {
    effect.return (step.id)
    return state
  }

  const argtypes = effect.args.map ((arg) => {
    const found = state.pointers.find (x => x.atom === arg)

    if (found instanceof EdgePointer) {
      return new AtomArgType (found.edge.proc)
    }
    else if (found instanceof EntryPointer) {
      const entry = state.entries.get (x => x.id === found.id)
      return new AtomArgType (entry.edge.proc)
    }
    else {
      return new ArgType()
    }
  })

  const id = new ProcStepSymbol()
  return state.steps.with (new ProcStep (id, effect.func, argtypes))
}

// #endregion

// #region Nodes

abstract class NodeInfo {
  abstract id: NodeSymbol
  abstract edge: EdgeInfo
}

class DirtyNode extends NodeInfo {
  constructor (
    public readonly id: NodeSymbol,
    public readonly edge: EdgeInfo,
  ) {
    super()
  }
}

class CleanNode extends NodeInfo {
  constructor (
    public readonly id: NodeSymbol,
    public readonly edge: CleanEdge,
  ) {
    super()
  }
}

// #endregion

// #region Last Step

class LastStepSymbol extends StepSymbol {}

class LastStep extends StepInfo {
  id = new LastStepSymbol()

	constructor (
		public readonly prev: StepInfo,
	) {
    super()
  }
}

class LastCell extends CellInfo {
  constructor (
    public readonly step: LastStepSymbol,
    public readonly node: NodeSymbol,
    public readonly status: Status,
  ) {
    super()
  }
}

// #endregion

// --- OLD ---

// #region Phases
// for storing info within a nodule

abstract class PhaseInfo {}

class ValuePhase extends PhaseInfo {
  constructor (
    public readonly current: any,
  ) {
    super()
  }
}

class UpdatePhase extends PhaseInfo {
  readonly id = Symbol(`phase:${guidBy({})}`)

  constructor () {
    super()
  }
}

// #endregion

// #region Nodules

abstract class NoduleInfo {
  abstract edge: EdgeInfo
  protected abstract phases: PhaseInfo[]

  abstract withStatus (status: Status): CleanNodule

  has (phase: symbol) {
    return this.phases.some ((x) => x instanceof UpdatePhase && x.id === phase)
  }
}

class DirtyNodule extends NoduleInfo {
  constructor (
    public readonly edge: EdgeInfo,
    protected readonly phases: PhaseInfo[],
  ) {
    super()
  }

  withPhase <T extends StateInfo> (state: T, phase: PhaseInfo): T {
    const nextState = state
      .nodules.without (x => x === this)
      .withNodule (new DirtyNodule (this.edge, [
        ...this.phases,
        phase,
      ]))

    return nextState as T
  }

  withStatus (status: Status) {
    if (! (this.edge instanceof CleanEdge)) {
      throw new Error ("[DirtyNodule::withStatus] not a clean edge")
    }

    return new CleanNodule (this.edge, status, this.phases)
  }
}

class CleanNodule extends NoduleInfo {
  constructor (
    public readonly edge: CleanEdge,
    public readonly status: Status,
    protected readonly phases: PhaseInfo[],
  ) {
    super()
  }

  at (index: number) {
    const phase = this.phases.find ((_, i) => i === index)
    if (!phase) throw new Error ("[phase] not found")
    return phase
  }

  withStatus (status: Status) {
    return new CleanNodule (this.edge, status, this.phases)
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
    public readonly task: TaskSymbol,
    public readonly phase: number,
  ) {}
}

class TaskInfo {
  id = new TaskSymbol()

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
    public readonly id: TaskSymbol,
  ) {
    super()
  }
}

function reduceTask (state: StateInfo, effect: TaskEffect) {
  effect.return
  const task = state.tasks.find (x => x.id === effect.id)

  if (!task) return state  
  return state.push (effect.id)
}

// #endregion

// #region Suspense

class SuspenseInfo {
  constructor (
    public readonly task: TaskSymbol,
    public readonly status: Pending,
  ) {}
}

class UnsuspenseEffect extends Effect <void> {
  constructor (
    public readonly task: TaskSymbol,
  ) {
    super()
  }
}

class SuspenseEffect extends Effect <void> {
  constructor (
    public readonly status: Pending,
  ) {
    super()
  }
}

function reduceUnsuspense (state: StateInfo, effect: UnsuspenseEffect) {
  effect.return()
  return state.suspenses.without (x => x.task === effect.task)
}

function reduceSuspense (state: ActiveState, effect: SuspenseEffect) {
  const task = state.peek()
  effect.return()

  effect.status.promise.then (() => {
    try {
      handleEffect (new UnsuspenseEffect (task.id))
    }
    catch (err) {
      console.error ("[reduceSuspense] logging the error", err)
    }
  })

  const hasSuspense = !!state.suspenses.find (x => x.task === task.id)

  if (!hasSuspense) {
    // @ts-ignore
    state = state.suspenses.with (new SuspenseInfo (task.id, effect.status))
  }

  // TODO: Should we not have tasks?
  return state.pop()
    .nodules.without (x => x.edge.equals (task.edge) && x instanceof DirtyNodule)
}

// #endregion

// #region Status

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

const handleStatusOf = extendStore (function* (atom: Atom <any>) {
  // console.log ("handleStatusOf")
  const status = yield* new AtomEffect (atom)

  if (status instanceof Fulfilled) return "fulfilled"
  if (status instanceof Rejected) return "rejected"
  if (status instanceof Status) return "pending"

  throw new Error ("no status")
})

const handleReasonOf = extendStore (function* (atom: Atom <any>) {
  // console.log ("handleReasonOf")
  const status = yield* new AtomEffect (atom)

  if (status instanceof Rejected) return status.reason
  throw new Error ("Atom was not rejected")
})

const handleValueOf = extendStore (function* (atom: Atom <any>) {
  // console.log ("handleValueOf")
  const status = yield* new AtomEffect (atom)

  if (status instanceof Fulfilled) return status.value
  throw new Error ("Atom was not fulfilled")
})

class StatusSyncEffect extends Effect <void> {
  constructor (
    public readonly status: Status
  ) {
    super()
  }
}

class StatusAsyncEffect extends Effect <void> {
  constructor (
    public readonly status: Status,
    public readonly edge: EdgeInfo,
  ) {
    super()
  }
}

const performLoadingOf = extendStore (async function* (atom: Atom <any>) {
  console.group ("performLoadingOf")

  let rejected = false

  try {
    // await Promise.resolve()
    for (const _ of loop ("performLoadingOf")) {
      // console.log ("it's loading time...")
      const status = yield* new AtomEffect (atom)

      if (status instanceof Fulfilled) return
      if (status instanceof Rejected) {
        rejected = true
        // throw status.reason
        console.error ("[performLoadingOf] rejected", status.reason)
      }
      if (status instanceof Pending) {
        try {
          await status.promise
        }
        catch (err) {}
      }
      else {
        console.error ("[performLoadingOf] unknown status", status)
        throw new Error ("[performLoadingOf] unknown status")
      }
    }
  }
  catch (err) {
    if (rejected) throw err
    console.error (err)
  }
  finally {
    console.groupEnd()
  }
})

// #endregion

// #region Atoms

class AtomEffect extends Effect <Status> {
  constructor (
    public readonly atom: Atom <any>
  ) {
    super()
  }
}

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

function reduceStatusSync (state: StateInfo, effect: StatusSyncEffect) {
  effect.return()

  if (! (state instanceof ActiveState)) {
    console.error ("[reduceStatusSync]", state)
    throw new Error ("[reduceStatusSync] state not active")
  }

  const { edge } = state.peek()

  const nodule = state.nodules.get (x => x.edge.equals (edge))

  // TODO: Should we not have tasks?
  return state
    .pop()
    .tasks.without (x => x.edge.equals (edge))
    .withNodule (nodule.withStatus (effect.status))
}

function reduceStatusAsync (state: StateInfo, effect: StatusAsyncEffect) {
  effect.return()
  // TODO: This is not going to work when we need to load args...
  const nodule = state.nodules.get (x => x.edge.equals (effect.edge))

  if (! (nodule instanceof CleanNodule)) {
    throw new Error ("[reduceStatusAsync] not clean")
  }

  return state.withNodule (nodule.withStatus (effect.status))
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

  try {
    yield* new StatusAsyncEffect (status, edge)
  }
  catch (err) {
    console.error ("[performUpdate] error", err)
  }
})

function reduceAtom (state: StateInfo, effect: AtomEffect) {
  // console.log ("reduceAtom")

  const edge = state.edgeOf (effect.atom)
  const nodule = state.nodules.find (x => x.edge.equals (edge))
  const task = state.tasks.find (x => x.edge.equals (edge))

  if (task) {
    const suspended = state.suspenses.find (x => x.task === task.id)
    if (suspended) {
      // console.log ("[reduceAtom] suspended")
      effect.return (suspended.status)
      return state
    }

    if (!nodule) {
      state = state.withNodule (new DirtyNodule (edge, []))
    }

    const { proc } = doo (() => {
      const step = state.steps
        .get (x => x instanceof ProcStep && x.id === edge.proc)
      return step as ProcStep
    })

    effect.yield (function* () {
      try {
        yield new TaskEffect (task.id)
        const args = task.edge.args.map (arg => {
          if (arg instanceof ValueParam) {
            return arg.value
          }
      
          throw new Error ("Atom parameters are not yet supported")
        })
  
        let result: any
        if (proc instanceof GeneratorFunction) {
          // TODO: Intercept effects?
          result = yield* proc (...args)
        }
        else {
          result = proc (...args)
        }
  
        // console.log ("[reduceAtom -> yield] result", result)
  
        if (! (result instanceof Promise)) {
          yield* new StatusSyncEffect (new Fulfilled (result))
        }
        else {
          const promise = performUpdate (task.edge, result)
          yield* new StatusSyncEffect (new Pending (promise))
        }
      }
      catch (thrown) {
        if (thrown instanceof Promise) {
          const status = new Pending (thrown)
          yield* new SuspenseEffect (status)
        }
        else {
          yield* new StatusSyncEffect (new Rejected (thrown))
        }
      }
    })

    return state
  }
  /*
  else if (nodule instanceof DirtyNodule) {
    console.warn ("Unexpected dirty nodule w/o task")
    return state
  }
  */
  else if (nodule instanceof CleanNodule) {
    // console.log ("found status!", nodule.status)
    effect.return (nodule.status)
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
  scope: ScopeSymbol,
  func: Func,
  ...args: any[]
) {
  const proc = yield* new ProcEffect (func, args)

  const infos = args
    .map (value => new ValueParam (value))
  // TODO: Back to EdgeInfo
  const edge = new CleanEdge (scope, proc, infos)
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

  const found = state.nodules.find (x => x.edge.equals (effect.edge))
  if (found) return state
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
  const nodule = state.nodules.get (x => x.edge.equals (edge))

  if (nodule instanceof DirtyNodule) {
    throw new Error ("Not implemented yet")
    // state = state.nodules.without (x => x === nodule)
    // state = state.tasks.without (x => x.edge.equals (edge))
  }

  const task = new TaskInfo (edge)
  effect.return()
  return state.withTask (task)
}

// #endregion

// --- HOOKS ---

// #region use

/*
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
*/

REDISPATCHER.use = function use (usable: any) {
  return loadPromise (usable)
}

// #endregion

// #region PhaseInfo & _use

const NEVER = doo (() => {
  class Never {}
  return new Never() as any
})

export class UsePhaseEffect extends Effect <any> {
  constructor (
    public factory: Func0,
  ) {
    super()
  }
}

REDISPATCHER._use = extendStore (function* (factory: Func0) {
  return yield* new UsePhaseEffect (factory)
})

function reduceUsePhase (state: ActiveState, effect: UsePhaseEffect) {
  const task = state.peek()

  const nodule = state.nodules.get (x => x.edge.equals (task.edge))

  if (nodule instanceof DirtyNodule) {
    const value = effect.factory()
    state = nodule.withPhase (state, new ValuePhase (value))

    effect.return (value)
    return state.next()
  }
  
  else if (nodule instanceof CleanNodule) {
    const phase = nodule.at (state.phase)

    if (! (phase instanceof ValuePhase)) {
      throw new Error ("[reduceUsePhase] phase not found")
    }

    effect.return (phase.current)
    return state.next()
  }

  throw new Error ("[reduceUsePhase] unknown nodule")
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
    public readonly phase: symbol,
  ) {
    super()
  }
}

const forceUpdateBy = memoize ((phase: symbol) => {
  return function forceUpdate () {
    handleEffect (new ForceUpdateEffect (phase))
    resyncAll()
  }
})

REDISPATCHER.useUpdate = function _useUpdate () {
  const id = handleEffect (new UseUpdateEffect())
  return forceUpdateBy (id)
}

function reduceForceUpdate (state: StateInfo, effect: ForceUpdateEffect) {
  const { phase } = effect
  const nodule = state.findNoduleByPhase (phase)
  // console.log ("found nodule", nodule)

  if (! (nodule instanceof CleanNodule)) {
    throw new Error ("Can't update dirty nodule")
    // state = state.nodules.without (x => x === nodule)
    // state = state.tasks.without (x => x.edge.equals (edge))
  }

  const task = new TaskInfo (nodule.edge)
  effect.return()
  return state.withTask (task)
}

function reduceUseUpdate (state: ActiveState, effect: UseUpdateEffect) {
  const task = state.peek()

  const nodule = state.nodules.get (x => x.edge.equals (task.edge))

  if (nodule instanceof DirtyNodule) {
    const phase = new UpdatePhase()
    state = nodule.withPhase (state, phase)

    effect.return (phase.id)
    return state.next()
  }
  else if (nodule instanceof CleanNodule) {
    const phase = nodule.at (state.phase)

    if (! (phase instanceof UpdatePhase)) {
      throw new Error ("[reduceUseUpdate] phase not found")
    }

    effect.return (phase.id)
    return state.next()
  }

  throw new Error ("[reduceUseUpdate] unknown nodule")
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
    public proc: ProcStepSymbol,
    public args: any[],
  ) {
    super()
  }
}

REDISPATCHER.useAtomic = extendStore (function* (func: Func, ...args: any[]) {
  const proc = yield* new ProcEffect (func, args)
  return yield* new UseAtomicEffect (proc, args)
})

function reduceUseAtomic (state: StateInfo, effect: UseAtomicEffect) {
  if (! (state instanceof ActiveState)) {
    throw new Error ("[reduceUseAtomic] not active")
  }

  const prev = state.peek()

  const args = effect.args.map (x => new ValueParam (x))
  const edge = new CleanEdge (prev.edge.scope, effect.proc, args)

  const pointer = new EdgePointer (edge)
  state = state.pointers.with (pointer)
  effect.return (pointer.atom)

  const found = state.nodules.find (x => x.edge.equals (edge))
  if (found) return state
  else return state.withTask (new TaskInfo (edge))
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
