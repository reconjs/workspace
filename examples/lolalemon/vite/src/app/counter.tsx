import recon, { get$ } from "@reconjs/core"
import { Hook$, View$, use$ } from "@reconjs/react"
import { ErrorBoundary, PropsOf } from "@reconjs/utils-react"
import { Suspense, use, useState } from "react"

const $ = recon ("@/app/counter")

const getCounter$ = $(() => {
  return Hook$ (() => {
    const [ count, setCount ] = useState (0)
    return { count, setCount }
  })
})

const CLASS = "w-8 flex flex-row items-center justify-center"

const useCountDisplay$ = $(() => {
  const $counter = getCounter$()

  return View$ (() => {
    const { count } = $counter()
    return (
      <div className={CLASS}>
        {count}
      </div>
    )
  })
})

const useIncrementButton$ = $(() => {
  const $counter = getCounter$()
  const ctx = use$ ($counter)

  return View$ (() => {
    const { count, setCount } = use (ctx)

    const btn: PropsOf <"button"> = {}
    btn.type = "button"
    btn.className = CLASS

    btn.onClick = () => {
      setCount (count + 1)
    }

    return (
      <button {...btn}>+</button>
    )
  })
})

export const useCounter$ = $(() => {
  const CountDisplay = useCountDisplay$()
  const IncrementButton = useIncrementButton$()

  return View$ (() => {
    return (
      <div className="w-fit flex flex-row border rounded-full divide-x">
        <button type="button" className={CLASS}>-</button>
        <CountDisplay />
        <ErrorBoundary fallback={<p>ERR INCR</p>}>
          <IncrementButton />
        </ErrorBoundary>
      </div>
    )
  })
})
