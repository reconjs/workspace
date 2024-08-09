import { use$ } from "recon"
import { Counter$, $Section } from "./counter"
import { PropsOf } from "@reconjs/utils-react"

function* Left$ () {
  const Counter = use$ (Counter$)
  return () => <Counter />
}

function* Right$ () {
  const Counter = use$ (Counter$)
  return () => <Counter />
}

export function* Together$ () {
  yield $Section (() => null)
  
  const Left = use$ (Left$)
  const Right = use$ (Right$)
  
  return (props: PropsOf <"div">) => <>
    <h1>Counters that update together</h1>
    <div {...props}>
      <Left />
      <Right />
    </div>
  </>
}
