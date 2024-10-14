import { onPerform, Subject } from "../machine"
import { GeneratorFunction } from "../types"
import { PopSubject, PushSubject } from "./dispatcher"
import { EdgeInfo, ValueParam } from "./edge"
import { EntryEdgePointer } from "./entrypoint"
import { NodeEdgePointer, NodeSymbol, NodeStatusSubject } from "./node"
import { Fulfilled, Pending, Rejected } from "./signal"

export class TaskSymbol {}

export class ExecuteSubject extends Subject {
  constructor (
    public readonly node: NodeSymbol,
  ) {
    super()
  }
}

export class EnqueueSubject extends Subject {
  constructor (public readonly signal: any) {
    super()
  }
}

const EDGE_BY_TASK = new Map <TaskSymbol, EdgeInfo>()

function findTaskByEdge (edge: EdgeInfo) {
  const found = Array.from (EDGE_BY_TASK.entries())
    .find (([ , x ]) => x.equals (edge))
  return found?.[0]
}

onPerform (ExecuteSubject, function* ({ node }) {
  const edge = yield* new NodeEdgePointer (node)
  const task = findTaskByEdge (edge)
  if (!task) return

  yield new PushSubject (task)
  try {
    const args = edge.args.map (arg => {
      if (arg instanceof ValueParam) {
        return arg.value
      }
  
      throw new Error ("Atom parameters are not yet supported")
    })

    const { proc } = edge

    let result: any
    if (proc instanceof GeneratorFunction) {
      // TODO: Intercept effects?
      result = yield* proc (...args)
    }
    else {
      result = proc (...args)
    }

    if (result instanceof Promise) {
      yield new NodeStatusSubject (node, new Pending (result))
    }
    else {
      yield new NodeStatusSubject (node, new Fulfilled (result))
    }
  }
  catch (thrown) {
    if (thrown instanceof Promise) {
      // TODO: Add Suspense back in.
      // const status = new Pending (thrown)
      // yield* new SuspenseEffect (status)
    }
    yield new NodeStatusSubject (node, new Rejected (thrown))
  }
  finally {
    yield new PopSubject (task)
  }
})

onPerform (EnqueueSubject, function* ({ signal }) {
  console.log ("EnqueueSubject")

  const edge = yield* new EntryEdgePointer (signal)
  const task = findTaskByEdge (edge)
  if (task) return

  const symbol = new TaskSymbol()
  EDGE_BY_TASK.set (symbol, edge)
})