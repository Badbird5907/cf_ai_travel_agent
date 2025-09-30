import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("/plan/:agentId","routes/plan.tsx"),
] satisfies RouteConfig;
