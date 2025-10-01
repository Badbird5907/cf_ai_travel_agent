"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { useAgent } from "agents/react"
import { isToolUIPart } from "ai"
import { useAgentChat } from "agents/ai-react"
import type { UIMessage } from "@ai-sdk/react"
import type { getTools, getPlannerTools } from "../agents/tools"
import type { PlannerAgent } from "../agents/plan"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Send, Bot, User, Trash2, Square, Loader2 } from "lucide-react"
import ReactMarkdown from "react-markdown"
import { Task, TaskContent, TaskItem, TaskTrigger } from "@/components/ai-elements/task"
import { useTRPC } from "@/utils/trpc"
import { useMutation } from "@tanstack/react-query"

type AllTools = ReturnType<typeof getTools> & ReturnType<typeof getPlannerTools>
// List of tools that require human confirmation
const toolsRequiringConfirmation: (keyof AllTools)[] = []
const toolActions: Record<keyof AllTools, [string, string]> = {
  webSearch: ["Searching the web", "Searched the web"],
  readSite: ["Reading a website", "Read a website"],
  weather: ["Checking the weather", "Checked the weather"],
  searchFlights: ["Searching for flights", "Searched for flights"],
  writeMetadata: ["Updating trip metadata", "Updated trip metadata"],
  getMetadata: ["Getting trip metadata", "Got trip metadata"],
  clearState: ["Clearing trip state", "Cleared trip state"],
  listFlights: ["Listing flight groups", "Listed flight groups"],
  addFlight: ["Adding flight to trip", "Added flight to trip"],
  removeFlight: ["Removing flight from trip", "Removed flight from trip"],
  listHotels: ["Listing hotels", "Listed hotels"],
  addHotel: ["Adding hotel to trip", "Added hotel to trip"],
  removeHotel: ["Removing hotel from trip", "Removed hotel from trip"],
  listActivities: ["Listing activities", "Listed activities"],
  addActivities: ["Adding activities to trip", "Added activities to trip"],
  removeActivity: ["Removing activity from trip", "Removed activity from trip"],
  listRestaurants: ["Listing restaurants", "Listed restaurants"],
  addRestaurant: ["Adding restaurant to trip", "Added restaurant to trip"],
  removeRestaurant: ["Removing restaurant from trip", "Removed restaurant from trip"],
  listItinerary: ["Listing itinerary", "Listed itinerary"],
  addItinerary: ["Adding itinerary to trip", "Added itinerary to trip"],
  removeItinerary: ["Removing itinerary from trip", "Removed itinerary from trip"],
}

