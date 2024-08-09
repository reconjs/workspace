import { use$ } from "recon"
import { recommendations$ } from "./product"
import { ProductCard$ } from "./product-card"

function Card (props: {
  id: string,
}) {
  const ProductCard = use$ (ProductCard$, props.id)
  return <ProductCard />
}

export function* Recommendations$ () {
  const products = yield* use$ (recommendations$)
  console.log ("PRODUCTS", products)
  
  return (props: {}) => (
    <ul className="w-full flex flex-row items-center justify-between">
      {products.map (id => (
        <li key={id}>
          <Card id={id} />
        </li>
      ))}
    </ul>
  )
}