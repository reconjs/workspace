import { render, screen, waitFor } from "@testing-library/react"
import { createContext, PropsWithChildren, Suspense, use } from "react"
// import { Regenerator, get$, use$ } from "recon"
import { atomic, hoist } from "recon"
import { vi, beforeEach, describe, expect, test, afterEach } from "vitest"
import * as matchers from "@testing-library/jest-dom/matchers"
import { timeout } from "@reconjs/utils"

expect.extend (matchers)

const LOADING = <h2>Loading...</h2>

describe ("useHelloSignal", () => {
  test ("no use", () => {
    const useHelloSignal = hoist (() => "Hello")
    
    function App () {
      const _hello = useHelloSignal ()
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

  test ("one sync use", () => {
    const useHelloSignal = hoist (() => "Hello")
    
    function App () {
      const _hello = useHelloSignal ()
      const hello = use (_hello)
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

  describe ("one async use", () => {
    const useHelloSignal = hoist (async () => {
      // await timeout (1000)
      return "Hello"
    })
    
    function App () {
      const _hello = useHelloSignal()
      const hello = use (_hello)
      return <h1>{hello} World</h1>
    }

    afterEach (() => {
      // vi.clearAllTimers()
    })

    beforeEach (() => {
      // vi.useFakeTimers()
      render (
        <Suspense fallback={LOADING}>
          <App />
        </Suspense>
      )
    })

    test ("suspends", () => {
      // vi.advanceTimersByTime (1000)
      
      expect (screen.getByRole ("heading"))
        .toHaveTextContent ("Loading...")
    })

    test ("resolves to 'Hello World'", async () => {
      // vi.advanceTimersByTime (1000)

      await waitFor (() => {
        expect (screen.getByRole ("heading"))
          .toHaveTextContent ("Hello World")
      })
    })
  })

  test ("shared async", async () => {
    // vi.advanceTimersByTime (1000)

    const useTextAtom = atomic (async (lang: string, english: string) => {
      console.log ("useTextAtom", lang, english)
      if (lang === "en") return english
    })
    
    function App () {
      const _hello = useTextAtom ("en", "Hello")
      const _world = useTextAtom ("en", "World")
      
      const hello = use (_hello)
      const world = use (_world)
      
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

  test.skip ("generators", async () => {
    const useTextAtom = atomic (async (lang: string, english: string) => {
      if (lang === "en") return english
    })
    
    const useHelloAtom = atomic (function* () {
      const hello = yield* useTextAtom ("en", "Hello")
      return hello
    })
    
    const useWorldAtom = atomic (() => {
      const atom = useTextAtom ("en", "World")
      return use (atom)
    })
    
    function App () {
      const _hello = useHelloAtom()
      const _world = useWorldAtom()
      
      const hello = use (_hello)
      const world = use (_world)
      
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

  test.todo ("preloading", async () => {
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
})
