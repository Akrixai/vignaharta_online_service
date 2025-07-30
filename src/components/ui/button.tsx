import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  loading?: boolean
  loadingText?: string
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', loading = false, loadingText, children, disabled, onClick, ...props }, ref) => {
    const [isLoading, setIsLoading] = React.useState(false);

    const baseClasses = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"

    const variants = {
      default: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
      destructive: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
      outline: "border border-red-600 text-red-600 bg-background hover:bg-red-50 hover:text-red-700",
      secondary: "bg-red-100 text-red-600 hover:bg-red-200",
      ghost: "text-red-600 hover:bg-red-50 hover:text-red-700",
      link: "text-red-600 underline-offset-4 hover:underline hover:text-red-700",
    }

    const sizes = {
      default: "h-10 px-4 py-2",
      sm: "h-9 rounded-md px-3",
      lg: "h-11 rounded-md px-8",
      icon: "h-10 w-10",
    }

    const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
      if (loading || isLoading || disabled) return;

      if (onClick) {
        setIsLoading(true);
        try {
          await onClick(e);
        } finally {
          setIsLoading(false);
        }
      }
    };

    const isButtonLoading = loading || isLoading;

    return (
      <button
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        disabled={disabled || isButtonLoading}
        onClick={handleClick}
        {...props}
      >
        {isButtonLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {loadingText || 'Loading...'}
          </>
        ) : (
          children
        )}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button }
