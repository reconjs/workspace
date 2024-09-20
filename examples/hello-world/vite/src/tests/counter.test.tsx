import { timeout } from "@reconjs/utils"
import { PropsOf } from "@reconjs/utils-react"
import { act, render, screen, waitFor } from "@testing-library/react"
import { Suspense, useState, use } from "react"
import { _use, atomic, useView } from "recon"

import { beforeEach, describe, expect, test } from "vitest"
import * as matchers from "@testing-library/jest-dom/matchers"

expect.extend (matchers)

describe ("Counter", () => {
  // FIXME: `useView` is not implemented yet.
  test.skip ("Counter (local)", async () => {
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

  describe.skip ("Counter (shared)", () => {
    const useCounterAtom = atomic (() => {
      const [ count, setCount ] = useState (0)
      return { count, setCount }
    })

    function Counter ({ label }: any) {
      const _counter = useCounterAtom()
      const { count, setCount } = use (_counter)

      function onClick() {
        setCount (count + 1)
      }

      return (
        <button onClick={onClick}>
          {label}: {count}
        </button>
      )
    }

    function App() {
      return <>
        <Counter label="First" />
        <Counter label="Second" />
      </>
    }
    
    beforeEach (() => {
      render (<App />)
    })

    test ("0 clicks", async () => {
      expect (screen.getByText ("First: 0")).toBeVisible()
      expect (screen.getByText ("Second: 0")).toBeVisible()
    })

    test ("1 click", async () => {
      act (() => {
        screen.getAllByRole("button")[0].click?.()
      })

      expect (screen.queryByText ("First: 1")).toBeVisible()
      expect (screen.queryByText ("Second: 1")).toBeVisible()
    })
  })

})
