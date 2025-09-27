# LLM Prompts
These are the prompts I used to help create parts of this app.

1.
Create a non-functional demo user interface for an AI agent travel planner web app. - The main layout should feature: - A prominent text box in the center of the screen where users can input travel prompts (e.g., “plan me a trip to San Francisco”). - After submission, display a dynamic timeline that illustrates the AI agent's progress through various stages (e.g., “searching for flights”, “looking for restaurants”, “finding hotels”). - The design should be clean, user-friendly, and visually engaging, with emphasis on the text box and timeline. - Final output state (instead of plain confirmation text): - After all steps, show a beautiful summary UI that presents a breakdown of the trip details (flights, accommodations, restaurants, activities, etc.) and an estimated total cost. - Use mock data stored in an object so the backend can be integrated later. Make sure the UI is beautiful, and feels lively, intuitive, and future-ready, with smooth transitions and visual feedback.Each step should be their own separate page (landing, timeline/waiting, results). It should be a full desktop experience with well laid out components that uses all available space.

2. 
Create typescript types for @mock.ts 
put them in app/types/...

3.
I am building a AI travel agent. Help me define the workflow I have mostly worked out in @plan.ts to get @mock.ts 

Example code:
[copy paste of orchestrator pattern from https://developers.cloudflare.com/agents/patterns/]

