import { define, usingBroadly, usingOptional } from "@reconjs/core"
import { defineStore, usingSsrHack, viaClientHooks } from "@reconjs/react"

import { asaSkudata, usingProduct } from "../../models"
import {
  usingColorsForProduct,
  usingProductSkudatasByColor,
} from "../color"
import { usingSelectedColor } from "./color/state"

export const usingSelectedSku = define (() => {
  const theColor = usingSelectedColor ()

  const theSkus = usingProductSkudatasByColor (theColor)

  const asaSkudataMaybe = usingOptional (asaSkudata)
  return asaSkudataMaybe (() => {
    const [ sku ] = theSkus ()
    return sku
  })
})
