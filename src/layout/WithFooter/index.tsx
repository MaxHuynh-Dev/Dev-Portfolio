import Footer from '@Layout/Footer';
import type React from 'react';

export default function WithFooter({
  children
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <>
      {children}
      <Footer />
    </>
  );
}
