import { ComponentProps } from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

  {

          "bg-primary text-
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-card dark:border-border dark:hover:bg-muted dark:text-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
    },
      size: {

        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
  ...pro
    },
    defaultVariants: {
      variant: "default",

    },
   
)

function Button({

  variant,

  asChild = false,

}: ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean

  const Comp = asChild ? Slot : "button"

  return (

      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}

  )


export { Button, buttonVariants }
