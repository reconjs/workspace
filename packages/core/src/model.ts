import {
  Atom,
  Modelable,
  Recon,
  ReconComponent,
  ReconResolver,
  ReconType,
  usingDefinedSync,
  usingPrepasser,
} from "@reconjs/internals"
import { memoize } from "@reconjs/utils"

const execBy = memoize ((hook: ReconComponent) => {
  return (..._args: any[]) => {
    const args: Recon[] = _args.map ((arg: any) => {
      if (arg.__RECON__ === "modeled") {
        const res: any = () => arg.value
        res.__RECON__ = "local"
        return res
      }
      
      return arg
    })
    
    const resolver = hook.factory (...args) as ReconModelResolver
    return resolver.evaluate
  }
})

type InferValue <
  T extends ReconType,
  R extends Recon = Recon <ReturnType <T>>
> = ReturnType <R>

// TODO: Associate the type to the hook...
class ReconModelResolver <
  T extends ReconType = ReconType
> extends ReconResolver <Recon <ReturnType <T>>> {
  type: T
  evaluate: () => InferValue <T>

  constructor (
    type: T,
    evaluate: () => InferValue <T>
  ) {
    super ()
    this.type = type
    this.evaluate = evaluate
  }

  resolve = (...args: Recon[]): Recon <ReturnType <T>> => {
    const atoms = args as any[] as Atom <Modelable>[]

    const exec = execBy (this.component)
    const prepass = usingPrepasser ()

    if (prepass) {
      return prepass (exec, ...args)
    }
    else {
      // TODO: move away from atoms
      const atom = usingDefinedSync (exec, ...atoms)
      return atom as any
    }
  }
}

export function Model$ <T extends ReconType> (
  type: T, 
  evaluate: () => InferValue <T>
) {
  return new ReconModelResolver <T> (type, evaluate)
}
