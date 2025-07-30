'use client';

import * as React from "react";
import { Button, ButtonProps } from "./button";

interface LoadingButtonProps extends ButtonProps {
  loading?: boolean;
  loadingText?: string;
  preventDoubleClick?: boolean;
}

export const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ loading = false, loadingText = "Loading...", preventDoubleClick = true, onClick, children, disabled, ...props }, ref) => {
    const [isClicked, setIsClicked] = React.useState(false);

    const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
      if (loading || disabled || (preventDoubleClick && isClicked)) {
        e.preventDefault();
        return;
      }

      if (preventDoubleClick) {
        setIsClicked(true);
      }

      try {
        if (onClick) {
          await onClick(e);
        }
      } finally {
        if (preventDoubleClick) {
          // Reset after a short delay to prevent rapid clicking
          setTimeout(() => setIsClicked(false), 1000);
        }
      }
    };

    const isButtonLoading = loading || (preventDoubleClick && isClicked);

    return (
      <Button
        ref={ref}
        disabled={disabled || isButtonLoading}
        onClick={handleClick}
        {...props}
      >
        {isButtonLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {loadingText}
          </span>
        ) : (
          children
        )}
      </Button>
    );
  }
);

LoadingButton.displayName = "LoadingButton";
