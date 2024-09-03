import { PropsOf } from "@reconjs/utils-react"
import { useState } from "react"

function Counter ({ count, setCount }: any) {  
  return (
    <button className="border p-4 bg-white" onClick={() => setCount(count + 1)}>
      Count is {count}
    </button>
  )
}

function Row (props: any) {
  return <>
    <div className="border p-4 rounded-md bg-gray-100">
      <h2 className="text-center">Counters that update together</h2>
      <div className="flex flex-row items-center justify-center gap-4 mt-4">
        <Counter {...props} />
        <Counter {...props} />
      </div>
    </div>
  </>
}

export function Page () {
  const [firstCount, setFirstCount] = useState(0)
  const [secondCount, setSecondCount] = useState(0)
  
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-center text-xl italic">Rows that update independently</h1>
      <Row count={firstCount} setCount={setFirstCount} />
      <Row count={secondCount} setCount={setSecondCount} />
    </div>
  )
}