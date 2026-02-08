import * as React from "react";
import { twMerge } from "tailwind-merge";
import { Button as ShadButton } from "~/components/ui/button";

type ShadProps = React.ComponentProps<typeof ShadButton>;

const Button = ({ className, variant, ...props }: ShadProps) => {
  const merged = twMerge("bg-black text-white hover:bg-black/90", className);
  return <ShadButton variant={variant ?? "default"} className={merged} {...props} />;
};

export default Button;
