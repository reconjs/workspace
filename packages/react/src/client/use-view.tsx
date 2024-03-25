import { memoize } from "@reconjs/utils"
import { Atoms, createNode } from "@reconjs/recon"
import { memo, useMemo } from "react"

import { AnyViewDef } from "../types"
import { useReconRuntime } from "./runtime-context"

// TODO: useReconRuntime should be a child factory?

const componentBy = memoize ((def: AnyViewDef, ...atoms: Atoms) => {
  const getNode = memoize (createNode)

  return memo ((props) => {
    const parent = useReconRuntime ()

    const View = useMemo (() => {
      const runtime = getNode (parent)
      return runtime.exec (() => def (...atoms))
    }, [])

    return <View {...props} />
  })
})

export function useClientView (definition: AnyViewDef, ...atoms: Atoms) {
  for (const atom of atoms) {
    try {
      if (atom.__RECON__ !== "atom") {
        throw new Error ("[useClientView] Invalid atom (__RECON__ is not atom)")
      }
      if (typeof atom !== "function") {
        throw new Error ("[useClientView] Invalid atom (not a function)")
      }
    }
    catch (err) {
      console.error ("[useClientView] atom =", atom)
      throw err
    }
  }

  return componentBy (definition, ...atoms)
}
