import { viaServer } from "@reconjs/core"

export const {
  usingAddToCart,
  usingCountForSkudata,
  usingIncrementCountForSkudata,
} = viaServer (
  "@/lib/merch/skudata/cart-count/data/recon",
  () => import ("@/lib/merch/skudata/cart-count/recon")
)
