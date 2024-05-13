import { defineView } from "@reconjs/react"

import { usingChatbot } from "./chatbot"

export const usingFooter = defineView (() => {
  type Props = {
    className: string,
  }

  const Chatbot = usingChatbot ()

	return (props: Props) => {
    let { className = "" } = props

		return (
			<footer className={className}>
				<div>This is a footer</div>
        <div className="fixed bottom-8 right-8 z-10">
          <Chatbot />
        </div>
			</footer>
		)
	}
})
