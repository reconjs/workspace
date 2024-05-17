import recon, { Value$ } from "@reconjs/core"
import { View$, use$ } from "@reconjs/react"
import { ErrorBoundary } from "@reconjs/utils-react"
import { Suspense } from "react"
import { useProductImage$ } from "../merch/image"
import { getProductName$ } from "../merch/server"
import { useColorPicker$ } from "../merch/color-picker"
import { viaChoice$ } from "../merch/color-choice"

const $ = recon ("@/product-page/purchase-section")

function ErrorFallback () {
  return <div className="bg-red-500 text-red-500 h-10 w-full">Error</div>
}

function LoadingFallback () {
  return <div className="bg-blue-100 text-blue-500 h-10 w-full"></div>
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

const useColorChecker$ = $(() => {
  const _choice = viaChoice$ ()
  const useChoice = use$ (_choice)

  return View$ (() => {
    const { chosenColor } = useChoice()
    return <div>{chosenColor}</div>
  })
})

export const usePurchaseSection$ = $ (() => {
  // const theProduct = getProduct$()

  const Checker = useColorChecker$()

  const ColorPicker = useColorPicker$ ()
  // const Pickers = usingAttributePickers ()
  const ProductImage = useProductImage$()
  // const BuyButton = usingBuyButton ()
  // const BagBadge = usingBagBadge ()

  const $name = getProductName$()

  return View$ (() => {
    const name = $name()

    // const price = thePrice ()
    const price = "$$$"

    return (
      <div className="flex flex-row justify-around gap-16">
        <div className="flex flex-col w-1/3">
          <ErrorBoundary fallback={<ErrorFallback />}>
            <Suspense fallback={<LoadingFallback />}>
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
            <Suspense fallback={<LoadingFallback />}>
              <Checker />
            </Suspense>
          </ErrorBoundary>
          <ErrorBoundary fallback={<ErrorFallback />}>
            <Suspense fallback={<LoadingFallback />}>
              <ColorPicker labeled />
            </Suspense>
          </ErrorBoundary>

          <Pickers />

          <ErrorBoundary fallback={<ErrorFallback />}>
            <Suspense fallback={<LoadingFallback />}>
              <BuyButton />
            </Suspense>
          </ErrorBoundary>

          <ErrorBoundary fallback={<ErrorFallback />}>
            <Suspense fallback={<LoadingFallback />}>
              <BagBadge />
            </Suspense>
          </ErrorBoundary>
        </div>
      </div>
    )
  })
})