import { render, screen, waitFor } from "@testing-library/react"
import { act, Suspense, use, useEffect, useState } from "react"
// import { Regenerator, get$, use$ } from "recon"
import { _use, atomic, revalidate } from "recon"
import { vi, beforeEach, describe, expect, test } from "vitest"
import * as matchers from "@testing-library/jest-dom/matchers"
import { createEvent } from "@reconjs/utils"

expect.extend (matchers)

const LOADING = <h2>Loading...</h2>

describe ("Alice -> Alicia", () => {
  let nameState = ""

  const useNameAtom = atomic (() => {
    console.log ("--- useNameAtom ---")
    return nameState
  })
  
  function Name () {
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

    return <button onClick={onClick}>Switch</button>
  }

  function App () {
    return <>
      <Name />
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
    act (() => {
      screen.getByRole ("button").click()
    })

    await waitFor (() => {
      expect (screen.getByRole ("heading"))
        .toHaveTextContent ("Alicia")
    })
  })
})