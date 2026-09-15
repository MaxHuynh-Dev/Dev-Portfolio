import { MonoLabel } from '@Components/editorial/MonoLabel';
import type { MetaColumn } from '@Modules/EditorialHome/constants';
import type React from 'react';
import { cn } from '@/lib/utils';

type Props = {
  columns: MetaColumn[];
  className?: string;
  /** Minimum column width before the grid wraps. */
  minColumn?: string;
};

/** Caption-over-list columns: Practice / Services / Stack / Numbers. */
export const MetaColumns = ({
  columns,
  className,
  minColumn = '9rem'
}: Props): React.JSX.Element => (
  <div
    className={cn('grid gap-4 gap-x-6', className)}
    style={{ gridTemplateColumns: `repeat(auto-fit, minmax(${minColumn}, 1fr))` }}
  >
    {columns.map((column) => (
      <div key={column.label} className="flex flex-col gap-[0.4rem]">
        <MonoLabel dim>{column.label}</MonoLabel>
        {column.items.map((item) => (
          <MonoLabel key={item}>{item}</MonoLabel>
        ))}
      </div>
    ))}
  </div>
);

export default MetaColumns;
