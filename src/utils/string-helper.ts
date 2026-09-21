class StringHelper {
  /**
   * Strip Vietnamese diacritics while preserving the original letter case.
   * `đ`/`Đ` are separate letters rather than accented `d`, so Unicode
   * decomposition does not cover them and they are mapped explicitly.
   */
  removeAccents(str: string): string {
    return str.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
  }

  compareString = (a: string, b: string): number => {
    return a.localeCompare(b);
  };

  spliceSlice(str: string, index: number, count: number, add: string): string {
    // We cannot pass negative indexes directly to the 2nd slicing operation.
    let safeIndex: number = index;
    if (index < 0) {
      safeIndex = str.length + index;
      if (safeIndex < 0) {
        safeIndex = 0;
      }
    }

    return `${str.slice(0, safeIndex)}${add || ''}${str.slice(safeIndex + count)}`;
  }
}

export const stringHelper = new StringHelper();
