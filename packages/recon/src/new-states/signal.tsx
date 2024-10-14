import { ExoticComponent, memo, MemoExoticComponent } from "react"

import { Func } from "@reconjs/utils"
import { onPerform, perform, Pointer, Subject } from "../machine"
import { PropsOf } from "@reconjs/utils-react"
import { EdgeInfo } from "./edge"
import { EntryEdgePointer } from "./entrypoint"

const COMPONENT_SYMBOL = memo (() => null).$$typeof as MemoExoticComponent<any>["$$typeof"]

export type Signal <T> = Promise <T>
  & ExoticComponent <PropsOf<T>>
  & Generator <ExoticComponent <{}>, T, void>

export class ReconSignal extends Promise <any> {
  private $$typeof = COMPONENT_SYMBOL
  private type: Func

  #self?: Status

  private get self() {
    const _this = this
    return this.#self ??= perform (function* () {
      return yield* new StatusPointer (_this)
    })
  }

  [Symbol.toStringTag] = "ReconSignal"

  constructor (
    executor: (resolve: Func, reject: Func) => void
  ) {
    const controller: SignalController = {} as any
    super ((resolve, reject) => {
      executor (resolve, reject)
      controller.resolve = resolve
      controller.reject = reject
    })

    // NOTE: THIS DOES NOT WORK
    CONTROLLER_BY_SIGNAL.set (this, controller)

    const _this = this
    // @ts-ignore
    this.type = function Recon (props: any) {
      throw new Error ("Cannot yet mount a Signal")
    }
  }

  get status() {
    if (this.self instanceof Pending) return "pending"
    if (this.self instanceof Fulfilled) return "fulfilled"
    if (this.self instanceof Rejected) return "rejected"

    throw new Error ("Invalid Status")
  }

  get value() {
    if (this.self instanceof Fulfilled) return this.self.value
    throw new Error ("Not Fulfilled")
  }

  get reason() {
    if (this.self instanceof Rejected) return this.self.reason
    throw new Error ("Not Rejected")
  }

  *[Symbol.iterator](): Generator <Signal <any>, any, void> {
    yield this as any as Signal <any>
    
    if (this.self instanceof Pending) throw this
    if (this.self instanceof Fulfilled) return this.value
    if (this.self instanceof Rejected) throw this.reason

    throw new Error ("[Signal] infinite loop")
  }

  then (onFulfilled: Func, onRejected: Func) {
    return super.then (onFulfilled, onRejected)
  }
}

export class StatusPointer extends Pointer <Status> {
  constructor (public readonly signal: ReconSignal) {
    super()
  }
}

export class DoneSubject extends Subject {
  constructor (public readonly edge: EdgeInfo) {
    super()
  }
}

onPerform (DoneSubject, function* (subject) {
  for (const [ signal, controller ] of CONTROLLER_BY_SIGNAL.entries()) {
    const edge = yield* new EntryEdgePointer (signal)
    if (edge.equals (subject.edge)) {
      controller.resolve()
    }
  }
})


// INTERNALS

type SignalController = {
  resolve: Func,
  reject: Func,
}

const CONTROLLER_BY_SIGNAL = new Map <ReconSignal, SignalController>()

// STATUS CLASSES

export abstract class Status {}

export class Pending extends Status {
  constructor (
    public readonly promise: Promise <void>
  ) {
    super()
  }
}

export class Fulfilled extends Status {
  constructor (
    public readonly value: any
  ) {
    super()
  }
}

export class Rejected extends Status {
  constructor (
    public readonly reason: any
  ) {
    super()
  }
}


// UTILITIES

function* loop (debug: string) {
  for (let i = 0; i < 100; i++) {
    yield null
  }

  throw new Error (`[loop] too much (${debug})`)
}
