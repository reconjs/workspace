import { defineView, usingListView } from "@reconjs/react"

import { Color, asaColor, usingProduct } from "../../models"
import { usingSwatchItem } from "../swatch-item/recon"
import { usingColorsForProduct } from "../../product"
import { Suspense } from "react"
import { ErrorBoundary } from "@reconjs/utils-react"

const usingItem = defineView ((byColor: Color) => {
  const theColor = asaColor (byColor)
  const SwatchItem = usingSwatchItem (theColor)

  return (props: {
    className?: string
  }) => {
    console.log ("[swatch-list][usingItem]", theColor())

    return (
      <ErrorBoundary>
        <Suspense>
          <SwatchItem />
        </Suspense>
      </ErrorBoundary>
    )
  }
})

export default defineView (() => {
  const theProduct = usingProduct ()
  const theColors = usingColorsForProduct (theProduct)
  const List = usingListView (theColors, (theColor) => {
    return usingItem (theColor)
  })

  return (props: {
    className?: string,
  }) => {
    console.log ("[swatch-list]")

    return (
      <Suspense>
        <List {...props} />
      </Suspense>
    )
  }
})
