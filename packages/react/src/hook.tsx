import { 
  Atom, 
  Modelable, 
  Recon, 
  ReconComponent, 
  ReconResolver, 
  usingPrepasser,
} from "@reconjs/recon"
import { Func, Jsonny, memoize } from "@reconjs/utils"
import { usingStore } from "./legacy/define-store"

type Jsonified <T> = T extends Jsonny 
  ? T
  : T extends any[] ? {
    [K in keyof T]: Jsonified <T[K]>
  }
  : T extends Record <string|number, any> ? {
    [K in keyof T]: Jsonified <T[K]>
  }
  : null

const execBy = memoize (({ factory }: ReconComponent) => {
  return (..._args: any[]) => {
    const args: Recon[] = _args.map ((arg: any) => {
      if (arg.__RECON__ === "modeled") {
        const res: any = () => arg.value
        res.__RECON__ = "local"
        return res
      }
      
      return arg
    })

    const resolver = factory (...args) as ReconStoreResolver
    return resolver.use
  }
})

class ReconStore <T = any> {
  component: ReconComponent <T>
  args: Recon[]

  constructor (component: ReconComponent, ...args: Recon[]) {
    if (args.length) {
      throw new Error ("args support not implemented")
    }

    this.component = component
    this.args = args
  }

  use = () => {
    const exec = execBy (this.component)
    const prepass = usingPrepasser ()

    if (prepass) {
      // TODO: include args
      prepass (exec, ...this.args)
      
      return (): T => {
        throw new Error ("You aren't supposed to call this.")
      }
    }
    else {
      const atoms = this.args as any[] as Atom<Modelable>[]
      const atom = usingStore (exec, ...atoms)
      return (): T => {
        return atom()
      }
    }
  }

  resolve = (): Recon <Jsonified <T>> => {
    const exec = execBy (this.component)
    const prepass = usingPrepasser()

    if (prepass) {
      // TODO: include args
      prepass (exec)
      
      const res: any = () => {
        throw new Error ("You aren't supposed to call this.")
      }

      res.__RECON__ = "local" as const
      return res
    }
    else {
      const atoms = this.args as any[] as Atom<Modelable>[]
      const atom = usingStore (exec, ...atoms) as any
      return atom as any
    }
  }
}

type InferType <
  S extends ReconStore
> = S extends ReconStore <infer T> ? T : never

class ReconStoreResolver <
  T = any
> extends ReconResolver <ReconStore <T>> {
  use: () => T

  constructor (use: () => T) {
    super ()
    this.use = use
  }

  resolve = (...args: Recon[]) => {
    return new ReconStore <T> (this.component, ...args)
  }
}

export function Hook$ <T> (use: () => T) {
  return new ReconStoreResolver <T> (use)
}

export function use$ <
  S extends ReconStore,
> (store: S): () => InferType <S> {
  if (!store?.use) throw new Error ("[use$] invalid argument")
  return store.use()
}
