import { render, screen, waitFor } from "@testing-library/react"
import { 
  act, 
  Suspense, 
  use, 
} from "react"
// import { Regenerator, get$, use$ } from "recon"
import { _use, atomic, revalidate } from "recon"
import { vi, beforeEach, describe, expect, test } from "vitest"
import * as matchers from "@testing-library/jest-dom/matchers"

expect.extend (matchers)

function NOT_IMPLEMENTED (): any {
  throw new Error ("Not implemented")
}

describe ("Alice -> Alicia", () => {
  const LOADING = <h2>Loading...</h2>

  const useNameMock = vi.fn <() => any> (NOT_IMPLEMENTED)

  function renderName () {
    const useNameAtom = atomic ((): string => {
      return useNameMock()
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
        revalidate (_name)
      }
  
      return <button {...{ onClick }}>Switch</button>
    }
  
    function App () {
      return <>
        <Name />
        <SwitchName />
      </>
    }

    render (
      <Suspense fallback={LOADING}>
        <App />
      </Suspense>
    )
  }

  async function expectName (name: string) {
    await waitFor (() => {
      expect (screen.getByRole ("heading"))
        .toHaveTextContent (name)
    })
  }

  function clickRevalidator () {
    console.group ("act")
    act (() => {
      console.group ("click")
      screen.getByRole ("button").click()
      console.groupEnd()
    })
    console.groupEnd()
  }

  test ("useNameAtom is sync", async () => {
    useNameMock.mockImplementationOnce (() => "Alice")
    renderName()
    await expectName ("Alice")

    useNameMock.mockImplementationOnce (() => "Alicia")
    clickRevalidator()
    await expectName ("Alicia")
  })

  test ("useNameAtom is async", async () => {
    useNameMock.mockImplementationOnce (async () => "Alice")
    renderName()
    await expectName ("Alice")

    useNameMock.mockImplementationOnce (async () => "Alicia")
    clickRevalidator()
    await expectName ("Alicia")
  })

  describe ("useNameAtom uses another atom", () => {
    const useNestedMock = vi.fn ((): any => {
      throw new Error ("useNestedMock not implemented")
    })

    const useNestedAtom = atomic ((): string => {
      return useNestedMock()
    })

    beforeEach (() => {
      useNameMock.mockImplementation (() => {
        const atom = useNestedAtom()
        return use (atom)
      })
    })

    test ("useNameAtom is sync", async () => {
      useNestedMock.mockImplementationOnce (() => "Alice")
      renderName()
      await expectName ("Alice")
  
      useNestedMock.mockImplementationOnce (() => "Alicia")
      clickRevalidator()
      await expectName ("Alicia")
    })
  
    test ("useNameAtom is async", async () => {
      useNestedMock.mockImplementationOnce (async () => "Alice")
      renderName()
      await expectName ("Alice")
  
      useNestedMock.mockImplementationOnce (async () => "Alicia")
      clickRevalidator()
      await expectName ("Alicia")
    })
  })
})
