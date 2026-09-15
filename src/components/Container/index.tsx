import type React from 'react';
import type { PropsWithChildren } from 'react';
import { cn } from '@/lib/utils';

type Props = PropsWithChildren & {
  className?: string;
};

export const Container = ({ children, className }: Props): React.JSX.Element => {
  return (
    <div className={cn('mx-auto w-full max-w-[1440px] px-5 md:px-8 lg:px-[50px]', className)}>
      {children}
    </div>
  );
};

export const GridContainer = ({ children, className }: Props): React.JSX.Element => {
  return (
    <div
      className={cn(
        'grid w-full grid-cols-4 gap-x-4 md:grid-cols-8 md:gap-x-5 lg:grid-cols-12 lg:gap-x-6',
        className
      )}
    >
      {children}
    </div>
  );
};
