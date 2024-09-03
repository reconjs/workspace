import {
  Atom,
  handleAtoms,
  handleHook,
  usingAtom,
  usingChild,
  usingConstant,
  usingServerAtom,
  usingServerImport,
} from "@reconjs/internals"
import { AnyFunction, loadPromise, susync } from "@reconjs/utils"
import { handleServerImport } from "./server-import"

function usingRef <T = any> () {
  return usingConstant (() => ({
    current: undefined as any as T,
  }))
}

function usingFunction <T> (factory: () => T): () => T {
  const ref = usingRef ()

  return usingConstant (() => () => {
    ref.current ||= factory ()
    return ref.current
  })
}


// SERVER

export function handleServer () {
  const getImport = handleServerImport ()

  handleHook (usingServerAtom, (key, ...args) => {
    const runtime = usingChild ()

    const getPromise = usingFunction (() => susync (() => {
      const usingHook = getImport (key)

      const res = runtime.exec (() => {
        const flush = handleAtoms ()
        const atom = usingHook (...args) as Atom

        if (atom.__RECON__ !== "atom") {
          throw new Error ("hook did not return an atom")
        }

        return { atom, flush }
      })

      res.flush ()
      return res.atom
    }))

    return usingAtom (() => {
      const atom = loadPromise (getPromise ())
      return atom()
    })
  })
}
