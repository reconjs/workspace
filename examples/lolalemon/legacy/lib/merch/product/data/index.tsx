import { viaServer } from "@reconjs/core"

console.log ("[lib/merch/product/data]")

export const {
  usingNameForProduct,
  usingSlugForProduct,
  usingProductBySlug,
  usingProductImageUrl,
} = viaServer (
  "@/lib/merch/product/data/recon",
  () => import ("@/lib/merch/product/data/recon")
)
