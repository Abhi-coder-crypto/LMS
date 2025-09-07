import React from 'react';
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max: number;
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

export default function ProgressBar({ 
  value, 
  max, 
  className,
  showText = false,
  size = 'md',
  variant = 'default'
}: ProgressBarProps) {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };
  
  const variantClasses = {
    default: 'bg-primary',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500'
  };

  return (
    <div className={cn("space-y-1", className)} data-testid="progress-container">
      {showText && (
        <div className="flex justify-between items-center text-sm">
          <span>Progress</span>
          <span data-testid="progress-text">{value}/{max}</span>
        </div>
      )}
      <div className={cn("w-full bg-muted rounded-full", sizeClasses[size])}>
        <div 
          className={cn(
            "rounded-full transition-all duration-300 ease-in-out",
            sizeClasses[size],
            variantClasses[variant]
          )}
          style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
          data-testid="progress-bar"
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  );
}
