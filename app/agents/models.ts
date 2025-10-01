import { createWorkersAI } from "workers-ai-provider";
import type { LanguageModel } from "ai";
import { openai } from "@ai-sdk/openai";

export const getModel = (env: Env): LanguageModel => {
  // const workersAi = createWorkersAI({ binding: env.AI });
  // return workersAi("@cf/mistral/mistral-7b-instruct-v0.1"); // any to fix weird type error
  return openai("gpt-4o-mini");
}

