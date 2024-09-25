import { Func } from "@reconjs/utils"
import { use, useState } from "react"
import { atomic } from "recon"

export function useSectionScope (func: Func) {}
export function useSectionAtom () {}

// const [
//   useSectionAtom,
//   useSectionScope,
// ] = scope (() => {
//   return null
// })

function getCounterClass (color: string) {
  const flex = "flex flex-row items-center justify-center"
  const border = `border border-${color}-500 rounded-full`
  const divide = `divide-x divide-${color}-500`
  return `h-10 w-40 ${flex} ${border} ${divide}`
}

async function timeout (ms: number) {
  return new Promise (resolve => setTimeout (resolve, ms))
}

function BasicCounter (props: {
  count: number,
  setCount: (num: number) => void
}) {
  function decrement () {
    props.setCount (props.count - 1)
  }
  
  function increment () {
    props.setCount (props.count + 1)
  }
  
  const innerClass = "flex-1 w-1/2 flex items-center justify-center"
  
  return (
    <div className={getCounterClass ("blue")}>
      <button className="flex-1" onClick={decrement}>-</button>
      <div className={innerClass}>{props.count}</div>
      <button className="flex-1" onClick={increment}>+</button>
    </div>
  )
}



let loadingCount = 0

const useInitialCount = atomic (() => {
  if (loadingCount++ > 10) throw new Error ("Should not be loading so much")
  // await timeout (1000)
  return 0
})

const useCountStateAtom = atomic (() => {
  useSectionAtom()
  const _initial = useInitialCount()
  const initial = use (_initial)
  
  const [ count, setCount ] = useState (initial)
  return { count, setCount }
})

export function Counter () {
  const _state = useCountStateAtom()
  const { count, setCount } = use (_state)
  
  return (
    <BasicCounter count={count} setCount={setCount} />
  )
}

// This disables react-refresh from running and ruining everything.
export const COUNTER_SYMBOL = Symbol()
