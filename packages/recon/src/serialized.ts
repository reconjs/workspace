import { defineHook } from "./hooks"
import { Serial } from "@reconjs/utils"
import { Manifest } from "./manifest"

export type SerializedNode = {
  __RECON__: "runtime",
  debugLabel?: string,
  scopes: Array <{ key: string, value: Serial }>,
  manifests: Record <string, Manifest>,
  data: Record <string, Array <{
    value?: Serial,
    error?: string,
    args: Serial[],
    scopes: Record <string, Serial>,
  }>>,
}

export const usingSerializedNode = defineHook ((): SerializedNode => {
  throw new Error ("Not implemented")
})

// @ts-ignore
usingSerializedNode.debugLabel = "usingSerializedNode"
