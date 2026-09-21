import SvgInsert from '@Components/SvgInsert';
import Text from '@Components/Typo';
import type React from 'react';
import { cn } from '@/lib/utils';

interface TPrimaryButton {
  color?: 'dark' | 'white';
  variant?: 'solid' | 'outline';
  weight?: 'light' | 'regular' | 'bold';
  transform?: 'uppercase' | 'lowercase' | 'capitalize';
  text?: string;
  className?: string;
  onClick?: () => void;
}

export default function PrimaryButton({ ...props }: TPrimaryButton): React.JSX.Element {
  const { text = '', className, color = 'dark', onClick } = props;

  const buttonColorClass = color === 'white' ? 'text-white' : 'text-[var(--vani)]';

  return (
    <button
      type="button"
      className={cn(
        'flex cursor-pointer items-center gap-2.5 bg-transparent',
        buttonColorClass,
        className
      )}
      onClick={onClick}
    >
      <div className="border-current border-b-2 pb-[7px]">
        <Text Comp={'label'} size={20} color="black" className="cursor-pointer">
          {text}
        </Text>
      </div>

      <div
        className={cn(
          'flex h-[50px] w-[50px] items-center justify-center rounded-full',
          buttonColorClass
        )}
      >
        <SvgInsert src="/icons/arrow-btn.svg" width={17} height={17} />
      </div>
    </button>
  );
}
