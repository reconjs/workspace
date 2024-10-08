import { atomic } from "recon"
import { Counter } from "./counter"
import { PropsOf } from "@reconjs/utils-react"

export function Separate (props: PropsOf <"div">) {
  return <>
    <h1>Counters that update separately</h1>
    <div {...props}>
      <Counter />
      <Counter />
    </div>
  </>
}

/*
function* Left$ () {
  yield $Section (() => null)
  
  const Counter = use$ (Counter$)
  return () => <Counter />
}

function* Right$ () {
  yield $Section (() => null)
  
  const Counter = use$ (Counter$)
  return () => <Counter />
}

export function* Separate$ () {
  const Left = use$ (Left$)
  const Right = use$ (Right$)
  
  return (props: PropsOf <"div">) => <>
    <h1>Counters that update separately</h1>
    <div {...props}>
      <Left />
      <Right />
    </div>
  </>
}
*/
