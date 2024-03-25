import { viaDeferredView } from "@reconjs/react"

export const usingProductCard = viaDeferredView (
  "@/lib/merch/product-card/recon",
  () => import ("@/lib/merch/product-card/recon")
)
