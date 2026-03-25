import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  route('', 'routes/+layout.tsx', [
    index('routes/home.tsx'),
    route('items/:itemId', 'routes/items/$itemId.tsx'),
    route('items/all', 'routes/items/all.tsx'),
  ]),
] satisfies RouteConfig;
