import { ReconComponent, define } from "@reconjs/internals"
import { Func } from "@reconjs/utils"

export { get$, provide$ } from "./hooks"
export { List$ } from "./list"
export { Model$ } from "./model"
export { Scope$ } from "./scope"
export { Value$ } from "./value"

export { isReconRunning } from "@reconjs/internals"

const COMPONENTS = {} as Record <string, any>

if (typeof window !== "undefined") {
  (window as any).__RECON_COMPONENTS__ = COMPONENTS
}

export default function recon (key: string) {
  let i = 0

  const $: Func = (...args) => {
    const res = define (...args)
    COMPONENTS [`${key}+${i++}`] = res
    return res
  }

  return $ as typeof define
}
