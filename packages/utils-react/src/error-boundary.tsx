"use client"
import { Component, PropsWithChildren } from "react"

type Props = PropsWithChildren <{
  fallback?: JSX.Element,
}>

export class ErrorBoundary extends Component <Props> {
  state = {
    hasError: false,
    error: null,
    errorInfo: null
  }

  componentDidCatch (error: any, errorInfo: any) {
    this.setState ({
      hasError: true,
      error: error,
      errorInfo: errorInfo
    })
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? null
    }

    return this.props.children
  }
}

export function ClientError (props: {
  message: string,
}) {
  throw new Error (props.message)
  return null
}
