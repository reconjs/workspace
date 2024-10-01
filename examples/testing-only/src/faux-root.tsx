import { memoize, timeout } from "@reconjs/utils"

import React, { Fragment, Suspense, use } from 'react'
import ReactDOM from 'react-dom/client'
import { Page } from "./faux-count-page"
// import { App } from "./app"
// import { Page$ } from "./count-page"

const rootEl = document.getElementById('root')

const fetchHeader = memoize (async () => {
  await timeout (1000)
  return "Recon + Vite"
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

/*
function Page () {
  return (
    <div className="p-8 text-center">
      Hello World!
    </div>
  )
}
*/

export function Root () {
  // const Page = use$ (Page$)
  const Layout = Fragment
  
  return (
    <Suspense fallback={loading}>
      <Layout>
        <Page />
      </Layout>
    </Suspense>
  )
}