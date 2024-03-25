export * from "./browser-boundary"
export * from "./display-names"
export * from "./error-boundary"
export * from "./hooks"
export * from "./navbar"
export * from "./optional"
export * from "./queryify"
export * from "./types"
export * from "./use-mounted"

export {
  useContext,
  useEffect,
  useState, 
  useSyncExternalStore, 
  createContext as createClientContext,
  useTransition,
} from "react"

import React from "react"

export const RSC = false

export const createServerContext: typeof React.createServerContext = () => {
  throw new Error ("[createServerContext] only in RSC")
}
