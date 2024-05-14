import recon from "@reconjs/core"

import { View$ } from "@reconjs/react"
import { ErrorBoundary } from "@reconjs/utils-react"
import { PropsWithChildren, Suspense } from "react"
import { usePurchaseSection$ } from "./purchase-section"

const $ = recon ("@/product-page/index")

const join = (delimeter: string, chunks: any[]) => chunks
  .filter (x => typeof x === "string" || typeof x === "number")
  .join (delimeter)

const ARTICLE_CLASS = join (" ", [
  "flex flex-col items-center"
])

const CONTAINER_CLASS = join (" ", [
  "flex flex-col w-full gap-16 py-8"
])

const SECTION_CLASS = join (" ", [
  "px-20 gap-8 flex flex-col items-center"
])

const HEADER_CLASS = join (" ", [
  "text-3xl font-semibold text-center"
])

function Section (props: PropsWithChildren <{
  header?: string,
}>) {
  return (
    <ErrorBoundary>
      <section className={SECTION_CLASS}>
        {!!props.header && (
          <h2 className={HEADER_CLASS}>
            {props.header}
          </h2>
        )}
        <Suspense>
          {props.children}
        </Suspense>
      </section>
    </ErrorBoundary>
  )
}

function PurchaseSection () {
  return null
}

function Recommender () {
  return null
}

const useProductPage$ = $(() => {
  const PurchaseSection = usePurchaseSection$()
  // const Recommender = useRecommender$()

  return View$ (() => {
    return (
      <article className={ARTICLE_CLASS}>
        <div className={CONTAINER_CLASS}>
          <section className="px-20">
            <PurchaseSection />
          </section>
          <Section header="Recommendations">
            <Recommender />
          </Section>
          <Section header="why we made this">
            <p className="text-center">
              because we wanted to!
            </p>
          </Section>
        </div>
      </article>
    )
  })
})

export function ProductPage () {
  const Page = useProductPage$()
  
  return (
    <Suspense>
      <Page />
    </Suspense>
  )
}
