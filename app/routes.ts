import { type RouteConfig } from "@react-router/dev/routes";

const routes: RouteConfig[] = [
  {
    path: "/",
    file: "root.tsx",
    children: [
      {
        index: true,
        file: "routes/home.tsx",
        id: "home"
      }
    ]
  }
];

export default routes;