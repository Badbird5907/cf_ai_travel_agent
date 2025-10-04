import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("/plan/:agentId","routes/plan.tsx"),
  route("/trips", "routes/agents.tsx"),

  route("/auth/signin", "routes/auth/signin.tsx"),
] satisfies RouteConfig;
