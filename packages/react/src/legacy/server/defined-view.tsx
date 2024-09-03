import { Fragment, FunctionComponent } from "react"

import {
  Atom,
  Atoms, 
  InferClassModel, 
  ModelClass, 
  Modeled,
  createNode,
  usingChild,
  usingConstant, 
} from "@reconjs/internals"

import { loadPromise, memoize, susync } from "@reconjs/utils"

import {
  AnyListAtom,
  AnyViewFactory,
  ListViewFactory,
  NestedViewFactory,
} from "../types"

function createModelableAtom <M extends ModelClass> (
  model: M, 
  value: string
): Atom <InferClassModel <M>> {
  const res: Partial <Atom> = () => value
  res.__RECON__ = "atom"
  res.model = model
  return res as any
}

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

function toModeled (atom: Atom): Modeled {
  return {
    __RECON__: "modeled",
    get model () {
      return atom.model as any
    },
    get value () {
      return atom ()
    },
    get collection () {
      // @ts-ignore
      return atom.collection
    },
    get optional () {
      // @ts-ignore
      return atom.optional
    },
    // @ts-ignore
    get variable () {
      // @ts-ignore
      return atom.variable
    },
  }
}




export function usingDefinedServerView (
  factory: AnyViewFactory, 
  ...atoms: Atoms
): FunctionComponent <any> {
  const runtime = usingChild ()

  const args = usingConstant (() => atoms.map (toModeled))

  const getPromise = usingFunction (() => susync (() => {
    runtime.exec (() => {
      factory (...args)
    })
  }))

  loadPromise (getPromise ())
  return Fragment
}



// Inline

function usingViewRunner (factory: NestedViewFactory) {
  const parent = usingChild ()

  const runtimeBy = usingConstant (() => memoize ((value: any) => {
    return createNode (parent)
  }))

  return usingConstant (() => memoize ((value) => {
    const runtime = runtimeBy (value)

    return runtime.exec (() => {
      const child = usingChild ()

      const getPromise = usingFunction (() => susync (() => {
        child.exec (() => {
          factory (value)
        })
      }))
  
      return getPromise ()
    })
  }))
}



// TODO: Will this work with eager?
export function usingNestedServerView (
  atom: Atom,
  factory: NestedViewFactory,
): FunctionComponent <any> {
  const getPromise = usingViewRunner (factory)

  const value = atom ()
  loadPromise (getPromise (value))
  // console.log ("[usingNestedServerView]", value)
  return Fragment
}



export function usingServerListView (
  atom: AnyListAtom,
  func: ListViewFactory,
): FunctionComponent <any> {
  const atomBy = usingConstant (() => memoize ((value: any) => {
    return createModelableAtom (atom.model, value)
  }))

  const factory = usingConstant (() => (value: any) => {
    return func (atomBy (value))
  })

  const getBy = usingViewRunner (factory)

  const values = atom ()
  const getPromise = usingFunction (async () => {
    await Promise.all (values.map (val => getBy (val)))
  })

  loadPromise (getPromise ())
  return Fragment
}
