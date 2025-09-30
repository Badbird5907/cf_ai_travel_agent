import { getModel } from "@/agents/models";
import { AIChatAgent } from "agents/ai-chat-agent"
import { convertToModelMessages, createUIMessageStream, createUIMessageStreamResponse, generateText, streamText, stepCountIs, type StreamTextOnFinishCallback, type ToolSet } from "ai";
import { cleanupMessages, processToolCalls } from "./utils";
import { getTools, getPlannerTools } from "./tools";
import type { DeepPartial, TripData } from "@/types";
import { getSystemPrompt } from "./system";


export type AgentState = DeepPartial<TripData>
export class PlannerAgent extends AIChatAgent<Env, AgentState> {
  getState(): AgentState {
    return this.state as AgentState;
  }

  async onChatMessage(
    onFinish: StreamTextOnFinishCallback<ToolSet>,
    options?: { abortSignal?: AbortSignal }
  ) {
    const allTools = {
      ...getTools(this.env),
      ...getPlannerTools(this)
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
          system: getSystemPrompt(),
          // Remove stopWhen to allow model to continue until it naturally finishes
          onFinish: onFinish as unknown as StreamTextOnFinishCallback<typeof allTools>,
          stopWhen: stepCountIs(25),
          abortSignal: options?.abortSignal,
          onAbort: () => {
            console.log("Aborting stream");
          }
        });
        writer.merge(result.toUIMessageStream({
          sendReasoning: true,
        }))
      }
    })
    return createUIMessageStreamResponse({ stream });
  }
}