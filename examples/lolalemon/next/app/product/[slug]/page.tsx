"use client"
import { $Product, productBySlug$ } from "@/lib/product"
import { Recommendations$ } from "@/lib/recommendations"
import { ErrorBoundary } from "@reconjs/utils-react"
import { Suspense } from "react"
import { use$ } from "recon"

const loading = <div>Loading...</div>
const errored = <div>Something went wrong</div>

function* ProductPage$ (slug: string) {
  const product = yield* use$ (productBySlug$, slug)
  // yield $Product (() => product.id)
  
  const Recommendations = use$ (Recommendations$)
  
  return () => <>
    <h1>{product.name}</h1>
    <Recommendations />
  </>
}

export default function ProductPage (props: {
  params: any,
}) {
  const slug: string = props.params.slug
  const Page = use$ (ProductPage$, slug)
  
  return (
    <main className="p-8 w-full flex flex-col gap-8">
      <ErrorBoundary fallback={errored}>
        <Suspense fallback={loading}>
          <Page />
        </Suspense >
      </ErrorBoundary>
    </main >
  )
}
