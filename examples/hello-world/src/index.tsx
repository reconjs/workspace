import "./index.css"

import { createRoot } from "react-dom/client"
import { Suspense } from "react"
import { Layout } from "./layout"
import { Page } from "./page"

const ROOT = document.getElementById('root')!

const loading = (
  <div className="p-8 text-center">
    ... Loading ...
  </div>
)

export function App () {
  return (
    <Suspense fallback={loading}>
      <Layout>
        <main className="p-8 flex flex-row items-center justify-center">
          <Suspense fallback={loading}>
            <Page />
          </Suspense>
        </main>
      </Layout>
    </Suspense>
  )
}

createRoot (ROOT).render(<App />)
