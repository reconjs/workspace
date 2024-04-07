"use server"

import {
  Optional,
  defineAsync,
  usingCollection,
  usingOptional,
} from "@reconjs/core"

import { timeout } from "@reconjs/utils"

import {
  Color,
  Product,
  asaColor,
  asaProduct,
  asaSkudata,
  usingProduct,
} from "../../models"

import PRODUCTS from "../data/mocks"

// DATA QUERYING

async function fetchProductById (id: string) {
  await timeout (100)
  const product = PRODUCTS
    .find (p => p.id === id)

  if (! product) throw new Error (`invalid id: ${id}`)
  return product
}



const usingColorsForProduct = defineAsync ((product: Product) => {
  const theProduct = asaProduct (product)
  const asaColors = usingCollection (asaColor)

  return asaColors (async () => {
    const product = theProduct ()
    const { colors } = await fetchProductById (product)
    return Object.keys (colors)
  })
})



const usingProductImageForColor = defineAsync ((
  byProduct: Product,
  byColor: Optional <Color>,
) => {
  const theProduct = asaProduct (byProduct)
  const theColors = usingColorsForProduct (theProduct)

  const asaColorMaybe = usingOptional (asaColor)
  const theColor = asaColorMaybe (byColor)

  return async () => {
    const id = theProduct ()

    const [ defaultColor ] = theColors ()
    const colorId = theColor () ?? defaultColor

    const data = await fetchProductById (id)
    return data.colors [colorId]
  }
})



// TODO: Replace once we have Product Attributes
const usingProductSkudatasByColor = defineAsync ((byColor: Optional <Color>) => {
  const asaColorMaybe = usingOptional (asaColor)
  const theColor = asaColorMaybe (byColor)
  const theProduct = usingProduct ()
  const asaSkudataList = usingCollection (asaSkudata)

  return asaSkudataList (async () => {
    const color = theColor ()
    const product = theProduct ()
    const { skudatas } = await fetchProductById (product)

    if (! color) return skudatas

    const res = skudatas
      .filter (s => s.includes (color))
    return res
  })
})

export default async function server () {
  return {
    usingColorsForProduct,
    usingProductImageForColor,
    usingProductSkudatasByColor,
  }
}