function ToolTask({
  part,
  toolName,
  toolCallId,
  isGeneratingLatest,
  needsConfirmation,
  addToolResult,
  isCurrentToolCall
}: {
  part: any
  toolName: string
  toolCallId: string
  isGeneratingLatest: boolean
  needsConfirmation: boolean
  addToolResult: (args: { tool: string; toolCallId: string; output: any }) => void
  isCurrentToolCall: boolean
}) {
  const [userOpen, setUserOpen] = useState(false)

  useEffect(() => {
    if (!isGeneratingLatest) {
      setUserOpen(false)
    }
  }, [isGeneratingLatest])

  const isOpen = isGeneratingLatest || userOpen

  // const userFriendlyToolName = toolNames[toolName as keyof AllTools] ?? part.type.replace("tool-", "")
  const type = part.type.replace("tool-", "")
  const actionLabels =
    toolActions[toolName as keyof AllTools] ??
    [type, type]
  const titleText = isGeneratingLatest ? actionLabels[0] : actionLabels[1]

  return (
    <Task defaultOpen={false} open={isOpen} onOpenChange={setUserOpen} className="pb-2">
      <TaskTrigger title={`${titleText}`}>
        {isCurrentToolCall ? (
          <div className="flex w-full cursor-pointer items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground">
            <Loader2 className="size-4 animate-spin" />
            <p className="text-sm">{titleText}</p>
          </div>
        ) : undefined}
      </TaskTrigger>
      <TaskContent>
        <TaskItem>
          <p className="text-sm text-muted-foreground">Status: {part.state}</p>
        </TaskItem>
        {part.input != null && (
          <TaskItem>
            <strong>Input:</strong>
            <pre className="bg-muted p-2 rounded mt-1 text-xs overflow-auto">
              {JSON.stringify(part.input, null, 2)}
            </pre>
          </TaskItem>
        )}
        {part.output != null && (
          <TaskItem>
            <strong>Output:</strong>
            <pre className="bg-muted p-2 rounded mt-1 text-xs overflow-auto">
              {typeof part.output === "string" ? part.output : JSON.stringify(part.output, null, 2)}
            </pre>
          </TaskItem>
        )}
        {part.state === "input-available" && needsConfirmation && (
          <TaskItem className="flex gap-2">
            <Button
              onClick={() =>
                addToolResult({
                  tool: part.type.replace("tool-", ""),
                  toolCallId,
                  output: { confirmed: true }
                })
              }
              size="sm"
            >
              Confirm
            </Button>
            <Button
              onClick={() =>
                addToolResult({
                  tool: part.type.replace("tool-", ""),
                  toolCallId,
                  output: { confirmed: false }
                })
              }
              variant="outline"
              size="sm"
            >
              Cancel
            </Button>
          </TaskItem>
        )}
      </TaskContent>
    </Task>
  )
}

