import { guidBy, timeout } from "@reconjs/utils"
import { PropsOf } from "@reconjs/utils-react"
import { act, render, screen, waitFor } from "@testing-library/react"
import { Suspense, useState, use } from "react"
import { _use, atomic, useView } from "recon"

import { beforeEach, describe, expect, test, vi } from "vitest"
import * as matchers from "@testing-library/jest-dom/matchers"

expect.extend (matchers)

function doo <T> (func: () => T) {
  return func()
}

describe ("_use", () => {
  test ("Shared ID", async () => {
    const guid = doo (() => {
      let count = 0
      return () => count++
    })

    const useAppId = atomic (() => {
      console.log ("--- useAppId ---")
      return _use (() => guid())
    })

    function Section (props: {
      label: string
    }) {
      const id = useAppId()
      return <div>{props.label}: {id}</div>
    }
    
    function App () {
      return <>
        <h1>Zero: {guid()}</h1>
        <Section label="One" />
        <Section label="Uno" />
      </>
    }
    
    render (<App />)
    
    expect (screen.getByText ("Zero: 0")).toBeVisible()
    expect (screen.getByText ("One: 1")).toBeVisible()
    expect (screen.getByText ("Uno: 1")).toBeVisible()
  })
})