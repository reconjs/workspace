import { define, usingCollection } from "@reconjs/core"
import { PropsWithChildren, Suspense } from "react"
import { ErrorBoundary } from "@reconjs/utils-react"
import { defineView } from "@reconjs/react"

import usingPurchaseSection from "../purchase-section"
import { usingRecommender } from "../recommender"

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

// just here in case I comment them out below
function PurchaseSection () { return null }
function Recommender () { return null }

export default defineView (() => {
  console.log ("usingProductPage")

  const PurchaseSection = usingPurchaseSection ()

  // this has crazy waterfalls right now
  // const Recommender = usingRecommender ()

  return () => {
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
  }
})
