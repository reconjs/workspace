import { Func, Func0, Vunc } from "@reconjs/utils"
import { DependencyList, FunctionComponent, MemoExoticComponent } from "react"

import { Effect } from "./effect"
import { extendStore } from "./state"
import { Atom } from "./atomic"
import { AnyView } from "./use-view"

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

export const REDISPATCHER = {} as ReconDispatcher



export class UsingTask extends Effect <any> {
  constructor (
    public factory: Func0,
  ) {
    super()
  }
}

REDISPATCHER._use = extendStore (function* (factory: Func0) {
  return yield* new UsingTask (factory)
})



// #region Recon Hooks

export class UseAtomicTask extends Effect <Atom <any>> {
  constructor (
    public func: Func,
    public args: any[],
  ) {
    super()
  }
}

REDISPATCHER.useAtomic = extendStore (function* (func: Func, ...args: any[]) {
  return yield* new UseAtomicTask (func, args)
})



export class UseViewTask extends Effect <MemoExoticComponent <any>> {
  constructor (
    public render: Func,
  ) {
    super()
  }
}

REDISPATCHER.useView = extendStore (function* (render: Func) {
  return yield* new UseViewTask (render)
})

// #endregion



export class UseTask extends Effect <any> {
  constructor (
    public usable: any,
  ) {
    super()
  }
}

REDISPATCHER.use = extendStore (function* (usable: any) {
  return yield* new UseTask (usable)
})



// #region React Hooks

export class UseStateTask extends Effect <[ any, Func ]> {
  constructor (
    public init: any,
  ) {
    super()
  }
}

REDISPATCHER.useState = extendStore (function* (init: any) {
  return yield* new UseStateTask (init)
})



export class UseIdTask extends Effect <string> {}

REDISPATCHER.useId = extendStore (function* () {
  return yield* new UseIdTask ()
})



export class UseMemoTask extends Effect <any> {
  constructor (
    public factory: any,
    public deps: DependencyList,
  ) {
    super()
  }
}

REDISPATCHER.useMemo = extendStore (function* (factory: any, deps: DependencyList) {
  return yield* new UseMemoTask (factory, deps)
})



export class UseEffectTask extends Effect <void> {
  constructor (
    public effect: any,
    public deps: DependencyList,
  ) {
    super()
  }
}

REDISPATCHER.useEffect = extendStore (function* (effect: any, deps: DependencyList) {
  return yield* new UseEffectTask (effect, deps)
})



export class UseLayoutEffectTask extends Effect <void> {
  constructor (
    public effect: any,
    public deps: DependencyList,
  ) {
    super()
  }
}

REDISPATCHER.useLayoutEffect = extendStore (function* (effect: any, deps: DependencyList) {
  return yield* new UseLayoutEffectTask (effect, deps)
})



export class UseRefTask extends Effect <any> {
  constructor (
    public current: any,
  ) {
    super()
  }
}

REDISPATCHER.useRef = extendStore (function* (current: any) {
  return yield* new UseRefTask (current)
})



export class UseContextTask extends Effect <any> {
  constructor (
    public context: any,
  ) {
    super()
  }
}

REDISPATCHER.useContext = extendStore (function* (context: any) {
  return yield* new UseContextTask (context)
})



export class UseReducerTask extends Effect <[ any, Func ]> {
  constructor (
    public reducer: any,
    public init: any,
  ) {
    super()
  }
}

REDISPATCHER.useReducer = extendStore (function* (reducer: any, init: any) {
  return yield* new UseReducerTask (reducer, init)
})



export class UseCallbackTask extends Effect <any> {
  constructor (
    public callback: any,
    public deps: DependencyList,
  ) {
    super()
  }
}

REDISPATCHER.useCallback = extendStore (function* (callback: any, deps: DependencyList) {
  return yield* new UseCallbackTask (callback, deps)
})


export class UseImperativeHandleTask extends Effect <void> {
  constructor (
    public ref: any,
    public init: any,
    public deps: DependencyList,
  ) {
    super()
  }
}

REDISPATCHER.useImperativeHandle = extendStore (function* (ref: any, init: any, deps: DependencyList) {
  return yield* new UseImperativeHandleTask (ref, init, deps)
})


export class UseDebugValueTask extends Effect <void> {
  constructor (
    public value: any,
  ) {
    super()
  }
}

REDISPATCHER.useDebugValue = extendStore (function* (value: any) {
  return yield* new UseDebugValueTask (value)
})



export class UseDeferredValueTask extends Effect <any> {
  constructor (
    public value: any,
    public init?: any,
  ) {
    super()
  }
}

REDISPATCHER.useDeferredValue = extendStore (function* (value: any, init?: any) {
  return yield* new UseDeferredValueTask (value, init)
})



export class UseInsertionEffectTask extends Effect <void> {
  constructor (
    public effect: any,
    public deps: DependencyList,
  ) {
    super()
  }
}

REDISPATCHER.useInsertionEffect = extendStore (function* (effect: any, deps: DependencyList) {
  return yield* new UseInsertionEffectTask (effect, deps)
})



export class UseTransitionTask extends Effect <[ boolean, Func0 ]> {}

REDISPATCHER.useTransition = extendStore (function* () {
  return yield* new UseTransitionTask ()
})



export class UseOptimisticTask extends Effect <void> {
  constructor (
    public state: any,
    public update: Func,
  ) {
    super()
  }
}

REDISPATCHER.useOptimistic = extendStore (function* (state: any, update: Func) {
  return yield* new UseOptimisticTask (state, update)
})



export class UseSyncExternalStoreTask extends Effect <void> {
  constructor (
    public store: any,
  ) {
    super()
  }
}

REDISPATCHER.useSyncExternalStore = extendStore (function* (store: any) {
  return yield* new UseSyncExternalStoreTask (store)
})



export class UseActionStateTask extends Effect <[ any, Vunc <[ any ]> ]> {
  constructor (
    public action: Func,
    public init: any,
  ) {
    super()
  }
}

REDISPATCHER.useActionState = extendStore (function* (action: Func, init: any) {
  return yield* new UseActionStateTask (action, init)
})

// #endregion
