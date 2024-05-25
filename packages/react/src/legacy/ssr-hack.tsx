import { defineHook, handleHook, usingChild, usingDefinedSync, usingHandler } from "@reconjs/recon"
import { Func0 } from "@reconjs/utils"
import { handleStore } from "./define-store"
import { RSC } from "@reconjs/utils-react"

const NOT_WINDOW = {}

const getWindow = (): Window & Record <string, any> => {
  if (typeof window !== "undefined") return window
  return NOT_WINDOW as any
}

function isBrowser () {
  return getWindow() !== NOT_WINDOW
}



function _usingSsrHack <F extends Func0> (factory: F) {
	return (handler: F) => handler
}

export const usingSsrHack = defineHook (_usingSsrHack)

export function handleSsrHack () {
  if (RSC) return
  if (isBrowser ()) return

  handleHook (usingSsrHack, (factory) => {
    return () => factory
  })

  handleStore ((factory, ...args) => {
    return usingDefinedSync (factory, ...args)
  })
}
