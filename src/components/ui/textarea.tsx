import { ComponentProps } from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input placeholder:text-muted-foreground focus-visible:border-accent focus-visible:ring-accent/30 aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-card text-foreground flex field-sizing-content min-h-20 w-full rounded-lg border-2 px-4 py-3 text-base shadow-sm transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
