"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Send, Bot, User } from "lucide-react"

interface Message {
  id: string
  type: "user" | "agent"
  content: string
  timestamp: Date
}

const mockMessages: Message[] = [
  {
    id: "1",
    type: "user",
    content: "Plan me a trip to Tokyo, Japan for 5 days",
    timestamp: new Date(Date.now() - 300000),
  },
  {
    id: "2",
    type: "agent",
    content:
      "I'd be happy to help you plan a 5-day trip to Tokyo! Let me search for the best flights, accommodations, and activities for your visit.",
    timestamp: new Date(Date.now() - 280000),
  },
  {
    id: "3",
    type: "agent",
    content:
      "I've found some excellent options for your Tokyo trip. I've selected flights with Japan Airlines, a luxury hotel in Shinjuku, and curated a mix of cultural experiences and modern attractions. The total cost comes to $2,850 for 5 days.",
    timestamp: new Date(Date.now() - 260000),
  },
  {
    id: "4",
    type: "user",
    content: "Can you show me some alternative hotel options?",
    timestamp: new Date(Date.now() - 240000),
  },
  {
    id: "5",
    type: "agent",
    content:
      "Of course! Let me find some alternative accommodations in different areas of Tokyo with various price points...",
    timestamp: new Date(Date.now() - 220000),
  },
]

export function ChatSidebar() {
  const [messages, setMessages] = useState<Message[]>(mockMessages)
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = () => {
    if (!inputValue.trim()) return

    const newMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputValue,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, newMessage])
    setInputValue("")
    setIsTyping(true)

    setTimeout(() => {
      const agentResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: "agent",
        content: "Temp message",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, agentResponse])
      setIsTyping(false)
    }, 2000)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="h-full flex flex-col bg-background border-r border-border/50">
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex gap-3 ${message.type === "user" ? "justify-end" : "justify-start"}`}>
            {message.type === "agent" && (
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <Bot className="w-4 h-4 text-primary" />
              </div>
            )}

            <div className={`max-w-[80%] ${message.type === "user" ? "order-first" : ""}`}>
              <Card
                className={`p-4 ${
                  message.type === "user" ? "bg-primary text-primary-foreground ml-auto" : "bg-muted/50"
                }`}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
              </Card>
              <p className="text-xs text-muted-foreground mt-1 px-1">
                {message.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>

            {message.type === "user" && (
              <div className="w-8 h-8 bg-muted/50 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <User className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <Bot className="w-4 h-4 text-primary" />
            </div>
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
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 border-t border-border/50">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your trip..."
              className="w-full min-h-[44px] max-h-32 px-4 py-3 bg-muted/50 border border-border/50 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 text-sm"
              rows={1}
            />
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isTyping}
            size="sm"
            className="h-[44px] px-4"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 px-1">Press Enter to send, Shift+Enter for new line</p>
      </div>
    </div>
  )
}
