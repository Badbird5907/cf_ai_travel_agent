# LLM Prompts
These are the prompts I used to help create parts of this app.

Models Used (ranked by frequency):
grok-code-fast-1
gpt-5
claude 4 sonnet

1.
Create a non-functional demo user interface for an AI agent travel planner web app. - The main layout should feature: - A prominent text box in the center of the screen where users can input travel prompts (e.g., “plan me a trip to San Francisco”). - After submission, display a dynamic timeline that illustrates the AI agent's progress through various stages (e.g., “searching for flights”, “looking for restaurants”, “finding hotels”). - The design should be clean, user-friendly, and visually engaging, with emphasis on the text box and timeline. - Final output state (instead of plain confirmation text): - After all steps, show a beautiful summary UI that presents a breakdown of the trip details (flights, accommodations, restaurants, activities, etc.) and an estimated total cost. - Use mock data stored in an object so the backend can be integrated later. Make sure the UI is beautiful, and feels lively, intuitive, and future-ready, with smooth transitions and visual feedback.Each step should be their own separate page (landing, timeline/waiting, results). It should be a full desktop experience with well laid out components that uses all available space.

2. 
Create typescript types for @mock.ts 
put them in app/types/...

3.
I am building a AI travel agent. Help me define the workflow I have mostly worked out in @plan.ts to get @mock.ts 

Example code:
[copy paste of orchestrator pattern from https://developers.cloudflare.com/agents/patterns/]

4. 
I am building a AI travel agent. I want to refactor this code to support tool calls (see allTools).
Modify this agent so that each step first generates some context text that is then fed into generateObject, as generateText can take in tools.

5. 
Generate types for this in @google-flights.ts 
[response from https://rapidapi.com/DataCrawler/api/google-flights2/playground/apiendpoint_ce4a44ea-f781-4baf-883f-ea1b7da10907]

5.1.
Also query params:
departure_id
*
LAX
String
The IATA code of the departure airport.
Relevant Endpoint: Use the Search Airport endpoint (api/v1/searchAirport) to get a valid IATA codes (data-> id).
Example: LAX
arrival_id
*
JFK
String
The IATA code of the arrival airport.
Relevant Endpoint: Use the Search Airport endpoint (api/v1/searchAirport) to get a valid IATA codes (data-> id).
Example: JFK
outbound_date
*

mm/dd/yyyy
Date (yyyy-mm-dd)
The date of departure for the trip.
Format: YYYY-MM-DD
Example: 2025-04-01
return_date
(optional)

mm/dd/yyyy
Date (yyyy-mm-dd)
The date of return for round-trip flights.
Format: YYYY-MM-DD
Example: 2025-04-10
travel_class
(optional)
ECONOMY
Enum
Specifies the preferred cabin class, such as Economy, Premium Economy, Business, or First Class.
Available Travel Class: ECONOMY, PREMIUM_ECONOMY, BUSINESS, or FIRST.
Default: ECONOMY
Example: ECONOMY
adults
(optional)
1
String
The number of adult passengers (age 12+).
Default Value: 1
Example: 2
children
(optional)
String
The number of child passengers (ages 2–11).
Default Value: 0
Example: 1
infant_on_lap
(optional)
String
The count of infants traveling without a seat, sitting on an adult's lap (ages < 2).
Default Value: 0
Example: 1
infant_in_seat
(optional)
String
The count of infants (below 2 years old) who require a separate seat.
Default Value: 0
Example: 1
show_hidden
(optional)
1
String
Indicates whether hidden should be included in results.
Available Options: YES(1) and NO(0)
Default Value: 0
Example: 1
currency
(optional)
USD
String
Sets the currency for price formatting in the response.
Valid currency codes can be fetched using the Get Supported Currencies API endpoint (api/v1/getCurrency) as (data-> currency_code).
Default Value: USD
Example: USD for US Dollars.
language_code
(optional)
en-US
String
Specifies the language in which the response should be returned.
Relevant Endpoint: Use the Get Supported Languages endpoint (api/v1/getLanguages) to fetch a list of valid language codes (data-> language_code).
Default Value: en-US
Example: en-US for US English.
country_code
(optional)
US
String
Specifies the country context for filtering and displaying results.
Relevant Endpoint: Use the Get Supported Locations endpoint (api/v1/getLocations) to get a list of valid country codes (data-> country_code).
Default Value: US
Example: US for the United States.
search_type
(optional)
best
Enum
Specifies the type of search strategy to apply when retrieving flight results.

best prioritizes a balanced mix of price, duration, and convenience.

cheap returns the lowest-cost options, possibly with longer layovers or travel time.

5.2
Also please create a zod object

6.
Instead of using @tool-invocation-card.tsx use the @task.tsx component

@https://ai-sdk.dev/elements/components/task  

7.
Extract the tool calls in @plan.ts to a seperate file

8.
Implement a signin page for github social with better auth (@auth.ts and @auth-client.ts) in @signin.tsx 