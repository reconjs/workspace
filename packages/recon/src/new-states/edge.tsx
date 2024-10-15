import { onPerform, Subject } from "../machine"
import { NodeSymbol } from "./node"
import { ScopeSymbol } from "./scope"
import { Signal } from "./signal"
import { Func, range } from "@reconjs/utils"

export class EdgeSymbol {}

export class EdgeInfo {
  constructor (
    public readonly scope: ScopeSymbol,
    public readonly proc: Func,
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

export class CleanEdge extends EdgeInfo {
  constructor (
    scope: ScopeSymbol,
    proc: Func,
    args: ParamInfo[],
  ) {
    super (scope, proc, args)
  }
}

/* TODO: Revise after port over
export class EdgeSubject extends Subject <EdgeSymbol> {
  constructor (
    public readonly scope: ScopeSymbol,
    public readonly proc: ProcSymbol,
    public readonly args: Arg[],
  ) {
    super()
  }
}

onPerform (EdgeSubject, function* ({ scope, proc, args }) {
  const found = EdgeStore.self.edge.get (scope)
  if (found) return found

  // create new Edge
  const edge = new EdgeSymbol()
  SCOPE_BY_SYMBOL.set (edge, scope)
  PROC_BY_SYMBOL.set (edge, proc)
  ARGS_BY_SYMBOL.set (edge, args)
  EDGES_BY_EDGE.set (edge, [])
  return edge
})



// INTERNALS

class EdgeStore {
  static readonly self = new EdgeStore()

  // TODO: Make a WeakMap equivalent
  readonly edges = new Map <EdgeSymbol, Edge>()

  readonly #byEdge = new WeakMap <EdgeSymbol, Set <EdgeSymbol>>()
  readonly #byNode = new WeakMap <NodeSymbol, Set <EdgeSymbol>>()

  byEdge (edge: EdgeSymbol) {
    const found = this.#byEdge.get (edge)
    if (found) return found
    
    const edges = new Set <EdgeSymbol>()
    this.#byEdge.set (edge, edges)
    return edges
  }

  byNode (node: NodeSymbol) {
    const found = this.#byNode.get (node)
    if (found) return found
    
    const edges = new Set <EdgeSymbol>()
    this.#byNode.set (node, edges)
    return edges
  }
}
abstract class Arg {}
abstract class CleanArg extends Arg {}

class EdgeArg extends Arg {
  constructor (public readonly edge: EdgeSymbol) {
    super()
  }
}

class ValueArg extends CleanArg {
  constructor (public readonly value: any) {
    super()
  }
}

// #endregion
*/

// #endregion

// #region Params

/*
 * lazily, broadly resolvable
 */
export abstract class ArgInfo {
  abstract equals (other: ArgInfo): boolean
}

export class AtomArg extends ArgInfo {
  constructor (
    public readonly scope: ScopeSymbol,
    public readonly proc: Func,
    public readonly args: ArgInfo[],
  ) {
    super()
  }

  equals (other: ArgInfo) {
    if (! (other instanceof AtomArg)) return false
    if (this.scope !== other.scope) return false
    if (this.proc !== other.proc) return false
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
export abstract class ParamInfo extends ArgInfo {}

export class AtomParam extends ParamInfo {
  constructor (
    public readonly scope: ScopeSymbol,
    public readonly proc: Func,
    public readonly args: ParamInfo[],
  ) {
    super()
  }

  equals (other: ArgInfo) {
    if (! (other instanceof AtomParam)) return false
    if (this.scope !== other.scope) return false
    if (this.proc !== other.proc) return false
    if (this.args.length !== other.args.length) return false
    for (const i of range (this.args.length)) {
      if (!this.args[i].equals (other.args[i])) return false
    }
    return true
  }
}

export class ValueParam extends ParamInfo {
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

// #endregion

