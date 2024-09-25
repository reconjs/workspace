import { guidBy, timeout } from "@reconjs/utils"
import { PropsOf } from "@reconjs/utils-react"
import { act, render, screen, waitFor } from "@testing-library/react"
import { Suspense, useState, use } from "react"
import { _use, atomic, useView } from "recon"

import { beforeEach, describe, expect, test, vi } from "vitest"
import * as matchers from "@testing-library/jest-dom/matchers"

expect.extend (matchers)

const NIL = undefined as any

function doo <T> (func: () => T) {
  return func()
}

describe ("_use", () => {
  test ("Shared ID", async () => {
    const useClickRefAtom = atomic (() => {
      return _use (() => ({
        current: NIL as VoidFunction
      }))
    })

    function Section (props: {
      label: string
    }) {
      const atom = useClickRefAtom()
      const ref = use (atom)

      const [ count, setCount] = useState(0)

      ref.current ??= () => {
        setCount (x => x + 1)
      }

      return (
        <button onClick={ref.current}>
          {props.label}: {count}
        </button>
      )
    }
    
    function App () {
      return <>
        <Section label="First" />
        <Section label="Second" />
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

    act (() => {
      screen.getAllByRole ("button")[1]?.click?.()
    })

    expect (screen.getByText ("First: 2")).toBeVisible()
    expect (screen.getByText ("Second: 0")).toBeVisible()
  })
})
