import { viaRecon } from "@reconjs/core"

export { usingColorSelector } from "./store"

export const {
  usingSelectedColor,
} = viaRecon (
  "@/lib/merch/product/selected/color/state",
  () => import ("@/lib/merch/product/selected/color/state")
)
