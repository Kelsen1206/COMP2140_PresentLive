import { Component } from 'react';

/**
 * Catches a rendering error anywhere below it and shows a recovery screen
 * instead of a blank page.
 *
 * This is the one component in the app written as a class: React provides no
 * hook equivalent of componentDidCatch, so an error boundary has to be a class
 * component. Everything else in the codebase is a function component.
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  /**
   * Record the error so the next render shows the fallback.
   *
   * @param {Error} error
   * @returns {{error: Error}}
   */
  static getDerivedStateFromError(error) {
    return { error };
  }

  /**
   * Report the failure so it is visible while developing.
   *
   * @param {Error} error
   * @param {{componentStack: string}} info
   */
  componentDidCatch(error, info) {
    console.error('PresentLive hit an unexpected rendering error.', error, info);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="boundary" role="alert">
        <h1 className="boundary__title">Something went wrong</h1>
        <p className="boundary__message">
          The page could not be displayed. Reloading usually clears it; if it keeps happening, the
          details below will say why.
        </p>
        <pre className="boundary__detail">{error.message}</pre>
        <button type="button" className="button button--primary button--md" onClick={() => window.location.reload()}>
          <span>Reload the page</span>
        </button>
      </div>
    );
  }
}
