// routes/+types/index.ts

export type LoaderData<T = unknown> = T;
export interface LoaderArgs {
  items: unknown[];
  item?: unknown;
  params?: Record<string, string>;
}

export interface ComponentProps {
  loaderData: LoaderArgs;
  params?: Record<string, string>;
}

export interface ActionArgs {
  request: Request;
  params?: Record<string, string>;
}
export interface Route {
  LoaderArgs: {
    params: Record<string, string>;
  };
  ActionArgs: {
    request: Request;
    params: Record<string, string>;
  };
  ComponentProps: ComponentProps;
  MetaArgs: Record<string, unknown>;
}
