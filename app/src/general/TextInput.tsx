import { forwardRef } from "react";
import { twMerge } from "tailwind-merge";

const TextInput = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ ...props }, ref) => {
  const className = twMerge(
    "border-2 border-gray-300 rounded-md p-2",
    props.className
  );
  return <input {...props} className={className} ref={ref} />;
});

export default TextInput;
