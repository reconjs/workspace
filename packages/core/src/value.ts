import {
  Atom,
  Modelable,
  Recon,
  ReconComponent,
  ReconResolver,
  usingDefinedSync,
  usingPrepasser,
} from "@reconjs/recon"
import { Jsonny, memoize } from "@reconjs/utils"

const execBy = memoize ((hook: ReconComponent) => {
  return (..._args: any[]) => {
    const args: Recon[] = _args.map ((arg: any) => {
      if (arg.__RECON__ === "modeled") {
        const res: any = () => {
          return arg.value
          throw new Error ("You aren't supposed to call this.")
        }
        
        res.__RECON__ = "local"
        return res
      }
      
      return arg
    })

    const resolver = hook.factory (...args) as ReconValueResolver
    return resolver.evaluate
  }
})

class ReconValueResolver <
  T extends Jsonny = Jsonny
> extends ReconResolver <Recon <T>> {
  evaluate: () => T

  constructor (evaluate: () => T) {
    super ()
    this.evaluate = evaluate
  }

  resolve = (...args: Recon[]): Recon <T> => {
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

export function Value$ <T extends Jsonny> (evaluate: () => T) {
  return new ReconValueResolver <T> (evaluate)
}
