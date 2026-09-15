import { motion, type Variants } from 'framer-motion';
import type React from 'react';

export function SplitText({
  children,
  ...props
}: {
  children: string;
  props?: Variants;
}): React.ReactElement[] {
  const words = children.split(' ');
  return words.map((word, i) => (
    <div
      key={`${children}-${i.toString()}`}
      style={{ display: 'inline-block', overflow: 'hidden' }}
    >
      <motion.div
        {...props}
        style={{ display: 'inline-block', willChange: 'transform' }}
        custom={i}
      >
        {word + (i !== words.length - 1 ? '\u00A0' : '')}
      </motion.div>
    </div>
  ));
}
