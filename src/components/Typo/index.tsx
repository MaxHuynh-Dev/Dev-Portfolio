import { cva, type VariantProps } from 'class-variance-authority';
import type React from 'react';

const textVariants = cva('font-normal leading-normal', {
  variants: {
    size: {
      12: 'text-[12px]',
      14: 'text-[14px]',
      16: 'text-[14px] lg:text-[16px]',
      18: 'text-[18px]',
      20: 'text-[16px] lg:text-[20px]',
      24: 'text-[18px] lg:text-[24px]',
      48: 'text-[26px] leading-[1.2] lg:text-[48px] lg:leading-[124%]',
      64: 'text-[28px] leading-[1.2] lg:text-[64px]',
      92: 'text-[42px] leading-[90%] lg:text-[92px] lg:leading-[108%]'
    },

    weight: {
      thin: 'font-thin',
      extralight: 'font-extralight',
      light: 'font-light',
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
      extrabold: 'font-extrabold'
    },
    transform: {
      uppercase: 'uppercase',
      lowercase: 'lowercase',
      capitalize: 'capitalize'
    },
    style: {
      italic: 'italic',
      normal: 'not-italic'
    },
    font: {
      poppins: 'font-[family-name:var(--font-poppins)]'
    },
    align: {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right'
    },

    color: {
      white: 'text-[var(--color-white)]',
      black: 'text-[var(--color-black)]'
    }
  },
  defaultVariants: {
    size: 16,
    weight: 'normal',
    color: 'black',
    font: 'poppins'
  }
});

type TypoTag = 'p' | 'span' | 'div' | 'label' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

type TypoOwnProps = VariantProps<typeof textVariants> &
  Omit<React.HTMLAttributes<HTMLElement>, keyof VariantProps<typeof textVariants> | 'className'> & {
    Comp?: TypoTag;
    size?: number;
    weight?:
      | 'thin'
      | 'extralight'
      | 'light'
      | 'normal'
      | 'medium'
      | 'semibold'
      | 'bold'
      | 'extrabold';
    transform?: 'uppercase' | 'lowercase' | 'capitalize';
    font?: 'poppins';
    style?: 'italic' | 'normal';
    align?: 'left' | 'center' | 'right';
    color?: 'white' | 'black';
    className?: string;
    children: React.ReactNode;
  };

const Text = ({ ...props }: TypoOwnProps): React.JSX.Element => {
  const {
    Comp = 'p',
    className,
    children,
    size,
    weight,
    style,
    transform,
    font,
    color,
    ...restProps
  } = props;

  const classes: string = textVariants({
    size,
    weight,
    style,
    transform,
    font,
    color,
    className
  });

  return (
    <Comp className={classes} {...restProps}>
      {children}
    </Comp>
  );
};

export default Text;
