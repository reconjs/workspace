import recon, { get$ } from "@reconjs/core"
import { Hook$, View$, use$ } from "@reconjs/react"
import { PropsOf } from "@reconjs/utils-react"
import { Suspense, useState } from "react"

const $ = recon ("@/app/counter")

const viaCounting$ = $(() => {
  return Hook$ (() => {
    const [ count, setCount ] = useState (0)
    return { count, setCount }
  })
})

const CLASS = "w-8 flex flex-row items-center justify-center"

const useCountDisplay$ = $(() => {
  const $Counting = viaCounting$()
  const $count = get$ ($Counting)

  return View$ (() => {
    const { count } = $count()
    return (
      <div className={CLASS}>
        {count}
      </div>
    )
  })
})

const useIncrementButton$ = $(() => {
  const $Counting = viaCounting$()
  const useCounting = use$ ($Counting)

  return View$ (() => {
    const { count, setCount } = useCounting()

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

const useCounter$ = $(() => {
  const CountDisplay = useCountDisplay$()
  const IncrementButton = useIncrementButton$()

  return View$ (() => {
    return (
      <div className="w-fit flex flex-row border rounded-full divide-x">
        <button type="button" className={CLASS}>-</button>
        <CountDisplay />
        <IncrementButton />
      </div>
    )
  })
})

export function Counter () {
  const View = useCounter$()
  return (
    <Suspense fallback="Loading Counter...">
      <View />
    </Suspense>
  )
}
