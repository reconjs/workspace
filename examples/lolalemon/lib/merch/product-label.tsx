import Link from "next/link"
import { defineView } from "@reconjs/react"

import { usingProduct } from "./models"
import { 
  usingNameForProduct, 
  usingSlugForProduct,
} from "./product"

export const usingProductLabel = defineView (() => {
  const theProduct = usingProduct ()

  const theSlug = usingSlugForProduct (theProduct)
  const theName = usingNameForProduct (theProduct)
  
  return (props: {
    className?: string,
    small?: boolean,
  }) => {
    const slug = theSlug ()
    const name = theName ()

    const price = "$$$" // TODO
    const href = `/product/${slug}`
    
    let titleClass = "font-bold text-black"
    let priceClass = "text-sm"
    
    if (! props.small) titleClass += " text-2xl"
    
    return (
      <div className={props.className}>
        <Link className={titleClass} href={href}>{name}</Link>
        <div className={priceClass}>{price}</div>
      </div>
    )
  }
})