export function ChatSidebar({ agentId, initialPrompt }: { agentId: string; initialPrompt?: string }) {
  if (typeof window === "undefined") {
    return null
  }

  const [inputValue, setInputValue] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const hasSentInitialPromptRef = useRef(false)

  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }, [])

  const trpc = useTRPC()
  const markPromptUsedMutation = useMutation(trpc.plan.markInitialPromptUsed.mutationOptions())

  const agent = useAgent({
    agent: "PlannerAgent",
    name: agentId,
  })
  const {
    messages: agentMessages,
    addToolResult,
    clearHistory,
    status,
    sendMessage,
    stop
  } = useAgentChat<unknown, UIMessage<{ createdAt: string }>>({
    agent
  })

  // Send initial prompt if there are no messages and we haven't sent it yet
  useEffect(() => {
    if (!hasSentInitialPromptRef.current && initialPrompt && agentMessages.length === 0 && status === "ready") {
      hasSentInitialPromptRef.current = true
      sendMessage(
        {
          role: "user",
          parts: [{ type: "text", text: initialPrompt }]
        },
        {
          body: {}
        }
      )
      
      // Mark the initial prompt as used in the database
      markPromptUsedMutation.mutate({ agentId })
    }
  }, [initialPrompt, agentMessages.length, status, sendMessage, agentId, markPromptUsedMutation])

  useEffect(() => {
    scrollToBottom()
  }, [agentMessages, scrollToBottom])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim()) return

    const message = inputValue
    setInputValue("")

    await sendMessage(
      {
        role: "user",
        parts: [{ type: "text", text: message }]
      },
      {
        body: {}
      }
    )
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(e as unknown as React.FormEvent)
    }
  }

  const pendingToolCallConfirmation = agentMessages.some((m: UIMessage) =>
    m.parts?.some(
      (part) =>
        isToolUIPart(part) &&
        part.state === "input-available" &&
        toolsRequiringConfirmation.includes(
          part.type.replace("tool-", "") as keyof AllTools
        )
    )
  )

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="h-full flex flex-col bg-background border-r border-border/50">
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4">
        {agentMessages.map((m, index) => {
          const isUser = m.role === "user"
          const showAvatar = index === 0 || agentMessages[index - 1]?.role !== m.role
          const isLatestMessage = index === agentMessages.length - 1
          const isGeneratingLatest = isLatestMessage && (status === "submitted" || status === "streaming")

          return (
            <div key={m.id}>
              <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
                {!isUser && showAvatar && (
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                )}
                {!isUser && !showAvatar && <div className="w-8" />}

                <div className={`max-w-[80%] ${isUser ? "order-first" : ""}`}>
                  {m.parts && m.parts.length > 0 ? (
                    m.parts.map((part, i) => {
                      if (part.type === "text") {
                        return (
                          <div key={i}>
                            <Card
                              className={`p-4 ${
                                isUser ? "bg-primary text-primary-foreground ml-auto" : "bg-muted/50"
                              }`}
                            >
                              <div className="text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none">
                                <ReactMarkdown>{part.text}</ReactMarkdown>
                              </div>
                            </Card>
                            <p className={`text-xs text-muted-foreground mt-1 px-1 ${isUser ? "text-right" : "text-left"}`}>
                              {formatTime(
                                m.metadata?.createdAt
                                  ? new Date(m.metadata.createdAt)
                                  : new Date()
                              )}
                            </p>
                          </div>
                        )
                      }

                      if (isToolUIPart(part)) {
                        const toolCallId = part.toolCallId
                        const toolName = part.type.replace("tool-", "")
                        const needsConfirmation = toolsRequiringConfirmation.includes(
                          toolName as keyof AllTools
                        )

                        // Determine if this is the current tool call being executed
                        const toolParts = m.parts?.filter(isToolUIPart) || []
                        const isLastToolInMessage = toolParts[toolParts.length - 1]?.toolCallId === toolCallId
                        const isCurrentToolCall = isGeneratingLatest && isLastToolInMessage

                        return (
                          <ToolTask
                            key={`${toolCallId}-${i}`}
                            part={part}
                            toolName={toolName}
                            toolCallId={toolCallId}
                            isGeneratingLatest={isGeneratingLatest}
                            needsConfirmation={needsConfirmation}
                            addToolResult={addToolResult}
                            isCurrentToolCall={isCurrentToolCall}
                          />
                        )
                      }
                      return null
                    })
                  ) : (
                    // Show animated dots if this is an agent message with no parts yet (agent is responding)
                    !isUser && (status === "submitted" || status === "streaming") && index === agentMessages.length - 1 && (
                      <Card className="bg-muted/50 p-4">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"></div>
                          <div
                            className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"
                            style={{ animationDelay: "0.1s" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          ></div>
                        </div>
                      </Card>
                    )
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 bg-muted/50 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>
          )
        })}


        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 border-t border-border/50">
        <form onSubmit={handleSendMessage}>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={
                  pendingToolCallConfirmation
                    ? "Please respond to the tool confirmation above..."
                    : "Ask me anything about your trip..."
                }
                disabled={pendingToolCallConfirmation}
                className="w-full min-h-[48px] max-h-40 px-4 py-3.5 bg-background/60 backdrop-blur-sm border border-input rounded-2xl shadow-inner resize-none focus:outline-none focus:ring-4 focus:ring-primary/25 focus:border-transparent text-sm placeholder:text-muted-foreground/70 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
                rows={1}
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={clearHistory}
                size="icon"
                variant="outline"
                className="size-[48px] rounded-xl px-0 shadow-lg hover:shadow-muted-foreground/20"
                title="Clear chat history"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              {status === "submitted" || status === "streaming" ? (
                <Button
                  type="button"
                  onClick={stop}
                  size="icon"
                  className="size-[48px] rounded-xl px-0 shadow-lg shadow-destructive/20 hover:shadow-destructive/30"
                  variant="destructive"
                >
                  <Square className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={!inputValue.trim() || pendingToolCallConfirmation}
                  size="icon"
                  className="size-[48px] rounded-xl px-0 shadow-lg shadow-primary/20 hover:shadow-primary/30"
                >
                  <Send className="w-4 h-4" />
                </Button>
              )}
            </div>
           
          </div>
        </form>
      </div>
    </div>
  )
}
