import { onPerform, Subject } from "../machine"
import { Clazz } from "../types"

type Signal = {}
type Edge = {}

const SYMBOL_BY_SIGNAL = new Map <Signal, string>()
const SIGNAL_BY_SYMBOL = new Map <string, Signal>()
const EDGE_BY_SYMBOL = new Map <string, Edge>()

export class SignalSubject extends Subject {
  constructor (public subtask: Subject) {
    super()
  }
}

onPerform (SignalSubject, function* ({ subtask}) {
  const found = SIGNAL_BY_SUBJECT.get (subtask)
  if (found) return found

  const signal = createSignal ()

  .set (, subtask)
})