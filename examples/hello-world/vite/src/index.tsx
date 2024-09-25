import "./index.css"

import { createRoot } from "react-dom/client"
import { Suspense } from "react"
import { useView } from "recon"
import { Layout, NO_REFRESH } from "./layout"
import { Page } from "./count-page"

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
        <Suspense fallback={loading}>
          <Page />
        </Suspense>
      </Layout>
    </Suspense>
  )
}

createRoot (ROOT).render(<App />)
