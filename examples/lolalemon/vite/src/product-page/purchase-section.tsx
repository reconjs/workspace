import recon, { Value$ } from "@reconjs/core"
import { View$ } from "@reconjs/react"
import { ErrorBoundary } from "@reconjs/utils-react"
import { Suspense } from "react"

const $ = recon ("@/product-page/purchase-section")

function ErrorFallback () {
  return <div className="bg-red-500 text-red-500 h-10 w-full">Error</div>
}

function ColorPicker (props: any) {
  return null
}

function Pickers () {
  return null
}

function BuyButton () {
  return null
}

function BagBadge () {
  return null
}

function ProductImage () {
  return null
}

const getName$ = $(() => {
  return Value$ (() => {
    return "PLACEHOLDER"
  })
})

export const usePurchaseSection$ = $ (() => {
  // const theProduct = getProduct$()

  // const ColorPicker = usingColorPicker ()
  // const Pickers = usingAttributePickers ()
  // const ProductImage = usingProductImage ()
  // const BuyButton = usingBuyButton ()
  // const BagBadge = usingBagBadge ()

  const $name = getName$()

  return View$ (() => {
    const name = $name()

    // const price = thePrice ()
    const price = "$$$"

    return (
      <div className="flex flex-row justify-around gap-16">
        <div className="flex flex-col w-1/3">
          <ErrorBoundary fallback={<ErrorFallback />}>
            <Suspense>
              <ProductImage />
            </Suspense>
          </ErrorBoundary>
        </div>
        <div className="flex flex-col gap-4 w-2/3">
          <div>
            <h1 className="text-xl font-semibold">{name}</h1>
            <p>{price}</p>
          </div>
          <ErrorBoundary fallback={<ErrorFallback />}>
            <Suspense>
              <ColorPicker labeled />
            </Suspense>
          </ErrorBoundary>

          <Pickers />

          <ErrorBoundary fallback={<ErrorFallback />}>
            <Suspense>
              <BuyButton />
            </Suspense>
          </ErrorBoundary>

          <ErrorBoundary fallback={<ErrorFallback />}>
            <Suspense>
              <BagBadge />
            </Suspense>
          </ErrorBoundary>
        </div>
      </div>
    )
  })
})
