import {
  Atom,
  Atomizable,
  Modelable,
  Recon,
  ReconHook,
  ReconHookResolver,
  usingDefinedSync,
  usingPrepasser,
} from "@reconjs/recon"
import { memoize } from "@reconjs/utils"

const execBy = memoize ((hook: ReconHook) => {
  return (...args: any[]) => {
    const resolver = hook.factory (...args) as ReconValueResolver
    return resolver.evaluate
  }
})

class ReconValueResolver <
  T extends Atomizable = Atomizable
> extends ReconHookResolver <Recon <T>> {
  evaluate: () => T

  constructor (evaluate: () => T) {
    super ()
    this.evaluate = evaluate
  }

  resolve = (..._args: Recon[]): Recon <T> => {
    const args = _args as any[] as Atom <Modelable>[]

    const exec = execBy (this.hook)
    const prepass = usingPrepasser ()

    if (prepass) {
      prepass (exec, ...args)
      
      const res = (): any => {
        throw new Error ("You aren't supposed to call this.")
      }

      res.__RECON__ = "local" as const
      return res
    }
    else {
      // TODO: move away from atoms
      const atom = usingDefinedSync (exec, ...args)
      return atom as any
    }
  }
}

export function Value$ <T extends Atomizable> (evaluate: () => T) {
  return new ReconValueResolver <T> (evaluate)
}
