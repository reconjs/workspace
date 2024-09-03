/*
import { timeout } from "@reconjs/utils"
import { PropsOf } from "@reconjs/utils-react"
import { act, render, screen, waitFor } from "@testing-library/react"
import { Suspense, useState } from "react"
import { Regenerator, get$, use$ } from "recon"
*/

import { beforeEach, describe, expect, test } from "vitest"
import * as matchers from "@testing-library/jest-dom/matchers"

expect.extend (matchers)

test.only ("SKIP", () => { expect (true) })

/*
test ("Counter (local)", async () => {
  function* Counter$ () {
    return ({ label }: any) => {
      const [ count, setCount ] = useState (0) // eslint-disable-line
      
      function onClick () {
        setCount (count + 1)
      }
      
      return (
        <button onClick={onClick}>
          {label}: {count}
        </button>
      )
    }
  }
  
  function App () {
    const Counter = use$ (Counter$)
    
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



describe("Counter (shared)", () => {
  function* countState$() {
    const [count, setCount] = useState(0) // eslint-disable-line
    return { count, setCount }
  }

  function* Counter$() {
    const { count, setCount } = yield* get$(countState$)

    function onClick() {
      setCount(count + 1)
    }

    return ({ label }: any) => (
      <button onClick={onClick}>
        {label}: {count}
      </button>
    )
  }

  function App() {
    const Counter = use$(Counter$)

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
*/
