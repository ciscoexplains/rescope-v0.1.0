"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface SwitchProps
    extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
    checked?: boolean
    onCheckedChange?: (checked: boolean) => void
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
    ({ className, checked, onCheckedChange, ...props }, ref) => {
        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            onCheckedChange?.(e.target.checked)
        }

        return (
            <label className="relative inline-flex items-center cursor-pointer">
                <input
                    type="checkbox"
                    className="sr-only peer"
                    ref={ref}
                    checked={checked}
                    onChange={handleChange}
                    {...props}
                />
                <div
                    className={cn(
                        "w-11 h-6 bg-muted rounded-full peer peer-focus:ring-2 peer-focus:ring-primary/20 transition-colors",
                        "peer-checked:bg-primary",
                        "after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-background after:rounded-full after:h-5 after:w-5 after:transition-transform",
                        "peer-checked:after:translate-x-5",
                        className
                    )}
                />
            </label>
        )
    }
)
Switch.displayName = "Switch"

export { Switch }
