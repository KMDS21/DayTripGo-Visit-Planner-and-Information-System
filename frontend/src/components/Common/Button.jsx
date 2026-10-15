// Button — thin DayTripGO wrapper around the shadcn/ui Button (keeps the plan's
// Common/ component set while using the installed design system).

import { Button as ShadcnButton } from '@/components/ui/button';

const variants = {
  primary: 'bg-brand text-white hover:bg-brand-dark',
  outline: 'border border-brand/40 text-brand bg-transparent hover:bg-brand-light/60',
  ghost: 'bg-transparent text-muted-foreground hover:text-foreground',
  danger: 'bg-red-600 text-white hover:bg-red-700',
};

const sizes = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-9 px-4 text-sm',
  lg: 'h-11 px-6 text-base',
};

export default function Button({ variant = 'primary', size = 'md', className = '', ...props }) {
  return (
    <ShadcnButton
      className={`${variants[variant] || variants.primary} ${sizes[size] || sizes.md} rounded-full font-semibold transition-colors ${className}`}
      {...props}
    />
  );
}
