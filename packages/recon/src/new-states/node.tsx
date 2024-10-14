import { guidBy } from "@reconjs/utils"
import { onPerform, Pointer } from "../machine"
import { CleanEdge, EdgeInfo } from "./edge"
import { EntryEdgePointer } from "./entrypoint"
import { Fulfilled, DoneSubject, Status, StatusPointer } from "./signal"
import { ExecuteSubject } from "./task"

export class NodeSymbol {}

const NODE_BY_ID = new Map <NodeSymbol, NoduleInfo>()

function findNodeByEdge (edge: EdgeInfo) {
  const entry = Array.from (NODE_BY_ID.entries())
    .find (([ , node ]) => node.edge.equals (edge))
  return entry?.[0]
}

export class NodeEdgePointer extends Pointer <EdgeInfo> {
  constructor (
    public readonly node: NodeSymbol,
  ) {
    super()
  }
}

export class NodePointer extends Pointer <NodeSymbol> {
  constructor (
    public readonly edge: EdgeInfo,
  ) {
    super()
  }
}

export class NodeStatusSubject extends Pointer <Status> {
  constructor (
    public readonly node: NodeSymbol, 
    public readonly status: Status,
  ) {
    super()
  }
}

onPerform (NodeStatusSubject, function* ({ node, status }) {
  const prev = NODE_BY_ID.get (node)
  if (! prev) throw new Error ("[StatusSubject] prev not found")
  NODE_BY_ID.set (node, prev.withStatus (status))
  yield new DoneSubject (prev.edge)
})

onPerform (NodePointer, function* ({ edge }) {
  const found = findNodeByEdge (edge)
  if (found) return found

  const node = new NodeSymbol()
  NODE_BY_ID.set (node, new DirtyNodule (edge, []))
  return node
})

onPerform (NodeEdgePointer, function* ({ node }) {
  const found = NODE_BY_ID.get (node)
  if (!found) throw new Error ("[NodeEdgePointer] not found")
  return found.edge
})

onPerform (StatusPointer, function* ({ signal }) {
  /* TODO: Check Suspense
  const suspended = state.suspenses.find (x => x.task === task.id)
  if (suspended) {
    // console.log ("[reduceAtom] suspended")
    effect.return (suspended.status)
    return state
  }
  */

  const edge = yield* new EntryEdgePointer (signal)
  const node = yield* new NodePointer (edge)

  yield new ExecuteSubject (node)
  
  const nodule = NODE_BY_ID.get (node)
  if (nodule instanceof CleanNodule) {
    return nodule.status
  }
  throw new Error ("No clean Nodule")
})

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

  withStatus (status: Status) {
    console.log ("--- WITH STATUS ---")
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

/* Half-Baked Future
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
*/


// PHASES

export abstract class PhaseInfo {}

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