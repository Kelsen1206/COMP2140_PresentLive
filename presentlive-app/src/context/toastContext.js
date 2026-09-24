import { createContext, useContext } from 'react';

/**
 * Context carrying the functions that raise a toast notification.
 *
 * Kept in its own module so that the provider file exports only a component,
 * which is what React Fast Refresh needs to reload reliably.
 */
export const ToastContext = createContext(null);

/**
 * Access the toast functions from anywhere inside the provider.
 *
 * @returns {{notifySuccess: (message: string) => void,
 *            notifyError: (message: string) => void,
 *            notifyInfo: (message: string) => void,
 *            dismiss: (id: number) => void}}
 * @throws {Error} When used outside of a ToastProvider, which is a wiring bug.
 */
export const useToast = () => {
  const value = useContext(ToastContext);
  if (!value) {
    throw new Error('useToast must be used inside a ToastProvider.');
  }
  return value;
};
