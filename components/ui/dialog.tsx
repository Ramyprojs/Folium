"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type DialogContextValue = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const DialogContext = React.createContext<DialogContextValue | null>(null);

function useDialogContext(): DialogContextValue {
  const context = React.useContext(DialogContext);
  if (!context) {
    throw new Error("Dialog components must be used within <Dialog>");
  }
  return context;
}

export function Dialog({
  open,
  onOpenChange,
  children,
}: React.PropsWithChildren<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
}>): JSX.Element {
  return <DialogContext.Provider value={{ open, onOpenChange }}>{children}</DialogContext.Provider>;
}

export const DialogTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(function DialogTrigger(props, ref) {
  const { onOpenChange } = useDialogContext();

  return (
    <button
      {...props}
      ref={ref}
      type={props.type || "button"}
      onClick={(event) => {
        props.onClick?.(event);
        if (!event.defaultPrevented) {
          onOpenChange(true);
        }
      }}
    />
  );
});

export const DialogClose = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(function DialogClose(props, ref) {
  const { onOpenChange } = useDialogContext();

  return (
    <button
      {...props}
      ref={ref}
      type={props.type || "button"}
      onClick={(event) => {
        props.onClick?.(event);
        if (!event.defaultPrevented) {
          onOpenChange(false);
        }
      }}
    />
  );
});

export const DialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(function DialogTitle({ className, ...props }, ref) {
  return <h2 ref={ref} className={cn(className)} {...props} />;
});

export const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(function DialogDescription({ className, ...props }, ref) {
  return <p ref={ref} className={cn(className)} {...props} />;
});

export const DialogContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(function DialogContent({ className, children, ...props }, ref) {
  const { open, onOpenChange } = useDialogContext();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onOpenChange]);

  if (!mounted || !open) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
      />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative z-10 w-full max-w-lg rounded-lg border bg-background p-6 shadow-xl",
          className,
        )}
        {...props}
      >
        {children}
        <DialogClose
          aria-label="Close dialog"
          className="absolute right-4 top-4 opacity-70 transition-opacity hover:opacity-100"
        >
          <X className="h-4 w-4" />
        </DialogClose>
      </div>
    </div>,
    document.body,
  );
});
