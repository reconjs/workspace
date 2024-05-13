"use server"

import { defineAction, defineAsync } from "@reconjs/core"
import { connect } from "@reconjs/utils-server"

import { Skudata, asaSkudata } from "../../models"
import { usingSelectedSku } from "../../product"

const stored = connect ("./data/shop.json")

function asOptionalNumber (x: any): number|null {
  if (typeof x === "number") return x as number
  if (x === undefined) return null
  throw new Error ("[asOptionalNumber] violation")
}

const countForSku = stored (
  (product: string) => `count?sku=${product}`,
  asOptionalNumber,
)

const usingCountForSkudata = defineAsync ((bySkudata: Skudata) => {
  const theSku = asaSkudata (bySkudata)

  return async () => {
    const sku = theSku ()
    if (!sku) throw new Error ("NO COUNT")
    const res = await countForSku (sku).get()
    return res ?? 0
  }
})

const usingIncrementCountForSkudata = defineAction ((bySkudata: Skudata) => {
  const theSku = asaSkudata (bySkudata)
  const theCount = usingCountForSkudata (theSku)

  return async () => {
    // do your update

    const sku = theSku()
    if (!sku) throw new Error ("NO COUNT")

    const count = theCount()
    console.log ("[usingIncrementCountForProduct]", { sku, count })

    await countForSku (sku).set (count + 1)
  }
})

export const usingAddToCart = defineAction (() => {
  const theSku = usingSelectedSku ()
  const theIncrementCount = usingIncrementCountForSkudata (theSku)

  return async () => {
    const incrementCount = theIncrementCount ()
    incrementCount ()
  }
})

export default async function server () {
  return {
    usingAddToCart,
    usingCountForSkudata,
    usingIncrementCountForSkudata,
  }
}
