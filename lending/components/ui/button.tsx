import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/lib/utils"

const variants = {
    primary: "bg-slate-900 text-white hover:bg-slate-800 shadow-md",
    gradient: "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-200 hover:shadow-xl hover:shadow-purple-300 hover:opacity-95 hover:-translate-y-0.5 transition-all duration-300 border-none",
    secondary: "bg-white text-slate-900 hover:bg-slate-50 border border-slate-200 shadow-sm",
    ghost: "hover:bg-slate-100 text-slate-600 hover:text-slate-900",
    outline: "border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
}

const sizes = {
    sm: "h-9 px-4 text-sm",
    md: "h-11 px-6 text-base",
    lg: "h-14 px-8 text-lg"
}

export function getButtonClassName(variant: keyof typeof variants = 'primary', size: keyof typeof sizes = 'md', className?: string) {
    return cn(
        "inline-flex items-center justify-center rounded-full font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
    )
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: keyof typeof variants;
    size?: keyof typeof sizes;
    asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button"
        return (
            <Comp
                ref={ref}
                className={getButtonClassName(variant, size, className)}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button }
