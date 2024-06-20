import { createNode, usingAtom, usingChild, usingConstant } from "@reconjs/internals"
import { Func, loadPromise, memoize } from "@reconjs/utils"

function usingRef <T = any> () {
  return usingConstant (() => ({
    current: undefined as any as T,
  }))
}

export function usingFunction <T> (factory: () => T): () => T {
  const ref = usingRef ()

  return usingConstant (() => () => {
    ref.current ||= factory ()
    return ref.current
  })
}

export function usingAtomLazily <T> (factory: () => Promise <T>) {
  const getPromise = usingFunction (async () => {
    return await factory ()
  })

  return usingAtom (() => {
    const promise = getPromise ()
    return loadPromise (promise)
  })
}

export function usingLazily <T> (factory: () => Promise <T>): () => T {
  const getPromise = usingFunction (factory)
  return () => loadPromise (getPromise ())
}

export function usingExecutableBy <T extends Func> (hook: T) {
  const parent = usingChild ()

  const getNode = usingConstant (() => memoize ((...args: any[]) => {
    return createNode (parent)
  }))

  const res = usingConstant <Func> (() => memoize ((...args: any[]) => {
    const node = getNode (...args)
    return node.exec (() => hook (...args))
  }))

  return res as T
}
