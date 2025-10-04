# TravelAI

This is a agentic travel agent that uses AI to plan trips. It uses the Cloudflare AI stack and the AI SDK.

For search, I use free tier api keys for [Exa](https://exa.ai) and the [Google Flights RapidAPI](https://rapidapi.com/DataCrawler/api/google-flights2/playground).

I created this project to learn how to use the cloudflare workers + ai tech stack.

<img width="2944" height="1514" alt="brave_6x9ZhUMJcf" src="https://github.com/user-attachments/assets/8bd3122e-50f3-49a0-a4b4-97ea3da87e5b" />
<img width="2944" height="1514" alt="image" src="https://github.com/user-attachments/assets/63d03f1e-9b69-4142-8989-360e0183522a" />

## Tech Stack

- React
- Tailwind
- Shadcn UI
- Cloudflare Workers
- Cloudflare D1
- Cloudflare Agents SDK

## Try it out
Feel free to try it out at [travel.badbird.dev](https://travel.badbird.dev/)!

## Run it locally
To run it locally, follow the following instructions:
```
# Clone the repo
git clone https://github.com/Badbird5907/cf_ai_travel_agent/
cd cf_ai_travel_agent

# Define your environment variables - You can get free API keys for https://exa.ai and https://rapidapi.com/DataCrawler/api/google-flights2
cp .dev.vars.example .dev.vars
vim .dev.vars

# Install dependencies (make sure you have pnpm installed)
pnpm install

# Generate types
pnpm run typegen

# Run the dev server
pnpm run dev
```
