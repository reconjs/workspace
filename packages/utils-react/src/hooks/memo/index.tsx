"use client"

import { isEqual, isEqualShallow } from "@reconjs/utils"
import { useRef, useMemo, DependencyList } from "react"

export function useMemoDeep <T> (factory: () => T, deps?: DependencyList): T {
  const ref = useRef <T> (undefined as any)

  ref.current = useMemo (() => {
    const value = factory()
    return isEqual (ref.current, value) ? ref.current : value
  }, deps)

  return ref.current
}

export function useMemoShallow <T> (factory: () => T, deps?: DependencyList): T {
  const ref = useRef <T> (undefined as any)

  ref.current = useMemo (() => {
    const value = factory()
    return isEqualShallow (ref.current, value) ? ref.current : value
  }, deps)

  return ref.current
}
