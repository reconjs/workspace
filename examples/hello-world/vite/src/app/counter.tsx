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
}
*/

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

const initialCount = 0

function* countState$ () {
  // yield* use$ (section$)
  const initialCount = yield* use$ (initialCount$)
  
  return use$ (() => {
    // return { count: 0, setCount: (num: number) => {}  }
    const [ count, setCount ] = useState (initialCount)
    return { count, setCount }
  })
  
  // return { count: 0, setCount: (num: number) => {} }
}

export function* Counter$ () {
  const { count, setCount } = yield* use$ (countState$)
  
  return () => (
    <BasicCounter count={count} setCount={setCount} />
  )
}

/*
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
  // provide$ (section$, () => {
  //  console.log ("providing counter")
  // })
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
*/
