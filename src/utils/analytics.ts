import { AMPLITUDE_API_KEY, GA_MEASUREMENT_ID } from '../config/analytics';

// Sends every page view and event to both GA4 and Amplitude. Both SDKs load
// asynchronously after first paint, so a blocked or slow tracker (Google is
// blocked in mainland China) never delays the page. Events fired before an
// SDK is ready are queued by gtag's dataLayer and by the amplitude buffer.

type Props = Record<string, string | number | boolean>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

let started = false;
let amplitudeReady: Promise<typeof import('@amplitude/analytics-browser') | null> = Promise.resolve(null);

export function initAnalytics() {
  if (started || typeof window === 'undefined') return;
  started = true;

  if (GA_MEASUREMENT_ID) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      // gtag.js reads the raw arguments object, not an array.
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments);
    };
    window.gtag('js', new Date());
    // Page views are sent manually on route change (SPA).
    window.gtag('config', GA_MEASUREMENT_ID, { send_page_view: false });
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);
  }

  if (AMPLITUDE_API_KEY) {
    amplitudeReady = import('@amplitude/analytics-browser')
      .then((amplitude) => {
        amplitude.init(AMPLITUDE_API_KEY, {
          autocapture: { pageViews: false, elementInteractions: false },
        });
        return amplitude;
      })
      .catch(() => null);
  }
}

export function trackPageView(path: string) {
  const props = { page_path: path, page_title: document.title, page_location: window.location.href };
  window.gtag?.('event', 'page_view', props);
  amplitudeReady.then((amplitude) => amplitude?.track('Page Viewed', props));
}

export function track(event: string, props: Props = {}) {
  window.gtag?.('event', event, props);
  amplitudeReady.then((amplitude) => amplitude?.track(event, props));
}
