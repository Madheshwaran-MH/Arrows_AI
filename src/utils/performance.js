/**
 * Performance monitoring utilities
 */

/**
 * Measure page load metrics
 * Reports key performance indicators like FCP, LCP, TTI
 */
export const measurePageLoad = () => {
  if (typeof window === 'undefined' || !window.performance) {
    return;
  }

  window.addEventListener('load', () => {
    const navTiming = window.performance.getEntriesByType('navigation')[0];

    // Calculate key metrics
    const pageLoadTime = navTiming.loadEventEnd - navTiming.fetchStart;
    const connectTime = navTiming.responseEnd - navTiming.requestStart;
    const domContentLoadedTime = navTiming.domContentLoadedEventEnd - navTiming.fetchStart;

    // Log metrics
    console.log('Performance Metrics:', {
      pageLoadTime: `${pageLoadTime}ms`,
      connectTime: `${connectTime}ms`,
      domContentLoadedTime: `${domContentLoadedTime}ms`,
    });

    // Log Web Vitals if available
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            console.log(`${entry.name}: ${entry.duration}ms`);
          });
        });

        observer.observe({
          entryTypes: ['largest-contentful-paint', 'first-input', 'cumulative-layout-shift'],
        });
      } catch {
        console.debug('PerformanceObserver not fully supported');
      }
    }
  });
};

/**
 * Mark and measure custom performance metrics
 * @param {string} label - Label for the mark
 */
export const markPerformance = (label) => {
  if (typeof window !== 'undefined' && window.performance && window.performance.mark) {
    window.performance.mark(label);
  }
};

/**
 * Measure time between marks
 * @param {string} name - Measure name
 * @param {string} startMark - Start mark label
 * @param {string} endMark - End mark label
 */
export const measurePerformance = (name, startMark, endMark) => {
  if (typeof window !== 'undefined' && window.performance && window.performance.measure) {
    try {
      window.performance.measure(name, startMark, endMark);
      const measures = window.performance.getEntriesByName(name);
      if (measures.length > 0) {
        console.log(`${name}: ${measures[0].duration}ms`);
      }
    } catch {
      console.debug('Performance measurement not available');
    }
  }
};

/**
 * Initialize performance monitoring
 */
export const initPerformanceMonitoring = () => {
  if (typeof window !== 'undefined') {
    // Start mark for app initialization
    markPerformance('app-init-start');

    window.addEventListener('load', () => {
      markPerformance('app-init-end');
      measurePerformance('app-init', 'app-init-start', 'app-init-end');
      measurePageLoad();
    });
  }
};
