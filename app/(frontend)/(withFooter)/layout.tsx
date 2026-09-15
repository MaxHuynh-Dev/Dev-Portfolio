import WithFooter from '@Layout/WithFooter';
import type React from 'react';
import type { PropsWithChildren } from 'react';

type Props = PropsWithChildren;

export default function Layout({ children }: Props): React.ReactElement {
  return <WithFooter>{children}</WithFooter>;
}
