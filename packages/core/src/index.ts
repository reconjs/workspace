import { define } from "@reconjs/recon"
export { isReconRunning } from "@reconjs/recon"

export default function recon (key: string) {
  return define
}

export { Value$ } from "./value"



// Legacy

export { Model } from "@reconjs/recon"

export type { Collection, Optional } from "./adapters"

export { usingBroadly, usingCollection, usingOptional } from "./adapters"
export { defineSync, defineAsync } from "./atom"
export { defineAction, defineEvent } from "./emit"
export { defineModel } from "./model"
export { defineScope, usingScope } from "./scope"
export { viaRecon, viaServer } from "./via-import"
