import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("/planning","routes/planning.tsx"),
  route("/results/:tripId","routes/results.tsx"),
  route("/plan/:agentId","routes/plan.tsx"),
  route("/chat","routes/chat.tsx")
] satisfies RouteConfig;
