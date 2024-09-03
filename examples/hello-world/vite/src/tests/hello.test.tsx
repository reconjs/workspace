import { timeout } from "@reconjs/utils"
import { act, render, screen, waitFor } from "@testing-library/react"
import { Suspense, use } from "react"
// import { Regenerator, get$, use$ } from "recon"
import { atomic } from "recon"
import { expect, test } from "vitest"
import * as matchers from "@testing-library/jest-dom/matchers"
import { ErrorBoundary } from "@reconjs/utils-react"

expect.extend (matchers)

const LOADING = <h2>Loading...</h2>

// test.only ("SKIP", () => { expect (true) })
test ("useHelloAtom (sync)", () => {
  const useHelloAtom = atomic (() => "Hello")
  
  function App () {
    const helloAtom = useHelloAtom ()
    const hello = use (helloAtom)
    return <h1>{hello} World</h1>
  }
  
  render (
    <Suspense fallback={LOADING}>
      <App />
    </Suspense>
  )
  
  expect (screen.getByRole ("heading"))
    .toHaveTextContent ("Hello World")
})

test ("useHelloAtom (async)", async () => {
  const useHelloAtom = atomic (async () => "Hello")
  
  function App () {
    const helloAtom = useHelloAtom()
    const hello = use (helloAtom)
    return <h1>{hello} World</h1>
  }
  
  render (
    <Suspense fallback={LOADING}>
      <App />
    </Suspense>
  )
  
  expect (screen.getByRole ("heading"))
    .toHaveTextContent ("Loading...")
  
  await waitFor (() => {
    expect (screen.getByRole ("heading"))
      .toHaveTextContent ("Hello World")
  })
})

test ("useTextAtom", async () => {
  const useTextAtom = atomic (async (lang: string, english: string) => {
    if (lang === "en") return english
  })
  
  function App () {
    const helloAtom = useTextAtom ("en", "Hello")
    const worldAtom = useTextAtom ("en", "World")
    
    const hello = use (helloAtom)
    const world = use (worldAtom)
    
    return <h1>{hello} {world}</h1>
  }
  
  render (
    <Suspense fallback={LOADING}>
      <App />
    </Suspense>
  )
  
  expect (screen.getByRole ("heading"))
    .toHaveTextContent ("Loading...")
  
  await waitFor (() => {
    expect (screen.getByRole ("heading"))
      .toHaveTextContent ("Hello World")
  })
})

test ("useTextAtom (+ generators)", async () => {
  const useTextAtom = atomic (async (lang: string, english: string) => {
    if (lang === "en") return english
  })
  
  const useHelloAtom = atomic (() => {
    const atom = useTextAtom ("en", "Hello")
    return use (atom)
  })
  
  const useWorldAtom = atomic (() => {
    const atom = useTextAtom ("en", "World")
    return use (atom)
  })
  
  function App () {
    const helloAtom = useHelloAtom()
    const worldAtom = useWorldAtom()
    
    const hello = use (helloAtom)
    const world = use (worldAtom)
    
    return <h1>{hello} {world}</h1>
  }
  
  render (
    <Suspense fallback={LOADING}>
      <App />
    </Suspense>
  )
  
  expect (screen.getByRole ("heading"))
    .toHaveTextContent ("Loading...")
  
  await waitFor (() => {
    expect (screen.getByRole ("heading"))
      .toHaveTextContent ("Hello World")
  })
})

test ("useTextAtom (+ generators)", async () => {
  const useTextAtom = atomic (async (lang: string, english: string) => {
    if (lang === "en") return english
  })
  
  const useHelloAtom = atomic (function* () {
    const text = yield* useTextAtom ("en", "Hello")
    return text
  })
  
  const useWorldAtom = atomic (function* () {
    const text = yield* useTextAtom ("en", "World")
    return text
  })
  
  function App () {
    const helloAtom = useHelloAtom()
    const worldAtom = useWorldAtom()
    
    const hello = use (helloAtom)
    const world = use (worldAtom)
    
    return <h1>{hello} {world}</h1>
  }
  
  render (
    <Suspense fallback={LOADING}>
      <App />
    </Suspense>
  )
  
  expect (screen.getByRole ("heading"))
    .toHaveTextContent ("Loading...")
  
  await waitFor (() => {
    expect (screen.getByRole ("heading"))
      .toHaveTextContent ("Hello World")
  })
})

/*
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
  
  render(<App />)
  
  expect (screen.getByRole ("heading"))
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
    .toHaveTextContent ("Loading...")
  
  await waitFor(() => {
    expect (screen.getByRole ("heading"))
      .toHaveTextContent ("Hello World")
  })
})
*/