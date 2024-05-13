import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'

// gets timestamp (to be used with next fetch)
export async function GET () {
  return NextResponse.json ({ now: Date.now() })
}

// calls revalidate tag
export async function POST (request: NextRequest) {
  const tag = request.nextUrl.searchParams.get ("tag")
  let revalidated = false

  if (tag) {
    revalidateTag (tag)
    revalidated = true
  }

  return NextResponse.json ({ 
    tag, 
    revalidated, 
    now: Date.now(),
  })
}
