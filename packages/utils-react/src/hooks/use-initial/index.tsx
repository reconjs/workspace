"use client"

import { useRef } from "react"

const NEVER = {} as any

/**
 * @example
 * ```js
 * function ChangedStatus ({ count }) {
 *   const initialCount = useInitial (() => count)
 *   const hasChanged = count !== initialCount
 *   return <div>{hasChanged ? "Changed" : "Not Changed"}</div>
 * }
 * ```
 */
export function useInitial <T> (factory: () => T) {
  const ref = useRef <T> (NEVER)

  if (ref.current === NEVER) {
    ref.current = factory()
  }

  return ref.current
}
