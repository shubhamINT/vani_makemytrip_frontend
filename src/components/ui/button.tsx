/* eslint-disable react-refresh/only-export-components */
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 whitespace-nowrap font-semibold transition-all duration-150 disabled:pointer-events-none disabled:opacity-45 [&_svg]:shrink-0 active:scale-[0.97]',
  {
    variants: {
      variant: {
        primary:
          'bg-sky-brand text-white shadow-card hover:bg-[#0b93d1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-brand/50 focus-visible:ring-offset-2',
        coral:
          'bg-coral text-white shadow-card hover:bg-coral-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/50 focus-visible:ring-offset-2',
        outline:
          'border border-line bg-surface text-ink shadow-card hover:border-faint hover:bg-paper-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-faint/50 focus-visible:ring-offset-2',
        ghost:
          'text-muted hover:bg-paper-2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-paper-2 focus-visible:ring-offset-2',
        link:
          'text-sky-brand underline-offset-4 hover:underline hover:text-[#0b93d1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-brand/50 focus-visible:ring-offset-2',
        danger:
          'bg-danger/10 text-danger hover:bg-danger hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/50 focus-visible:ring-offset-2',
      },
      size: {
        sm: 'h-8 rounded-lg px-3 text-[13px]',
        md: 'h-9.5 rounded-xl px-4 text-sm',
        lg: 'h-11 rounded-xl px-5 text-[15px]',
        icon: 'size-9 rounded-full',
        'icon-sm': 'size-8 rounded-full',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'button';
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export { Button, buttonVariants };
