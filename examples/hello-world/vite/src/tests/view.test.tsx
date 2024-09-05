import { timeout } from "@reconjs/utils"
import { act, render, screen, waitFor } from "@testing-library/react"
import { createContext, PropsWithChildren, Suspense, use } from "react"
import { atomic, useView } from "recon"
import { expect, test } from "vitest"
import * as matchers from "@testing-library/jest-dom/matchers"
import { ErrorBoundary } from "@reconjs/utils-react"

expect.extend (matchers)

const LOADING = <h2>Loading...</h2>

// test.only ("SKIP", () => { expect (true) })

test (() => {
  function App () {
    const Greeting = useView (() => {
      return <h1>Hello World</h1>
    })

    return <Greeting />
  }

  render (<App />)

  expect (screen.getByRole ("heading"))
    .toHaveTextContent ("Hello World")
})