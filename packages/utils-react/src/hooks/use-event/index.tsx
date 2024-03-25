"use client"

import { useCallback, useRef } from "react"

type Vunc = (...args: any[]) => void

export function useEvent <T extends Vunc> (callback: T): T {
  const ref = useRef (callback)
  ref.current = callback
  
  const wrapped: Vunc = (...args) => {
    const res: any = ref.current (...args)
    if (res instanceof Promise) {
      console.warn ("useEvent callback should not be an async function")
    }
    else if (res !== undefined) {
      console.warn ("useEvent callback should return void")
    }
  }
  
  return useCallback (wrapped as T, [])
}

export function useStaticFunction <T extends Vunc> (callback: T): T {
  const ref = useRef (callback)
  ref.current = callback
  
  const wrapped: Vunc = (...args) => {
    const res: any = ref.current (...args)
    return res
  }
  
  return useCallback (wrapped as T, [])
}
