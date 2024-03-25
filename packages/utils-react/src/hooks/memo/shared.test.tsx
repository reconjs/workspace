import "@testing-library/jest-dom"

import { DependencyList, useEffect, useMemo, useRef, useState } from "react"
import { beforeEach, expect, test } from 'vitest'

import { act, renderHook } from "@testing-library/react"

import { useMemoDeep, useMemoShallow } from "./index"

function useRenderWatcher (deps: DependencyList) {
  const ref = useRef ({
    total: -1,
    changed: -1,
  })

  useEffect (() => {
    ref.current.changed += 1
  }, deps)

  useEffect (() => {
    ref.current.total += 1
  })

  return ref
}

function buildTestsFor (useMemoize: typeof useMemo, changed: number) {
  describe (useMemoize.name, () => {
    // abstract - arranger

    const arrange = () => renderHook (() => {
      const [ obj, setValue ] = useState <any> ({})
      const text = useMemoize (() => {
        return obj
      }, [ obj ])

      return {
        watcherRef: useRenderWatcher ([ text ]),
        setValue,
      }
    })

    let arranged: ReturnType <typeof arrange>

    // helpers

    const getChanged = () => arranged.result.current.watcherRef.current.changed
    const getTotal = () => arranged.result.current.watcherRef.current.total
    const setValue = (val: any) => arranged.result.current.setValue (val)

    // arrange

    beforeEach (() => {
      arranged = arrange ()
    })

    // act

    describe ("setting value to empty object", () => {
      beforeEach (() => {
        act (() => {
          setValue ({})
        })
      })
    
      // assert
    
      test ("total renders to be 1", async () => {
        expect (getTotal()).toBe (1)
      })
    
      test (`changed renders to be ${changed}`, async () => {
        expect (getChanged()).toBe (changed)
      })
    })
  })
}

buildTestsFor (useMemo, 1)
buildTestsFor (useMemoDeep, 0)
buildTestsFor (useMemoShallow, 0)
