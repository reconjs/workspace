import { defineHook } from "./hooks"

export abstract class ReconMode {}

export const usingMode = defineHook ((): ReconMode => {
  throw new Error ("Not implemented")
})

// @ts-ignore
usingMode.debugLabel = "usingMode"
