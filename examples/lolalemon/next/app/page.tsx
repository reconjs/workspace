import { Recommendations$ } from "@/lib/recommendations"
import { BrowserBoundary, ErrorBoundary } from "@reconjs/utils-react"
import { Suspense } from "react"
import { use$ } from "recon"
import { Recommender } from "./lib/recommender"

const loading = <div>Loading...</div>
const errored = <div>Something went wrong</div>

export default function RootPage () {
  return (
    <BrowserBoundary>
      <main className="p-8 w-full flex flex-col gap-8">
        <p>Hello World</p>
        <ErrorBoundary>
          <Suspense>
            <Recommender />
          </Suspense >
        </ErrorBoundary>
      </main>
    </BrowserBoundary>
  )
}
