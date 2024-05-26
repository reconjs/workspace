import {
  AnyPrimitive,
  Atom,
  Modelable,
  Recon,
  ReconComponent,
  ReconResolver,
  ReconProvider,
  provide,
  usingPrepasser,
  usingProvided,
} from "@reconjs/recon"
import { memoize } from "@reconjs/utils"

const providerBy = memoize ((hook: ReconComponent) => {
  const provider: Partial <ReconProvider> = () => {
    throw new Error ("No calling this")
  }

  provider.consume = () => {
    console.group ("--- CONSUME ---")
    const resolver = hook.factory () as ReconScopeResolver
    console.groupEnd ()
    return resolver.result as any
  }

  provider.__RECON__ = "provider"
  return provider as ReconProvider
})

class ReconScope <T extends AnyPrimitive = AnyPrimitive> {
  hook: ReconComponent <T>
  args: Recon[]

  constructor (hook: ReconComponent, ...args: Recon[]) {
    if (args.length) {
      throw new Error ("args support not implemented")
    }

    this.hook = hook
    this.args = args
  }

  provide = (ref: T) => {
    const atom = ref as any as Atom <Modelable>
    const provider = providerBy (this.hook)

    const prepass = usingPrepasser ()
    if (prepass) {
      // TODO:
    }
    else {
      provide (provider, atom)
    }
  }

  resolve = (): Recon <T> => {
    const provider = providerBy (this.hook)
    const prepass = usingPrepasser ()

    if (prepass) {
      // TODO: include args
      prepass (provider.consume)
      
      const res: any = () => {
        throw new Error ("You aren't supposed to call this.")
      }

      res.__RECON__ = "local" as const
      return res
    }
    else {
      return usingProvided (provider) as any
    }
  }
}

type InferRecon <R extends Recon> = R extends Recon <infer T> ? T : never

class ReconScopeResolver <
  T extends AnyPrimitive = AnyPrimitive,
> extends ReconResolver <ReconScope <T>> {
  result: Recon <T>

  constructor (result: Recon <T>) {
    super ()
    this.result = result
  }

  resolve = (...args: Recon[]) => {
    return new ReconScope <T> (this.hook, ...args)
  }
}

export function Scope$ <T extends Recon> (ref: T) {
  return new ReconScopeResolver <InferRecon <T>> (ref)
}
