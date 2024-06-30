import { useState } from "react"
import { context$, use$ } from "recon"

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

function* initialCount$ () {
  if (loadingCount++ > 10) throw new Error ("Should not be loading so much")
  return use$ (async () => {
    
    await timeout (1000)
    return 0
  })
}

// const initialCount = 0
// const count = 0
// const setCount = (num: number) => {}

function* countState$ () {
  // yield* use$ (section$)
  const initialCount = yield* use$ (initialCount$)
  
  return use$ (() => {
    const [ count, setCount ] = useState (initialCount)
    return { count, setCount }
  })
}

export function* Counter$ () {
  const { count, setCount } = yield* use$ (countState$)
  
  return () => (
    <BasicCounter count={count} setCount={setCount} />
  )
}
