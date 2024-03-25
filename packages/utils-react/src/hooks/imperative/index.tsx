"use client"

import {
  ForwardedRef,
  useCallback,
  useImperativeHandle,
  useRef, 
} from "react"
import { useEvent } from "../use-event"
import { InputHandle } from "../../types"

type Inputable = HTMLInputElement
  | HTMLTextAreaElement
  | HTMLSelectElement

const DEFAULT_VALUE = {} as any

export function useImperativeRef <T, R> (
  read: (curr: T) => R,
) {
  const readRef = useRef (read)
  readRef.current = read
  const valueRef = useRef <T> (DEFAULT_VALUE)

  const setRef = useEvent ((initial: T) => {
    if (valueRef.current === initial) return
    if (valueRef.current !== DEFAULT_VALUE) {
      console.warn ("Re-assigning imperative ref")
    }
    valueRef.current = initial
  })

  const reader = useCallback (() => {
    if (valueRef.current === DEFAULT_VALUE) {
      throw new Error ("Attempted to access ref value before it's ready")
    }
    return read (valueRef.current)
  }, [])

  return [ reader, setRef ] as const
}

export function useInputHandle <T extends Inputable> (
  ref: ForwardedRef <InputHandle>
) {
  const [ getValue, setRef ] = useImperativeRef ((el: T) => {
    return el.value
  })

  useImperativeHandle (ref, () => ({ getValue }), [])

  return setRef
}
