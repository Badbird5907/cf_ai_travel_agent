import { tool, type ToolSet } from "ai";
import { z } from "zod";
import { Exa } from "exa-js";
import { env } from "cloudflare:workers";

const webSearch = tool({
  name: "web_search",
  description: "Search the web",
  inputSchema: z.object({
    query: z.string(),
  }),
  execute: async ({ query }) => {
    const exa = new Exa((env as Env).EXA_API_KEY);
    const results = await exa.search(query);
    return results;
  },
});

const weather = tool({
  name: "weather",
  description: "Get current weather information for any location. Use this tool for all weather-related queries.",
  inputSchema: z.object({
    location: z.string().describe("The city or location to get weather for"),
  }),
  execute: async ({ location }) => {
    return "The weather in " + location + " is rainy";
  },
});

export const tools = {
  webSearch,
  weather,
} satisfies ToolSet;