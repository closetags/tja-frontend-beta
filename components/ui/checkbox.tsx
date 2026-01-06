"use client"

import * as React from "react"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

type CheckboxProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type" | "onChange"
> & {
  onCheckedChange?: (checked: boolean) => void
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, onCheckedChange, checked, defaultChecked, disabled, ...props }, ref) => {
    const { onChange, ...rest } = props
    const isControlled = checked !== undefined
    const [uncontrolledChecked, setUncontrolledChecked] = React.useState(
      Boolean(defaultChecked)
    )
    const currentChecked = isControlled ? checked : uncontrolledChecked

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!isControlled) {
        setUncontrolledChecked(event.target.checked)
      }

      onCheckedChange?.(event.target.checked)
      onChange?.(event)
    }

    return (
      <span className="relative inline-flex items-center justify-center">
        <input
          type="checkbox"
          ref={ref}
          role="checkbox"
          aria-checked={currentChecked}
          data-state={currentChecked ? "checked" : "unchecked"}
          className={cn(
            "peer h-5 w-5 shrink-0 appearance-none rounded border-2 border-gray-300 bg-white text-primary ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            "data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground",
            className
          )}
          checked={isControlled ? checked : undefined}
          defaultChecked={!isControlled ? defaultChecked : undefined}
          onChange={handleChange}
          disabled={disabled}
          {...rest}
        />
        <Check
          className={cn(
            "pointer-events-none absolute h-4 w-4 text-white opacity-0 transition-opacity",
            currentChecked && "opacity-100"
          )}
        />
      </span>
    )
  }
)

Checkbox.displayName = "Checkbox"

export { Checkbox }
