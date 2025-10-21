import { twMerge } from "tailwind-merge";

type Color = "blue" | "red" | "light-blue";

const ColorMap: Record<Color, string> = {
  blue: "bg-blue-500 text-white",
  red: "bg-red-500 text-white",
  "light-blue": "bg-light-blue-500 text-white",
};

const Button = ({
  children,
  color,
  ...props
}: {
  children: React.ReactNode;
  color: Color;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  const colorClass = ColorMap[color];
  const className = twMerge(
    colorClass,
    "rounded-md px-2 py-1 h-fit w-fit",
    props.className
  );
  return (
    <button {...props} className={className}>
      {children}
    </button>
  );
};

export default Button;
