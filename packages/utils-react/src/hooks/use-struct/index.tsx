"use client"

import { isEqualShallow } from "@reconjs/utils"

import { useInitial } from "../use-initial"
import { DependencyList, useMemo } from "react"

/**
 * @param obj - Any dictionary
 * @returns a shallowly memoized copy of the argument
 * 
 * @example
 * ```js
 * function RedBox () {
 *   // prevents re-renders
 *   const style = useStruct ({
 *     width: 100,
 *     height: 100,
 *     backgroundColor: "red",
 *   })
 * 
 *   return <div style={style} />
 * }
 * ```
 */
export function useStruct <T extends Record <string, any>> (obj: T) {
  const keys = useInitial (() => Object.keys (obj))

  if (process.env.NODE_ENV === "development") {
    const currKeys = Object.keys (obj)
    console.assert (isEqualShallow (keys, currKeys), "useStruct requires constant keys")
  }

  const deps: DependencyList = keys.map (key => obj[key])

  return useMemo (() => obj, deps)
}
