import { usingScope, viaRecon } from "@reconjs/core"

export type {
  Color,
  Product,
  ProductSlug,
  Skudata,
} from "./recon"

export const {
  asaColor,
  asaProduct,
  asaProductSlug,
  asaSkudata,
  mountColor,
  mountProduct,
} = viaRecon (
  "@/lib/merch/models/recon",
  () => import ("@/lib/merch/models/recon")
)

export function usingColor () {
  return usingScope (mountColor)
}

export function usingProduct () {
  return usingScope (mountProduct)
}
