import * as React from 'react';

import { cn } from '~/lib/utils';

type TextareaProps = React.ComponentProps<'textarea'> & {
  autoResize?: boolean;
};

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ autoResize = false, className, onInput, ...props }, ref) => {
    const internalRef = React.useRef<HTMLTextAreaElement | null>(null);

    const setRefs = (node: HTMLTextAreaElement | null) => {
      internalRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    };

    const resize = React.useCallback(() => {
      const textarea = internalRef.current;
      if (!autoResize || !textarea) return;
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }, [autoResize]);

    React.useLayoutEffect(() => {
      resize();
    }, [props.defaultValue, props.value, resize]);

    const handleInput = (event: React.InputEvent<HTMLTextAreaElement>) => {
      resize();
      onInput?.(event);
    };

  return (
    <textarea
      ref={setRefs}
      data-slot="textarea"
      className={cn(
        'placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input min-h-28 w-full min-w-0 rounded-md border bg-transparent px-2 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'focus-visible:border-ring focus-visible:ring-ring/20 focus-visible:ring-[1px]',
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        autoResize ? 'resize-none overflow-hidden' : 'resize-y',
        className
      )}
      onInput={handleInput}
      {...props}
    />
  );
  }
);

Textarea.displayName = 'Textarea';

export { Textarea };
