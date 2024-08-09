import { use$ } from "recon"
import { Suspense } from "react"
import { ErrorBoundary, PropsOf } from "@reconjs/utils-react"
import { HomePage$ } from "./home-page"

const failover = <div>Error</div>
const fallback = <div>Loading...</div>

export function App () {
  const HomePage = use$ (HomePage$)
  
  return (
    <main className="flex flex-col items-center justify-center gap-4 p-8">
      <ErrorBoundary fallback={failover}>
        <Suspense fallback={fallback}>
          <HomePage />
        </Suspense>
      </ErrorBoundary >
    </main>
  )
}
