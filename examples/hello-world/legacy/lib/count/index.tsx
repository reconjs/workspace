import { defineSync } from "@reconjs/core"
import {
  defineStore,
  usingSsrHack,
  viaClientHooks,
} from "@reconjs/react"

// Avoids unnecessary errors being thrown by React
const { useState } = viaClientHooks (() => import ("react"))

// We can define values synchronously
const usingInitialCount = defineSync (() => {
  return () => {
    return 0
  }
})

// We can use React hooks outside of Views for logic
export const usingCountStore = defineStore (() => {
  const theInitialCount = usingInitialCount ()

  // SSR and defineStore are incompatible right now,
  // this is the workaround.
  const ssrable = usingSsrHack (() => {
    function setCount (next: number) {
      throw new Error ("Cannot call setCount during SSR")
    }

    const count = theInitialCount ()
    return [ count, setCount ] as const
  })

  return ssrable (() => {
    const count = theInitialCount ()
    return useState (count)
  })
})
