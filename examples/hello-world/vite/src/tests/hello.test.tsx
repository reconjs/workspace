import { timeout } from "@reconjs/utils"
import { act, render, screen, waitFor } from "@testing-library/react"
import { Suspense } from "react"
import { Regenerator, get$, use$ } from "recon"
import { expect, test } from "vitest"
import * as matchers from "@testing-library/jest-dom/matchers"
import { ErrorBoundary } from "@reconjs/utils-react"

expect.extend (matchers)

// test.only ("SKIP", () => { expect (true) })

test ("Hello World", async () => {
  function* Greeting$ () {
    console.log ("[Greeting$] start")
    return () => <h1>Hello World</h1>
  }
  
  function App () {
    console.log ("[App] start")
    const Greeting = use$ (Greeting$)
    console.log ("[App] after Greeting")
    return <Greeting />
  }
  
  render (<App />)
  expect (screen.getByRole ("heading"))
    // @ts-ignore
    .toHaveTextContent ("Hello World")
})

test ("Hello World (nested)", async () => {
  function* Greeting$ () {
    console.log ("[Greeting$] start")
    return () => <span>Hello</span>
  }
  
  function* Headline$ () {
    console.log ("[Headline$] start")
    const Greeting = use$ (Greeting$)
    console.log ("[Headline$] after")
    return () => <h1><Greeting /> World</h1>
  }
  
  function App () {
    const Headline = use$ (Headline$)
    return <Headline />
  }
  
  render(<App />)
  
  expect (screen.getByRole ("heading"))
    // @ts-ignore
    .toHaveTextContent ("Hello World")
})

test ("Hello World (w/ get$)", () => {
  function* greeting$ () {
    return "Hello"
  }
  
  function* Headline$ () {
    const greeting = yield* get$ (greeting$)
    return () => <h1>{greeting} World</h1>
  }
  
  function App () {
    const Headline = use$ (Headline$)
    return <Headline />
  }
  
  render (<App />)
  expect (screen.getByRole ("heading"))
    // @ts-ignore
    .toHaveTextContent ("Hello World")
})

test ("Hello World (async)", async () => {
  async function* greeting$ () {
    return "Hello"
  }
  
  function* Headline$ () {
    const greeting = yield* get$ (greeting$)
    return () => <h1>{greeting} World</h1>
  }
  
  function Loading () {
    return <h2>Loading...</h2>
  }
  
  function App () {
    const Headline = use$ (Headline$)
    return (
      <Suspense fallback={<Loading />}>
        <Headline />
      </Suspense>
    )
  }
  
  render (<App />)
  expect (screen.getByRole ("heading"))
    // @ts-ignore
    .toHaveTextContent ("Loading...")
  
  await waitFor(() => {
    expect (screen.getByRole ("heading"))
      // @ts-ignore
      .toHaveTextContent ("Hello World")
  })
})