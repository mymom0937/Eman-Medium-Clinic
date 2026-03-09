export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

class ToastManager {
  private listeners: ((toasts: Toast[]) => void)[] = [];
  private toasts: Toast[] = [];

  subscribe(listener: (toasts: Toast[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(listener => listener([...this.toasts]));
  }

  add(toast: Omit<Toast, 'id'>) {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration || 5000,
    };

    this.toasts.push(newToast);
    this.notify();

    // Auto remove after duration
    setTimeout(() => {
      this.remove(id);
    }, newToast.duration);

    return id;
  }

  remove(id: string) {
    this.toasts = this.toasts.filter(toast => toast.id !== id);
    this.notify();
  }

  clear() {
    this.toasts = [];
    this.notify();
  }

  success(message: string, duration?: number) {
    return this.add({ type: 'success', message, duration });
  }

  error(message: string, duration?: number) {
    return this.add({ type: 'error', message, duration });
  }

  warning(message: string, duration?: number) {
    return this.add({ type: 'warning', message, duration });
  }

  info(message: string, duration?: number) {
    return this.add({ type: 'info', message, duration });
  }
}

export const toastManager = new ToastManager(); 