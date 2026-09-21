'use client';

import { Container, GridContainer } from '@Components/Container';
import type React from 'react';
import { Activity, useCallback, useEffect, useState } from 'react';

const GridColumn = (): React.ReactElement => (
  <div className="col-span-1">
    <div className="relative h-screen bg-[#ff6b4c]/30 before:absolute before:left-0 before:h-full before:w-px before:bg-[#ff6b4c]/30 before:content-[''] after:absolute after:right-0 after:h-full after:w-px after:bg-[#ff6b4c]/30 after:content-['']" />
  </div>
);

export default function GridDebug(): React.ReactElement {
  const [isGrid, setIsGrid] = useState<boolean>(false);

  useEffect(() => {
    const storedValue = localStorage.getItem('isGrid');
    if (storedValue === 'true') {
      setIsGrid(true);
    }
  }, []);

  const handleKeyDown: (ev: KeyboardEvent) => void = useCallback(
    (ev: KeyboardEvent) => {
      const isShift = ev.shiftKey;
      const key = ev.key.toLowerCase();
      if (isShift && key === 'g') {
        const nextValue = !isGrid;
        localStorage.setItem('isGrid', String(nextValue));
        setIsGrid(nextValue);
      }
    },
    [isGrid]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return (): void => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <Activity mode={isGrid ? 'visible' : 'hidden'} name="Grid Debug">
      <div className="pointer-events-none fixed top-0 left-1/2 z-[99999999999] h-full w-full -translate-x-1/2">
        <Container>
          <GridContainer>
            {Array.from({ length: 12 }).map((_, index) => (
              <GridColumn key={`grid-column-${index.toString()}`} />
            ))}
          </GridContainer>
        </Container>
      </div>
    </Activity>
  );
}
