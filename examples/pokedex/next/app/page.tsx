"use client"

import { BrowserBoundary, ErrorBoundary } from "@reconjs/utils-react"
import { Suspense } from "react"
import { PokemonList } from "./lib/pokemon-list"

const loading = <div>Loading...</div>
const errored = <div>Something went wrong</div>

export default function RootPage () {
  return (
    <main className="p-8 w-full flex flex-col gap-8">
      <p>Which Pokemon would you like to learn more about?</p>
      <ErrorBoundary fallback={errored}>
        <Suspense fallback={loading}>
          <PokemonList />
        </Suspense >
      </ErrorBoundary>
    </main>
  )
}
