export interface AppPlatform {
  setTitle(title: string): void;
  schedule(callback: () => void, delayMs: number): void;
}

export const browserAppPlatform: AppPlatform = {
  setTitle(title) {
    document.title = title;
  },

  schedule(callback, delayMs) {
    globalThis.setTimeout(callback, delayMs);
  },
};
