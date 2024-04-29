import { ErrorBoundary, useEvent } from "@reconjs/utils-react"
import { Suspense } from "react"
import { defineSync, usingOptional } from "@reconjs/core"
import { StarIcon as StarOutlineIcon } from "@heroicons/react/24/outline"
import { StarIcon } from "@heroicons/react/20/solid"
import {
  defineClientView,
  defineView,
  viaClientHooks,
} from "@reconjs/react"

import { asaColor, usingProduct } from "../models"
import { usingStarredStore } from "../product/starred"
import { usingProductImageForColor } from "../product/color"
import { usingSelectedColor } from "../product"

const { useState } = viaClientHooks (() => import ("react"))

const join = (delimeter: string, chunks: any[]) => chunks
  .filter (x => typeof x === "string" || typeof x === "number")
  .join (delimeter)

const theStarred = () => {
  return [
    false,
    (arg: any) => {},
  ] as const
}

const StarButtonFallback = (props: {
  className?: string,
}) => {
  const className = join (" ", [
    props.className,
    "w-6 h-6 border rounded-full",
    "text-yellow-500 bg-white border-yellow-500",
  ])

  // TODO: onClick
  return (
    <div className={className} />
  )
}

const MAX = 1000
let count = 0

const usingStarButton = defineClientView (() => {
  const theProduct = usingProduct ()
  const theStarred = usingStarredStore (theProduct)

  console.log ("theStarred", theStarred)
  if (count++ > MAX) throw new Error ("too many renders")

  return (props: {
    className?: string,
  }) => {
    // const [ count, setCount ] = useState (0)

    const [ starred, setStarred ] = theStarred ()
    const onClick = useEvent (() => {
      setStarred (!starred)
      // setCount (count + 1)
    })

    const className = join (" ", [
      props.className,
      "w-6 p-1 border rounded-full",
      "text-yellow-500 bg-white border-yellow-500",
    ])

    // TODO: onClick
    return (
      <button type="button" {...{ className, onClick }}>
        {starred ? <StarIcon /> : <StarOutlineIcon /> }
      </button>
    )
  }
})

const usingNoColor = defineSync (() => {
  const asaColorMaybe = usingOptional (asaColor)
  return asaColorMaybe (() => {
    return null
  })
})

export default defineView (() => {
  const theProduct = usingProduct ()
  const theSelectedColor = usingSelectedColor ()
  const theImage = usingProductImageForColor (theProduct, theSelectedColor)
  const StarButton = usingStarButton ()

  return (props: {
    className?: string,
  }) => {
    const src = theImage ()

    let className = "w-full h-full object-cover aspect-[10/12]"
    if (props.className) className += " " + props.className

    if (!src) {
      console.warn ("[usingProductImage] No image src")
      return null
    }

    const fallback = <StarButtonFallback className="absolute -mt-8 ml-2" />
    
    return <>
      <div className="w-full h-full">
        <img {...{ className, src }} loading="lazy" alt="product image" />
        <ErrorBoundary>
          <Suspense fallback={fallback}>
            <StarButton className="absolute -mt-8 ml-2" />
          </Suspense>
        </ErrorBoundary>
      </div>
    </>
  }
})
