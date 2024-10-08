# Yet Another State Management Library

ReconJS is an extension of React which adds better state management support.

- [x] Share State between Distant Components
- [x] Data Loading
- [x] Non-Global Lifecycles
- [x] Actions & Transitions

NOTE: This library is a work-in-progress.

## Hello World

```jsx
import { use, useState } from "react"
import { atomic } from "@reconjs/react"

import { fetchTranslated } from "..." // you

const useGreetingAtom = atomic (async () => {
  return await fetchTranslated ("en", "Hello")
})

const useAudienceAtom = atomic (() => {
  const [ audience, setAudience ] = useState ("World")
  return { audience, setAudience }
})

function Page () {
  const _greeting = useGreetingAtom()
  const _audience = useAudienceAtom()

  const greeting = use (_greeting)
  const { audience } = use (_audience)

  // Hello World
  return <h1>{greeting} {audience}</h1>
}
```

## Atomic Hooks

Hooks are a nice pattern but they have one major problem: they **must** belong to a React Component.

But what if I want to share state between multiple components? 
That's what an Atomic Hook is for! 
A hook that is shared between components.

## Getting Started

Currently, this library isn't being published because it doesn't work yet.

v0.1 is coming in early November 2024!
