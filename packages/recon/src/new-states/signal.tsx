import { ExoticComponent, memo, MemoExoticComponent } from "react"

import { Func } from "@reconjs/utils"
import { onPerform, perform, Subject } from "../machine"
import { PropsOf } from "@reconjs/utils-react"
import { EdgeInfo } from "./edge"
import { EntryEdgeSubject } from "./entrypoint"

const COMPONENT_SYMBOL = memo (() => null).$$typeof

export type Signal <T> = Promise <T>
  & ExoticComponent <PropsOf<T>>
  & Generator <ExoticComponent <{}>, T, void>

export function createSignal () {
  const controller: SignalController = {} as any

  const signal: any = new Promise ((resolve, reject) => {
    controller.resolve = resolve
    controller.reject = reject
  })

  CONTROLLER_BY_SIGNAL.set (signal, controller)

  signal.$$typeof = COMPONENT_SYMBOL
  signal.type = function Recon (props: any) {
    throw new Error ("Cannot yet mount a Signal")
  }

  function getSelf() {
    return perform (function* () {
      return yield* new StatusSubject (signal)
    })
  }

  Object.defineProperty (signal, "status", {
    get () {
      if (getSelf() instanceof Pending) return "pending"
      if (getSelf() instanceof Fulfilled) return "fulfilled"
      if (getSelf() instanceof Rejected) return "rejected"

      throw new Error ("Invalid Status")
    }
  })

  Object.defineProperty (signal, "value", {
    get() {
      const self = getSelf()
      if (self instanceof Fulfilled) return self.value
      throw new Error ("Not Fulfilled")
    }
  })

  Object.defineProperty (signal, "reason", {
    get() {
      const self = getSelf()
      if (self instanceof Rejected) return self.reason
      throw new Error ("Not Rejected")
    }
  })

  signal[Symbol.iterator] = function* () {
    yield signal as any as Signal <any>
    
    if (getSelf() instanceof Pending) throw signal
    if (getSelf() instanceof Fulfilled) return signal.value
    if (getSelf() instanceof Rejected) throw signal.reason

    throw new Error ("[Signal] infinite loop")
  }

  return signal as Signal <any>
}

export class StatusSubject extends Subject<Status> {
  constructor (public readonly signal: Signal <any>) {
    super()
  }
}

export class DoneSubject extends Subject<void> {
  constructor (public readonly edge: EdgeInfo) {
    super()
  }
}

onPerform (DoneSubject, function* (subject) {
  for (const [ signal, controller ] of CONTROLLER_BY_SIGNAL.entries()) {
    const edge = yield* new EntryEdgeSubject (signal)
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

const CONTROLLER_BY_SIGNAL = new Map <Signal<any>, SignalController>()

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
