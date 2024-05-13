import "./import"

import { extendRouter, viaRouter } from "@reconjs/next"
import { useRecon } from "@reconjs/react"

// import "@/app/(main)/lib/layout"
// import "@/app/(main)/lib/page"
// import "@/app/(main)/place/lib/layout"
// import "@/app/(main)/place/lib/page"

import { asaPlace, mountPlace } from "@/lib/place"
import { 
  asaProductSlug, 
  mountProduct,
  usingProductBySlug,
} from "@/lib/merch"

extendRouter ((params) => {
  if (! params.product) return () => {}
  const theSlug = useRecon (asaProductSlug, params.product)

  return () => {
    const theProduct = usingProductBySlug (theSlug)
    mountProduct (theProduct)
  }
})

extendRouter ((params) => {
  if (! params.place) return () => {}

	// const theSlug = useRecon (asaPlaceSlug, params.place)
  const thePlace = useRecon (asaPlace, params.place)

	return () => {
		// const thePlace = usingPlaceBySlug (theSlug)
		mountPlace (thePlace)
	}
})

export const withRoute = viaRouter ()
