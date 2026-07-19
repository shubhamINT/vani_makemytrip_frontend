import * as React from 'react';
import { cn } from '@/lib/utils';

function Card({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('rounded-card-lg border border-line bg-surface shadow-card', className)}
      {...props}
    />
  );
}

export { Card };
