import { type RouteConfig } from "@react-router/dev/routes";

const routes: RouteConfig = [
  {
    path: "/",
    file: "root.tsx",
    children: [
      {
        path: "mortgage-calculator",
        file: "routes/home.tsx"
      }
    ]
  }
];

export default routes; 