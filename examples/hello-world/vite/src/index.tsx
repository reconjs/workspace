import { memoize, timeout } from "@reconjs/utils"
import "./index.css"

import React, { Suspense, use } from 'react'
import ReactDOM from 'react-dom/client'
// import { App } from "./app"
import { ReconProvider, use$ } from "recon"
import { App, App$ } from "./app"

const rootEl = document.getElementById('root')

const fetchHeader = memoize (async () => {
  await timeout (1000)
  return "Hello World"
})

function Layout ({ children }: any) {
  const header = use (fetchHeader())
  
  return (
    <div>
      <header className="border-b text-center p-4 font-bold">
        {header}
      </header>
      {children}
    </div>
  )
}

const loading = (
  <div className="p-8 text-center">
    ... Loading ...
  </div>
)

function Root () {
  const App = use$ (App$)
  
  return (
    <Suspense fallback={loading}>
      <Layout>
        <App />
      </Layout>
    </Suspense>
  )
}

ReactDOM.createRoot (rootEl!).render(
  <React.StrictMode>
    <ReconProvider>
      <Root />
    </ReconProvider>
  </React.StrictMode>,
)
