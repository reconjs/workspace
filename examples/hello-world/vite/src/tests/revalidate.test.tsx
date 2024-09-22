import { render, screen, waitFor } from "@testing-library/react"
import { 
  act, 
  Suspense, 
  use, 
  useEffect, 
  useState } from "react"
// import { Regenerator, get$, use$ } from "recon"
import { _use, atomic, revalidate } from "recon"
import { vi, beforeEach, describe, expect, test } from "vitest"
import * as matchers from "@testing-library/jest-dom/matchers"
import { PropsOf, useEvent } from "@reconjs/utils-react"

expect.extend (matchers)

const LOADING = <h2>Loading...</h2>

describe ("Alice -> Alicia", () => {
  let nameState = ""

  const useNameAtom = atomic (() => {
    console.log ("--- useNameAtom ---")
    return nameState
  })
  
  function Name (props: any) {
    console.log ("--- Name ---")
    const _name = useNameAtom()
    const name = use (_name)

    return <h1>{name}</h1>
  }

  function SwitchName () {
    const _name = useNameAtom()

    function onClick () {
      nameState = "Alicia"
      revalidate (_name)
    }

    return <button {...{ onClick }}>Switch</button>
  }

  function App () {
    const [ symbol, setSymbol ] = useState (() => Symbol())

    function onClick () {
      setSymbol (() => Symbol())
    }

    return <>
      <Name {...{ symbol }} />
      <SwitchName />
    </>
  }

  beforeEach (async () => {
    nameState = "Alice"

    render (
      <Suspense fallback={LOADING}>
        <App />
      </Suspense>
    )
  })

  test ("displays Alice", () => {
    expect (screen.getByRole ("heading"))
      .toHaveTextContent ("Alice")
  })

  test ("changes to Alicia", async () => {
    await waitFor (() => {
      expect (screen.getByRole ("heading"))
        .toHaveTextContent ("Alice")
    })

    console.group ("act")
    act (() => {
      console.group ("click")
      screen.getByRole ("button").click()
      console.groupEnd()
    })
    console.groupEnd()

    await waitFor (() => {
      expect (screen.getByRole ("heading"))
        .toHaveTextContent ("Alicia")
    })
  })
})