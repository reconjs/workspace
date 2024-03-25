import { defineHook, usingConstant, handleHook } from "@reconjs/recon"
import { Depository } from "./using-query"
import { Store, createStore, isEqual, omit } from "@reconjs/utils"

const NOT_WINDOW = {}

const getWindow = (): Window & Record <string, any> => {
  if (typeof window !== "undefined") return window
  return NOT_WINDOW as any
}



function isEqualSansValue (alpha: any, bravo: any) {
  return isEqual (
    omit (alpha, "value"), 
    omit (bravo, "value"),
  )
}

export function mergeDepositorys (alpha: Depository, bravo: Depository) {
  if (!bravo || typeof bravo !== "object") return alpha
  const omega = { ...alpha }

  for (const key of Object.keys (bravo)) {
    omega[key] ||= []

    const recs = bravo[key]

    // remove duplicates
    omega[key] = omega[key].filter (old => {
      return !recs.find (rec => isEqualSansValue (old, rec))
    })

    omega[key].push (...recs)
  }

  const json = JSON.stringify (omega, null, 2)
  // console.log ("[mergeDepositorys]", json)
  return omega
}

export const usingDepository = defineHook ((): Store <Depository> => {
  throw new Error ("[usingDepository] not implemented")
})

export function handleDepository () {
  const store = usingConstant (() => {
    const res = createStore <Depository> (() => ({}))
    const { dispatch } = res
    res.dispatch = (depository: Depository) => {
      dispatch (mergeDepositorys (res.read(), depository))
    }

    getWindow().__RECON_DEPOSITORY__ = res

    return res
  })

  handleHook (usingDepository, () => store)
}
