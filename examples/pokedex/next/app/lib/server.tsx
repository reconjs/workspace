"use server"

import { Species } from "./types"

export async function fetchSpecies () {
  const response = await fetch ("https://pokeapi.co/api/v2/generation/1")
  const data = await response.json()
  
  const list = data.pokemon_species as any[]
  
  const species = list.map (item => ({
    id: item.id,
    name: item.name,
    order: item.order,
    image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${item.id}.png`
  }))
  
  return species as Species[]
}