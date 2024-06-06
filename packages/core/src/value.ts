import {
  Recon,
  ReconResolver,
} from "@reconjs/recon"
import { Jsonny } from "@reconjs/utils"

class ReconValueResolver <
  T extends Jsonny = Jsonny
> extends ReconResolver <Recon <T>> {
  evaluate: () => T

  constructor (evaluate: () => T) {
    super ()
    this.evaluate = evaluate
  }

  prepass = () => {
    const res: any = () => {
      throw new Error ("PREPASS")
    }

    res.__RECON__ = "local"
    return res as Recon <T>
  }

  resolve = (...args: Recon[]) => {
    const resolver = this.component.factory (...args)
    const { evaluate } = resolver as ReconValueResolver <T>

    const res: any = () => {
      return evaluate()
    }

    res.__RECON__ = "local"
    return res as Recon <T>
  }
}

export function Value$ <T extends Jsonny> (evaluate: () => T) {
  return new ReconValueResolver <T> (evaluate)
}
