import { defineClientView, usingView } from "@reconjs/react"
import { Skudata, asaSkudata } from "../models"
import { usingCountForSkudata } from "../skudata"
import { Fragment } from "react"
import { usingSelectedSku } from "../product"

const usingBadge = defineClientView ((bySkudata: Skudata) => {
  // TODO: asRequired
  const theSkudata = asaSkudata (bySkudata)
  const theCount = usingCountForSkudata (theSkudata)

  return () => {
    if (!theSkudata ()) return null
    const count = theCount ()
    return <p>In Cart: {count}</p>
  }
})

export default defineClientView (() => {
  // TODO: asRequired
  const theSkudata = usingSelectedSku ()
  const Badge = usingView (theSkudata, (sku) => {
    if (!sku) return Fragment
    return usingBadge (theSkudata)
  })

  return () => <Badge />
})
