import { memoize } from "@reconjs/utils"
import { fetchSpecies } from "./server"
import { Species } from "./types"
import { use } from "react"

function PokemonItem (props: {
  data: Species,
}) {
  return (
    <li>
      <img src={props.data.image} alt="sprite" />
      <p>{props.data.name}</p>
    </li>
  )
}

type ListProps = {
  region: string,
}

let promise: ReturnType <typeof fetchSpecies>

export function PokemonList () {
  promise ??= fetchSpecies()
  const species = use (promise)
  
  return (
    <ul>
      {species.map ((data) => (
        <PokemonItem key={data.id} data={data} />
      ))}
    </ul>
  )
}