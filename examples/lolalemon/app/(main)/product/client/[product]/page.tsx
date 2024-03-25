import {
  PropsWithChildren,
  Suspense,
} from "react"
import {
  BrowserBoundary,
  ErrorBoundary,
} from "@reconjs/utils-react"
import { ProductPage } from "../../lib/page"

type Props = PropsWithChildren <{
  params: {
    product: string,
  },
}>

export default async function Page (props: Props) {
  return (
    <div>
      <BrowserBoundary>
        <ErrorBoundary>
          <Suspense>
            <ProductPage slug={props.params.product} />
          </Suspense>
        </ErrorBoundary>
      </BrowserBoundary>
    </div>
  )
}
