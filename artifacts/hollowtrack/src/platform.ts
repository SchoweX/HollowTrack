export interface PlatformDialogs {
  confirm(message: string): boolean;
}

export const browserDialogs: PlatformDialogs = {
  confirm(message) {
    return window.confirm(message);
  },
};
