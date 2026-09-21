import type React from 'react';

export default function WithoutFooter({
  children
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return <>{children}</>;
}
