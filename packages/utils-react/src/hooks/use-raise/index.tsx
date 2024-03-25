"use client"

import { useReducer } from "react"

function reducer (state: undefined, action: any) {
  if (action !== undefined) throw action
  return action
}

export function useRaise () {
  const [ , dispatch ] = useReducer (reducer, undefined)
  return dispatch
}
