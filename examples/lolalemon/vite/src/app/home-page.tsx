import { ErrorBoundary } from "@reconjs/utils-react"
import { Recommendations$ } from "../lib/recommendations"
import { Suspense } from "react"
import { use$ } from "recon"

const loading = <div>Loading...</div>
const errored = <div>Something went wrong</div>

export function* HomePage$ () {
  const Recommendations = use$ (Recommendations$)
  
  return () => <>
    <h1>lolalemon</h1>
    <ErrorBoundary fallback={errored}>
      <Suspense fallback={loading}>
        <Recommendations />
      </Suspense>
    </ErrorBoundary>
  </>
}