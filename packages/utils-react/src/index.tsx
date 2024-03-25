export * from "./browser-boundary"
export * from "./display-names"
export * from "./error-boundary"
export * from "./hooks"
export * from "./navbar"
export * from "./optional"
export * from "./queryify"
export * from "./types"

import React, { Context } from "react"

export const RSC = true

type Func = (...args: any[]) => any

export const useState: typeof React.useState = () => {
  throw new Error ("useState does not work in RSC")
}

// TODO: What if we use server-side loadPromise?
export function useInitial <T> (factory: () => T) {
  console.log ("[useInitial] RSC variant")
  return factory()
}

export function useEvent <T extends Func> (func: T) {
  return useInitial (() => func)
}

export function useStaticFunction <T extends Func> (func: T) {
  return useInitial (() => func)
}

export const useSyncExternalStore: typeof React.useSyncExternalStore = 
  (subscribe, getSnapshot, getServerSnapshot) => (getServerSnapshot ?? getSnapshot)()

export const createClientContext: typeof React.createContext = (): any => {
  return {
    Provider: () => {
      throw new Error ("Cannot call createContext on the server")
    },
  }
}

export const useContext: typeof React.useContext = () => {
  throw new Error ("Cannot call useContext on the server")
}

export const useEffect: typeof React.useEffect = () => {
  throw new Error ("Cannot call useEffect on the server")
}

export const useTransition: typeof React.useTransition = () => {
  throw new Error ("Cannot call useTransition on the server")
}

export function useMounted (): boolean {
  throw new Error ("Cannot call useMounted on the server")
}

export const useUpdateEffect: typeof React.useEffect = () => {
  throw new Error ("Cannot call useUpdateEffect on the server")
}
