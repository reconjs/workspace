import { defineView } from "@reconjs/react"

import {
  ProductSlug,
  asaProductSlug,
  mountProduct,
  usingProductBySlug,
} from "@/lib/merch"

import usingProductPage from "../recon"

export default defineView ((bySlug: ProductSlug) => {
  console.log ("[ProductPage] start", bySlug)
  const theSlug = asaProductSlug (bySlug)
  const theProduct = usingProductBySlug (theSlug)
  console.log ("[ProductPage] provide", theProduct)
  mountProduct (theProduct)

  const ProductPage = usingProductPage ()
  return () => <ProductPage />
})
