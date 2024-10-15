import { onPerform, Subject } from "../machine"
import { EdgeInfo } from "./edge"
import { createSignal, Signal } from "./signal"
import { EnqueueSubject } from "./task"

/*
const VIEWID_BY_SIGNAL = new Map <Signal<any>, string>()
const SIGNAL_BY_VIEWID = new Map <string, Signal<any>>()
const EDGE_BY_VIEWID = new Map <string, EdgeInfo>()
*/

const EDGE_BY_SIGNAL = new Map <Signal<any>, EdgeInfo>()

export class EntrySubject extends Subject <Signal<any>> {
  constructor (
    public readonly id: string, 
    public readonly edge: EdgeInfo,
  ) {
    super()
  }
}

function findSignalByEdge (edge: EdgeInfo) {
  const found = Array.from (EDGE_BY_SIGNAL.entries())
    .find (([ , x ]) => x.equals (edge))
  return found?.[0]
}

onPerform (EntrySubject, function* ({ edge }) {
  const found = findSignalByEdge (edge)
  // TODO: Update edge always
  if (found) return found

  const signal = createSignal()
  EDGE_BY_SIGNAL.set (signal, edge)

  try {
    yield new EnqueueSubject (signal)
  }
  catch (e) {
    console.error ("[EntrySubject] error")
  }
  
  return signal
})

export class EntryEdgeSubject extends Subject <EdgeInfo> {
  constructor (
    public readonly signal: Signal<any>,
  ) {
    super()
  }
}

onPerform (EntryEdgeSubject, function* ({ signal }) {
  const found = EDGE_BY_SIGNAL.get (signal)
  if (!found) throw new Error ("[EntryEdgeSubject] edge not found")
  return found
})
