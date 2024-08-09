import { timeout } from "@reconjs/utils"
import { act, render, screen, waitFor } from "@testing-library/react"
import { Suspense } from "react"
import { Regenerator, get$, use$ } from "recon"
import { expect, test } from "vitest"
import * as matchers from "@testing-library/jest-dom/matchers"

expect.extend (matchers)

test.only ("Hello World (skip)", () => {
  expect (true)
})

test ("Hello World", async () => {
  function* Greeting$ () {
    return () => <h1>Hello World</h1>
  }
  
  function App () {
    const Greeting = use$ (Greeting$)
    return <Greeting />
  }
  
  render (<App />)
  expect (screen.getByRole ("heading"))
    // @ts-ignore
    .toHaveTextContent ("Hello World")
})

test ("Hello World (nested)", async () => {
  function* Greeting$ () {
    return () => <span>Hello</span>
  }
  
  function* Headline$ () {
    const Greeting = use$ (Greeting$)
    return () => <h1><Greeting /> World</h1>
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