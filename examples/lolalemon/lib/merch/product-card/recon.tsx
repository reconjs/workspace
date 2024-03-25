import { Suspense } from "react"
import { ErrorBoundary } from "@reconjs/utils-react"
import { defineView, usingListView } from "@reconjs/react"
import { Collection, usingCollection } from "@reconjs/core"

import { usingColorPicker } from "../picker-view"
import { usingProductLabel } from "../product-label"
import { usingProductImage } from "../image-view"
import { 
  Product,
  asaProduct,
  mountProduct,
  usingProduct,
} from "../models"

function ProductCardFallback () {
  return (
    <div className="w-48">
      <div className="rounded-xl w-full h-full bg-slate-100" />
    </div>
  )
}

const ProductImage = () => null
const ColorPicker = () => null

const usingProductCardAux = defineView (() => {
  const theProduct = usingProduct ()
  
  const ColorPicker = usingColorPicker ()
  const ProductLabel = usingProductLabel ()
  const ProductImage = usingProductImage ()

  return () => {
    console.log ("Product Card Aux:", theProduct ())

    let innerClass = "h-24 w-full"
    innerClass += " flex flex-col items-center justify-evenly"
    innerClass += " border border-slate-200 border-t-0 rounded-b-xl"

    return (
      <div className="w-48">
        <div className="h-68 w-full">
          <ErrorBoundary>
            <Suspense>
              <ProductImage className="rounded-t-xl" />
            </Suspense>
          </ErrorBoundary>
        </div>
        <div className={innerClass}>
          <ErrorBoundary>
            <Suspense>
              <ColorPicker />
            </Suspense>
          </ErrorBoundary>
          <ProductLabel className="text-center" small />
        </div>
      </div>
    )
  }
})

export default defineView ((byProduct: Product) => {
  console.log ("[ProductCard]", byProduct)
  const theProduct = asaProduct (byProduct)
  mountProduct (theProduct)

  const ProductCard = usingProductCardAux ()

  return () => {
    const product = theProduct ()
    console.log ("Product Card Wrapper:", product)

    return (
      <ErrorBoundary>
        <Suspense fallback={<ProductCardFallback />}>
          <ProductCard />
        </Suspense>
      </ErrorBoundary>
    )
  }
})  
