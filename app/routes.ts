import { type RouteConfig, index } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  {
    path: "*",
    file: "routes/home.tsx",
    id: "catch-all"
  }
] satisfies RouteConfig; 