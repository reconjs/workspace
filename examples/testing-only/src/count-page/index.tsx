import { Fragment, Suspense } from "react"
import { Separate } from "./separate"
import { Together } from "./together"
import { PropsOf } from "@reconjs/utils-react"

const fallback = <div>Loading...</div>

// const Together = (props: PropsOf <"div">) => null
// const Separate = (props: PropsOf <"div">) => null

export function Page() {
  // const Together = useTogetherView()
  // const Separate = useSeparateView()
  
  return (
    <main className="flex flex-col items-center justify-center gap-4 p-8">
      <Suspense fallback={fallback}>
        <Together className="flex flex-row gap-4" />
        <Separate className="flex flex-row gap-4" />
      </Suspense>
    </main>
  )
}
