import { getModel } from "@/agents/models";
import { type Connection, type ConnectionContext, type WSMessage } from "agents";
import { AIChatAgent } from "agents/ai-chat-agent"
import { convertToModelMessages, createUIMessageStream, createUIMessageStreamResponse, generateText, streamText, stepCountIs, type StreamTextOnFinishCallback, type ToolSet } from "ai";
import { connect } from "cloudflare:sockets";
import { cleanupMessages, processToolCalls } from "./utils";
import { tools } from "./tools";

interface AgentProps {
  prompt: string;
  userGeoLocation: string;
}
export class PlannerAgent extends AIChatAgent<Env, AgentProps> {
  enableSql = true;
  async getState() {
    return this.state;
  }

  async onChatMessage(
    onFinish: StreamTextOnFinishCallback<ToolSet>,
    _options?: { abortSignal?: AbortSignal }
  ) {
    const allTools = {
      ...tools,
    } satisfies ToolSet;
    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        const cleanedMessage = cleanupMessages(this.messages);
        const processedMessages = await processToolCalls({
          tools: allTools,
          messages: cleanedMessage,
          dataStream: writer,
          executions: {}
        })
      
        const result = streamText({
          messages: convertToModelMessages(processedMessages),
          model: getModel(this.env),
          tools: allTools,
          // Remove stopWhen to allow model to continue until it naturally finishes
          onFinish: onFinish as unknown as StreamTextOnFinishCallback<typeof allTools>,
          stopWhen: stepCountIs(25)
        });
        writer.merge(result.toUIMessageStream())
      }
    })
    return createUIMessageStreamResponse({ stream });
  }
}