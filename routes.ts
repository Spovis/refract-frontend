



import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("app/routes/home.tsx"),
  route("items/:itemId", "app/routes/items/$itemId.tsx"),
] satisfies RouteConfig;
