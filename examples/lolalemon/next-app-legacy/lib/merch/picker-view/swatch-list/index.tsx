import { viaDeferredView } from "@reconjs/react"

export const usingSwatchList = viaDeferredView (
  "@/lib/merch/picker-view/swatch-list/recon", 
  () => import ("./recon")
)
