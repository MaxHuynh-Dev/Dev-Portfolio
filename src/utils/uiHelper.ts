import { APP_ENV } from "@/constants/envs";

class UiHelper {
  shuffle(array: (string | number | HTMLElement)[]): void {
    let currentIndex = array.length;

    while (currentIndex !== 0) {
      const randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;

      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex],
        array[currentIndex],
      ];
    }
  }

  pageScrollTop(): number {
    if (typeof window === "undefined") return 0;
    return window.scrollY || document.documentElement.scrollTop || 0;
  }

  debounce<TArgs extends unknown[]>(
    func: (...args: TArgs) => unknown,
    delay: number,
  ): ((...args: TArgs) => void) & { cancel: () => void } {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const debounced = (...args: TArgs): void => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        timeoutId = null;
        func(...args);
      }, delay);
    };

    debounced.cancel = (): void => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = null;
    };

    return debounced;
  }

  isProduction(): boolean {
    return APP_ENV === "production";
  }

  isDevelopment(): boolean {
    return APP_ENV === "development";
  }

  isClient(): boolean {
    return typeof window !== "undefined";
  }

  isMobile(): boolean {
    if (!this.isClient()) return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      window.navigator.userAgent,
    );
  }
}

export const uiHelper = new UiHelper();
