import { range } from "@reconjs/utils"
import { onPerform, Subject } from "../machine"
import { EdgeSymbol } from "./edge"
import { ScopeSymbol } from "./scope"

/* TODO: Revise after port over
export class ProcSymbol {}

export class AspectSymbol {}

abstract class Aspect {}

const ASPECTS = new Map <AspectSymbol, Aspect>()
const SYMBOLS = new Map <ProcSymbol, Set<AspectSymbol>>()

export class AspectsSubject extends Subject <AspectSymbol> {
  constructor (
    public readonly proc: ProcSymbol,
    public readonly scope: ScopeSymbol,
    public readonly args: any[],
  ) {
    super ()
  }
}

function symbolsOf (proc: ProcSymbol, init: () => AspectSymbol[]) {
  const found = SYMBOLS.get (proc)
  if (found) return found

  const aspects = new Set <AspectSymbol> (init())
  SYMBOLS.set (proc, aspects)
  return aspects.values()
}

onPerform (AspectsSubject, function* ({ proc, scope, args }) {
  const argAspects = []
  for (const index of range (args.length)) {
    const arg = args [index]

    if (arg.__recon === "signal") {
      const proc = yield* new SignalProcSubject (arg)
      argAspects.push (new SignalArgAspect (index, proc))
    }
    else {
      argAspects.push (new ValueArgAspect (index, arg))
    }
  }

  const symbols = symbolsOf (proc, () => {
    const argAspects = args.map ((arg, index) => {
      if (arg instanceof ) {
        return new EdgeArgAspect (index, arg.edge)
      } else {
        return new ValueArgAspect (index, arg)
      }
    })

    return [
      new ScopeAspect (scope),
      ...argAspects,
    ]
  })

  const aspects = SYMBOLS.get (proc)
  if (aspects) return

  const aspect = new 

  for (const aspect of aspects) {
    yield aspect
  }
})

// #region Auxiliary Classes

class ScopeAspect extends Aspect {
  constructor (
    public readonly scope: ScopeSymbol,
  ) {
    super()
  }
}

class SignalArgAspect extends Aspect {
  constructor (
    public readonly index: number,
    public readonly proc: ProcSymbol,
  ) {
    super()
  }
}

class ValueArgAspect extends Aspect {
  constructor (
    public readonly index: number,
    public readonly type: string,
  ) {
    super()
  }
}

// #endregion
*/
