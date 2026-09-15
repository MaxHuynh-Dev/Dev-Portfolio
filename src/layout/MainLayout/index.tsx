import GridDebug from '@Components/GridDebug';
import SmoothScroll from '@Components/SmoothScroll';
import Header from '@Layout/Header';
import type React from 'react';
import type { PropsWithChildren } from 'react';

export default function MainLayout({ children }: PropsWithChildren): React.ReactElement {
  return (
    <SmoothScroll>
      <Header />
      {children}
      <GridDebug />
    </SmoothScroll>
  );
}
