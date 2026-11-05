type EventName = 'converter_started' | 'conversion_completed';
type Gtag = (...args: unknown[]) => void;
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
    'ga-disable-G-JT1NTG52R1'?: boolean;
  }
}
export const measurementId = 'G-JT1NTG52R1';
let initialized = false;

export function initializeAnalytics(): void {
  if (initialized || typeof window === 'undefined' || window['ga-disable-G-JT1NTG52R1']) return;
  try {
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function (..._args: unknown[]) {
      // Google expects the arguments object in its queue.
      // eslint-disable-next-line prefer-rest-params -- Match the documented Google tag queue format.
      window.dataLayer?.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      // Keep the existing property and automatic pageview, without query data.
      page_location: window.location.origin + window.location.pathname,
    });
    if (!document.querySelector('script[data-notes-analytics]')) {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
      script.dataset.notesAnalytics = 'true';
      document.head.append(script);
    }
    initialized = true;
  } catch {
    // Analytics failures never prevent rendering or conversion.
  }
}

export function trackEvent(name: EventName): void {
  if (!initialized || typeof window === 'undefined' || window['ga-disable-G-JT1NTG52R1']) return;
  if (name !== 'converter_started' && name !== 'conversion_completed') return;
  try {
    window.gtag?.('event', name);
  } catch {
    // Never send musical content, input values or user identifiers.
  }
}
