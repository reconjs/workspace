import { defineClientView, defineView } from "@reconjs/react"
import { Skudata, asaSkudata } from "../models"
import { usingAddToCart } from "../skudata"
import { usingSelectedSku } from "../product"
import { useEvent } from "@reconjs/utils-react"

const join = (delimeter: string, chunks: any[]) => chunks
  .filter (x => typeof x === "string" || typeof x === "number")
  .join (delimeter)

export default defineClientView (() => {
  const theSkudata = usingSelectedSku ()

  // TODO: asRequired or something
  const theIncrementCount = usingAddToCart ()
    // usingIncrementCountForSkudata (theSkudata)

  return () => {
    const goIncrement = theIncrementCount ()

    const hasSku = !!theSkudata ()

    const onClick = useEvent (() => {
      if (hasSku) {
        goIncrement ()
      }
    })

    const className = join (" ", [
      "flex flex-row items-center justify-center",
      "w-60 p-2 rounded-xl",
      "bg-red-500 text-white",
      "hover:bg-red-600",
    ])

    return <>
      <button type="button" {...{ className, onClick }}>
        Buy
      </button>
    </>
  }
})
