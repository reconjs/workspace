import { define } from "@reconjs/recon"

export { get$, provide$ } from "./hooks"
export { List$ } from "./list"
export { Model$ } from "./model"
export { Scope$ } from "./scope"
export { Value$ } from "./value"

export { isReconRunning } from "@reconjs/recon"

export default function recon (key: string) {
  return define
}
