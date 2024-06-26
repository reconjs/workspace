import { useState } from "react"
import { context$, provide$, use$ } from "recon"

function getCounterClass (color: string) {
  const flex = "flex flex-row items-center justify-center"
  const border = `border border-${color}-500 rounded-full`
  const divide = `divide-x divide-${color}-500`
  return `h-10 w-40 ${flex} ${border} ${divide}`
}
/*
export function* section$ () {
  yield context$()
  return null
}*/

function* countState$ () {
  console.log ("count state")
  // yield* use$ (section$)
  const [ count, setCount ] = useState (0)
  return { count, setCount }
  // return { count: 0, setCount: (num: number) => {} }
}

function* CountChanger$ (amount: number) {
  const { count, setCount } = yield* use$ (countState$)

  function onClick () {
    setCount (count + amount)
  }

  const content = amount > 0 ? "+" : "-"

  return () => (
    <button className="flex-1" onClick={onClick}>
      {content}
    </button>
  )
}

export function* Counter$ () {
  /*
  provide$ (section$, () => {
    console.log ("providing counter")
  })
  */
  const Decrementor = use$ (CountChanger$, -1)
  const Incrementor = use$ (CountChanger$, 1)
  const { count } = yield* use$ (countState$)

  const innerClass = "flex-1 w-1/2 flex items-center justify-center"

  type Props = {
    color?: string
  }

  return (props: Props) => (
    <div className={getCounterClass (props.color ?? "blue")}>
      <Decrementor />
      <div className={innerClass}>{count}</div>
      <Incrementor />
    </div>
  )
}
