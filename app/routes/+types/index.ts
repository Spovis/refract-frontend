// routes/+types/index.ts


export type LoaderData<T = any> = T;
export interface LoaderArgs {
  items: any[]; // replace `any` with your actual item type — required
  item?: any; // optional single item for item routes
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
  MetaArgs: Record<string, any>;
}

