// https://rapidapi.com/DataCrawler/api/google-flights2/playground/apiendpoint_ce4a44ea-f781-4baf-883f-ea1b7da10907

export interface GoogleFlightsResponse {
  status: boolean;
  message: string;
  timestamp: number;
  data: {
    itineraries: {
      topFlights: Flight[];
      otherFlights: Flight[];
    };
    otherFlights: Flight[];
  };
}

export interface Flight {
  departure_time: string;
  arrival_time: string;
  duration: Duration;
  flights: FlightDetail[];
  layovers: Layover[] | null;
  bags: Bags;
  carbon_emissions: CarbonEmissions;
  price: number;
  stops: number;
  airline_logo: string;
  next_token: string;
}

export interface Duration {
  raw: number;
  text: string;
}

export interface FlightDetail {
  departure_airport: Airport;
  arrival_airport: Airport;
  duration_label: string;
  duration: number;
  airline: string;
  airline_logo: string;
  flight_number: string;
  aircraft: string;
  seat: string;
  legroom: string;
  extensions: string[];
}

export interface Airport {
  airport_name: string;
  airport_code: string;
  time: string;
}

export interface Layover {
  airport_code: string;
  airport_name: string;
  duration_label: string;
  duration: number;
  city: string;
}

export interface Bags {
  carry_on: number | null;
  checked: number | null;
}

export interface CarbonEmissions {
  difference_percent: number;
  CO2e: number;
  typical_for_this_route: number;
  higher: number;
}

export interface GoogleFlightsQueryParams {
  departure_id: string; // IATA code of departure airport
  arrival_id: string; // IATA code of arrival airport
  outbound_date: string; // YYYY-MM-DD format
  return_date?: string; // YYYY-MM-DD format (optional for round-trip)
  travel_class?: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';
  adults?: string; // Number of adult passengers (default: "1")
  children?: string; // Number of child passengers (default: "0")
  infant_on_lap?: string; // Infants without seat (default: "0")
  infant_in_seat?: string; // Infants with seat (default: "0")
  show_hidden?: string; // "1" for YES, "0" for NO (default: "0")
  currency?: string; // Currency code (default: "USD")
  language_code?: string; // Language code (default: "en-US")
  country_code?: string; // Country code (default: "US")
  search_type?: 'best' | 'cheap'; // Search strategy
}
