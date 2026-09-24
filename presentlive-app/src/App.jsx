import { BrowserRouter } from 'react-router-dom';
import { ToastProvider } from './context/ToastProvider.jsx';
import { ErrorBoundary } from './components/layout/ErrorBoundary.jsx';
import { AppRoutes } from './routes.jsx';

/**
 * The application root.
 *
 * Three things wrap every screen: an error boundary so a rendering failure
 * shows a recovery page instead of a blank one, the browser router that turns
 * the address bar into navigation without a page load, and the toast provider
 * that supplies the confirmation messages shown after a save or a delete.
 */
export const App = () => (
  <ErrorBoundary>
    <BrowserRouter>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </BrowserRouter>
  </ErrorBoundary>
);
