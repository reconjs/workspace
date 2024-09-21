import { ErrorBoundary } from "@reconjs/utils-react"
import { Suspense, use } from "react"
import { atomic, _use } from "recon"

let n = 0

function doo <T> (func: () => T) {
  return func()
}

const guid = doo (() => {
  let count = 0
  return () => {
    if (count > 50) throw new Error ("INFINITE LOOP")
    return count++
  }
})

const useAppIdAtom = atomic (() => {
  return guid()
})

function Section (props: {
  label: string
}) {
  const atom = useAppIdAtom()
  // const id = use (atom)
  return <div>{props.label}: {atom}</div>
}

function App () {
  if (n++ > 50) {
    throw new Error ("INFINITE LOOP")
  }

  return <>
    <h1>Zero: {guid()}</h1>
    <Section label="One" />
    <Section label="Uno" />
  </>
}

export function Root () {
  return (
    <ErrorBoundary fallback="Error...">
      <Suspense fallback="Loading...">
        <App />
      </Suspense>
    </ErrorBoundary>
  )
}
