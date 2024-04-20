import { define, usingCollection } from "@reconjs/core"
import { defineView, usingListView } from "@reconjs/react"
import { ErrorBoundary } from "@reconjs/utils-react"
import { Suspense } from "react"

import { asaProduct, usingProductCard } from "@/lib/merch"

const usingRecommendations = defineSync (() => {
  const asa = usingCollection (asaProduct)

  return asa (() => {
    return [ "a-31", "a-25", "a-28" ]
  })
})

export default defineView (() => {
  const theRecommended = usingRecommendations ()
  const Cards = usingListView (theRecommended, (theProduct) => {
    return usingProductCard (theProduct)
  })

  return (props: {}) => {
    return (
      <ErrorBoundary>
        <Suspense>
          <div className="flex flex-row justify-between w-full">
            <Cards />
          </div>
        </Suspense>
      </ErrorBoundary>
    )
  }
})
