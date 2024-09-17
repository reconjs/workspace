import { render, screen, waitFor } from "@testing-library/react"
import { createContext, PropsWithChildren, Suspense, use } from "react"
// import { Regenerator, get$, use$ } from "recon"
import { atomic } from "recon"
import { expect, test } from "vitest"
import * as matchers from "@testing-library/jest-dom/matchers"

expect.extend (matchers)

const LOADING = <h2>Loading...</h2>

// test.only ("SKIP", () => { expect (true) })

test ("useHelloAtom (no use)", () => {
  const useHelloAtom = atomic (() => "Hello")
  
  function App () {
    const helloAtom = useHelloAtom ()
    const hello = "Hello" // use (helloAtom)
    return <h1>{hello} World</h1>
  }
  
  render (
    <Suspense fallback={LOADING}>
      <App />
    </Suspense>
  )

  expect (screen.getByRole ("heading"))
    .not.toHaveTextContent ("Loading...")
  
  expect (screen.getByRole ("heading"))
    .toHaveTextContent ("Hello World")
})

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
    .not.toHaveTextContent ("Loading...")
  
  expect (screen.getByRole ("heading"))
    .toHaveTextContent ("Hello World")
})

test.only ("useHelloAtom (async)", async () => {
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

test.skip ("useTextAtom (+ generators)", async () => {
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

test.todo ("useTextAtom (preloading)", async () => {
  const useTextAtom = atomic (async (lang: string, english: string) => {
    // TODO: support other languages
    return english
  })

  const WorldContext = createContext ("")

  function Layout ({ children }: PropsWithChildren<{}>) {
    const _world = useTextAtom ("en", "World")
    const world = use (_world)

    return (
      <WorldContext value={world}>
        {children}
      </WorldContext>
    )
  }
  
  function App () {
    const helloAtom = useTextAtom ("en", "Hello")
    
    const hello = use (helloAtom)
    const world = use (WorldContext)
    
    return <h1>{hello} {world}</h1>
  }
  
  render (
    <Suspense fallback={LOADING}>
      <Layout>
        <App />
      </Layout>
    </Suspense>
  )
  
  expect (screen.getByRole ("heading"))
    .toHaveTextContent ("Loading...")
  
  await waitFor (() => {
    expect (screen.getByRole ("heading"))
      .toHaveTextContent ("Hello World")
  })
})
