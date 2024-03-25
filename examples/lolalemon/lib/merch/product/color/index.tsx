import { viaServer } from "@reconjs/core"

export const {
  usingColorsForProduct,
  usingProductImageForColor,
  usingProductSkudatasByColor,
} = viaServer (
  "@/lib/merch/product/color/recon",
  () => import ("@/lib/merch/product/color/recon")
)
