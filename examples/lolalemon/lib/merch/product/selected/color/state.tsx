import { define, usingBroadly } from "@reconjs/core"

import { usingProduct } from "../../../models"
import { usingColorsForProduct } from "../../color"

import { usingColorSelector } from "./store"

export const usingSelectedColor = define (() => {
  const theProduct = usingProduct ()
  const theColorSelector = usingColorSelector ()
  const theColors = usingColorsForProduct (theProduct)

  const asaProductColor = usingBroadly (theColors)
  // const asaProductColorMaybe = usingOptional (asaProductColor)

  return asaProductColor (() => {
    const [ color ] = theColorSelector ()
    return color
  })
})
