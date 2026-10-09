import React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  const variantStyles = {
    primary: 'bg-blue-600 hover:bg-blue-500 text-white border-transparent shadow-lg shadow-blue-500/20',
    secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700',
    outline: 'bg-transparent border border-slate-700 hover:bg-slate-800 text-slate-300',
    ghost: 'bg-transparent hover:bg-slate-800/60 text-slate-400 hover:text-slate-200 border-transparent',
    danger: 'bg-rose-600 hover:bg-rose-500 text-white border-transparent shadow-lg shadow-rose-500/20'
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs rounded-md',
    md: 'px-4 py-2 text-sm rounded-lg',
    lg: 'px-6 py-3 text-base rounded-lg font-medium'
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-medium border transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
