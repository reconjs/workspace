import { define, usingBroadly, usingOptional } from "@reconjs/core"
import { defineStore, usingSsrHack, viaClientHooks } from "@reconjs/react"

import { asaSkudata, usingProduct } from "../models"
import {
  usingColorsForProduct,
  usingProductSkudatasByColor,
} from "./color"

const { useEffect, useState } = viaClientHooks (() => import ("react"))

export const usingColorSelector = defineStore (() => {
  console.log ("usingColorSelector")
  const theProduct = usingProduct ()
  const theColors = usingColorsForProduct (theProduct)

  const asa = usingSsrHack (() => {
    const [ color ] = theColors ()
    function setColor (nextColor: string) {
      throw new Error ("setColor not allowed")
    }

    return [ color, setColor ] as const
  })

  return asa (() => {
    const [ color ] = theColors ()

    useEffect (() => {
      console.log ("usingColorSelector rendered")
      return () => {
        console.log ("unmounting usingColorSelector")
      }
    }, [])

    return useState <string> (() => color)
  })
})

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

export const usingSelectedSku = define (() => {
  const theColor = usingSelectedColor ()

  const theSkus = usingProductSkudatasByColor (theColor)

  const asaSkudataMaybe = usingOptional (asaSkudata)
  return asaSkudataMaybe (() => {
    const [ sku ] = theSkus ()
    return sku
  })
})
