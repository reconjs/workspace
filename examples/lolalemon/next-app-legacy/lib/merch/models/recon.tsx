import {
  Model,
  Optional,
  defineSync,
  defineModel,
  defineScope,
  usingOptional,
} from "@reconjs/core"

class Color extends Model <string> {}
class Product extends Model <string> {}
class ProductSlug extends Model <string> {}
class Skudata extends Model <string> {}

export type {
  Color,
  Product,
  ProductSlug,
  Skudata,
}

export const asaColor = defineModel (Color)
export const asaProduct = defineModel (Product)
export const asaProductSlug = defineModel (ProductSlug)
export const asaSkudata = defineModel (Skudata)


// Product Scope

export const usingDefaultProduct = defineSync (() => {
  const asaProductMaybe = usingOptional (asaProduct)
  return asaProductMaybe (() => {
    return null as any
  })
})

export const mountProduct = defineScope (() => {
  return usingDefaultProduct ()
})



// Color Scope

export const usingDefaultColor = defineSync (() => {
  const asaColorMaybe = usingOptional (asaColor)
  return asaColorMaybe (() => {
    return null as any
  })
})

export const mountColor = defineScope (() => {
  return usingDefaultColor ()
})
