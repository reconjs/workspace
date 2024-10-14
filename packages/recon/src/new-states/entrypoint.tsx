import { onPerform, Pointer } from "../machine"
import { EdgeInfo } from "./edge"
import { ReconSignal } from "./signal"
import { EnqueueSubject } from "./task"

const VIEWID_BY_SIGNAL = new Map <ReconSignal, string>()
const SIGNAL_BY_VIEWID = new Map <string, ReconSignal>()
const EDGE_BY_VIEWID = new Map <string, EdgeInfo>()

export class EntryPointer extends Pointer <ReconSignal> {
  constructor (
    public readonly id: string, 
    public readonly edge: EdgeInfo,
  ) {
    super()
  }
}

onPerform (EntryPointer, function* ({ id, edge }) {
  // const found = SIGNAL_BY_VIEWID.get (id)
  // TODO: Update edge always
  // if (found) return found

  if (!id) throw new Error ("[EntryPointer] id must be string")

  if (typeof id !== "string") throw new Error ("[EntryPointer] id must be string")
  console.log ("creating a ReconSignal", id)
  const signal = new ReconSignal (() => {})
  signal.viewId = id

  SIGNAL_BY_VIEWID.set (id, signal)
  VIEWID_BY_SIGNAL.set (signal, id)
  EDGE_BY_VIEWID.set (id, edge)

  try {
    yield new EnqueueSubject (signal)
  }
  catch (e) {
    console.error ("[EntryPointer] error")
  }
  
  return signal
})

export class EntryEdgePointer extends Pointer <EdgeInfo> {
  constructor (
    public readonly signal: ReconSignal,
  ) {
    super()
  }
}

onPerform (EntryEdgePointer, function* ({ signal }) {
  const viewId = VIEWID_BY_SIGNAL.get (signal)
  console.log ("[EntryEdgePointer] signal", signal, viewId)
  if (!viewId) throw new Error ("[EntryEdgePointer] viewId not found")
  
  const found = EDGE_BY_VIEWID.get (viewId)
  if (!found) throw new Error ("[EntryEdgePointer] edge not found")

  return found
})
