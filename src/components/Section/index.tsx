import { Container } from '@Components/Container';
import type React from 'react';
import type { PropsWithChildren } from 'react';
import { cn } from '@/lib/utils';

type Props = PropsWithChildren & {
  id?: string;
  className?: string;
  containerClassName?: string;
  as?: React.ElementType;
  noContainer?: boolean;
};

export const Section = ({
  children,
  id,
  className,
  containerClassName,
  as: Tag = 'section',
  noContainer = false
}: Props): React.JSX.Element => {
  return (
    <Tag id={id} className={cn('relative py-16 md:py-24 lg:py-32', className)}>
      {noContainer ? children : <Container className={containerClassName}>{children}</Container>}
    </Tag>
  );
};

export default Section;
