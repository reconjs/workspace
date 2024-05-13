import { viaDeferredView } from "@reconjs/react"

export const usingSwatchItem = viaDeferredView (
  "@/lib/merch/picker-view/swatch-item/recon", 
  () => import (".")
)
