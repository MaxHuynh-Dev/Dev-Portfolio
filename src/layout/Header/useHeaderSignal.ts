import { signal } from '@preact/signals-core';

export const isOpenHeader = signal<boolean>(false);

export const openHeader = (): void => {
  isOpenHeader.value = true;
};

export const closeHeader = (): void => {
  isOpenHeader.value = false;
};

export const toggleHeader = (): void => {
  isOpenHeader.value = !isOpenHeader.value;
};
