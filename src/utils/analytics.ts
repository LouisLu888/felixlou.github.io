// Thin wrapper over public/analytics.js, which owns GA4 + Amplitude setup, event
// naming and global properties for the whole site (React and static pages).
// Event names and properties: analytics/tracking-plan.md.

type Props = Record<string, string | number | boolean>;

declare global {
  interface Window {
    siteAnalytics?: {
      track: (name: string, props?: Props) => void;
      pageView: (path?: string) => void;
      setUser: (props: Props) => void;
    };
  }
}

export function trackPageView(path: string) {
  window.siteAnalytics?.pageView(path);
}

export function track(name: string, props: Props = {}) {
  window.siteAnalytics?.track(name, props);
}
