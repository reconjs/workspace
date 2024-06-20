import {
  usingConstant,
  usingAtom,
  AdaptedSync,
  usingChild,
  ModelClass,
  InferClassModel,
  handleAtoms,
  Atom,
  Modelable,
} from "@reconjs/internals"

import { Func, loadPromise } from "@reconjs/utils"
import { usingFunction } from "./utils"

function createModeled <M extends ModelClass> (
  model: M,
  value: string,
): InferClassModel <M> {
  // @ts-ignore
  return {
    __RECON__: "modeled",
    model,
    value,
  }
}

export function usingDefined_default (
  factory: Func, ...args: Atom <Modelable>[]
) {
  const runtime = usingChild ()

  const getModels = usingFunction (() => {
    return args.map (a => createModeled (a.model, a() as any))
  })

  const getAdapted = usingFunction (() => {
    const models = getModels ()
    
    return runtime.exec (() => {
      const flush = handleAtoms ()
      const res = factory (...models)

      // AdaptedSync
      return usingConstant (() => {
        const adapted: Partial <AdaptedSync> = () => {
          flush ()
          return res ()
        }

        adapted.__RECON__ = "adapted"
        adapted.model = res.model
        return adapted as AdaptedSync
      })
    })
  })

  const atom = usingAtom (() => {
    const adapted = getAdapted ()
    return adapted ()
  })

  usingConstant (() => {
    const adapted = getAdapted ()
    atom.model = adapted.model
  })

  return atom
}

export function usingDefinedAsync_default (
  factory: Func, ...args: Atom <Modelable>[]
) {
  const runtime = usingChild ()

  const getModels = usingFunction (() => {
    return args.map (a => createModeled (a.model, a() as any))
  })

  const getAdapted = usingFunction (() => {
    const models = getModels ()
    
    return runtime.exec (() => {
      const flush = handleAtoms ()
      const res = factory (...models)

      // AdaptedAsync
      return usingConstant (() => {
        const adapted: Partial <AdaptedSync> = () => {
          flush ()
          return res ()
        }

        adapted.__RECON__ = "adapted"
        adapted.model = res.model
        return adapted as AdaptedSync
      })
    })
  })

  const getResult = usingFunction (() => {
    const adapted = getAdapted ()
    return adapted ()
  })

  const atom = usingAtom (() => {
    const res = getResult ()
    if (res instanceof Promise) {
      return loadPromise (res)
    }
    return res
  })

  usingConstant (() => {
    const adapted = getAdapted ()
    atom.model = adapted.model
  })

  return atom
}
