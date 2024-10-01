import { timeout } from "@reconjs/utils"
import { act, render, screen, waitFor } from "@testing-library/react"
import { createContext, PropsWithChildren, Suspense, use } from "react"
import { atomic, useView } from "recon"
import { describe, expect, test } from "vitest"
import * as matchers from "@testing-library/jest-dom/matchers"

expect.extend (matchers)

const LOADING = <h2>Loading...</h2>

// test.only ("SKIP", () => { expect (true) })

describe ("useView -> Greeting", () => {
  test ("basic", () => {
    function App () {
      const Greeting = useView (() => {
        return <h1>Hello World</h1>
      })

      return <Greeting />
    }

    render (
      <Suspense fallback={LOADING}>
        <App />
      </Suspense>
    )

    expect (screen.getByRole ("heading"))
      .toHaveTextContent ("Hello World")
  })

  test ("+ useGreetingAtom (sync)", async () => {
    const useGreetingAtom = atomic (() => {
      return "Hello World"
    })

    function App () {
      const atom = useGreetingAtom()

      const Greeting = useView (() => {
        const greeting = use (atom)
        return <h1>{greeting}</h1>
      })

      return (
        <Suspense fallback={LOADING}>
          <Greeting />
        </Suspense>
      )
    }

    render (<App />)

    expect (screen.getByRole ("heading"))
      .toHaveTextContent ("Hello World")
  })

  test ("+ useGreetingAtom (async)", async () => {
    const useGreetingAtom = atomic (async () => {
      return "Hello World"
    })

    function App () {
      const atom = useGreetingAtom()

      const Greeting = useView (() => {
        const greeting = use (atom)
        return <h1>{greeting}</h1>
      })

      return (
        <Suspense fallback={LOADING}>
          <Greeting />
        </Suspense>
      )
    }

    render (<App />)

    expect (screen.getByRole ("heading"))
      .toHaveTextContent ("Loading...")

    await waitFor (() => {
      expect (screen.getByRole ("heading"))
        .toHaveTextContent ("Hello World")
    })
  })
})