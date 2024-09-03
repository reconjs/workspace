import { $Product, productBySlug$ } from "./product"
import { Recommendations$ } from "./recommendations"
import { ErrorBoundary } from "@reconjs/utils-react"
import { Suspense } from "react"
import { use$ } from "recon"

const loading = <div>Loading...</div>
const errored = <div>Something went wrong</div>

export function* ProductPage$ (slug: string) {
  const product = yield* use$ (productBySlug$, slug)
  // yield $Product (() => product.id)
  
  const Recommendations = use$ (Recommendations$)
  
  return () => <>
    <h1>{product.name}</h1>
    <Recommendations />
  </>
}