import { timeout } from "@reconjs/utils"
import { PropsOf } from "@reconjs/utils-react"
import { act, render, screen, waitFor } from "@testing-library/react"
import { Suspense, useState, use } from "react"
import { _use, atomic, revalidate, useView } from "recon"

import { beforeEach, describe, expect, test } from "vitest"
import * as matchers from "@testing-library/jest-dom/matchers"

expect.extend (matchers)

const loading = <h1>Loading...</h1>

describe ("Counter", () => {
  // FIXME: `useView` is not implemented yet.
  test.todo ("Counter (local)", async () => {
    const useCounterView = atomic (() => {
      const [ count, setCount ] = useState (0)

      function onClick () {
        setCount (count + 1)
      }

      return useView (({ label }: any) => (
        <button onClick={onClick}>
          {label}: {count}
        </button>
      ))
    })
    
    function App () {
      const Counter = useCounterView()
      
      return <>
        <Counter label="First" />
        <Counter label="Second" />
      </>
    }
    
    render (<App />)
    
    expect (screen.getByText ("First: 0")).toBeVisible()
    expect (screen.getByText ("Second: 0")).toBeVisible()
    
    act (() => {
      screen.getAllByRole ("button")[0]?.click?.()
    })
    
    expect (screen.getByText ("First: 1")).toBeVisible()
    expect (screen.getByText ("Second: 0")).toBeVisible()
  })

  describe ("Counter (shared)", () => {
    const useCounterAtom = atomic (() => {
      const [ count, setCount ] = useState (0)
      return { count, setCount }
    })

    function Counter (props: any) {
      const _counter = useCounterAtom()
      const { count, setCount } = use (_counter)

      function onClick() {
        setCount (count + 1)
      }

      return (
        <button {...props} onClick={onClick}>
          Count is {count}
        </button>
      )
    }

    function App() {
      return <>
        <Counter data-testid="one" />
        <Counter data-testid="two" />
      </>
    }
    
    beforeEach (() => {
      render (<App />)
    })

    test ("0 clicks", async () => {
      expect (screen.getByTestId ("one")).toHaveTextContent ("Count is 0")
      expect (screen.getByTestId ("two")).toHaveTextContent ("Count is 0")
    })

    test ("1 click", async () => {
      act (() => {
        screen.getAllByRole("button")[0].click?.()
      })

      expect (screen.getByTestId ("one")).toHaveTextContent ("Count is 1")
      expect (screen.getByTestId ("two")).toHaveTextContent ("Count is 1")
    })
  })

  describe.todo ("Counter (shared + async)", () => {
    const useInitialCount = atomic (() => {
      return 0
    })

    const useCounterAtom = atomic (() => {
      const _initial = useInitialCount()
      const initial = use (_initial)

      const [ count, setCount ] = useState (initial)
      return { count, setCount }
    })

    function Counter (props: any) {
      const _counter = useCounterAtom()
      const { count, setCount } = use (_counter)

      function onClick() {
        setCount (count + 1)
      }

      return (
        <button {...props} onClick={onClick}>
          Count is {count}
        </button>
      )
    }

    function App() {
      return <>
        <h1>Counters</h1>
        <Counter data-testid="one" />
        <Counter data-testid="two" />
      </>
    }
    
    beforeEach (() => {
      render (
        <Suspense fallback={loading}>
          <App />
        </Suspense>
      )
    })

    test ("suspends", () => {
      expect (screen.getByRole ("heading")).toHaveTextContent ("Loading...")
    })

    test ("0 clicks", async () => {
      await waitFor (() => {
        expect (screen.getByRole ("heading")).toHaveTextContent ("Counters")
      })

      expect (screen.getByTestId ("one")).toHaveTextContent ("Count is 0")
      expect (screen.getByTestId ("two")).toHaveTextContent ("Count is 0")
    })

    test ("1 click", async () => {
      await waitFor (() => {
        expect (screen.getByRole ("heading")).toHaveTextContent ("Counters")
      })

      act (() => {
        screen.getByTestId ("one").click?.()
      })

      expect (await screen.findByTestId ("one"))
        .toHaveTextContent ("Count is 1")
      expect (await screen.findByTestId ("two"))
        .toHaveTextContent ("Count is 1")
    })
  })
})
