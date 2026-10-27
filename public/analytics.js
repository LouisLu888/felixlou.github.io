/*
 * Site analytics for jiabinlu.com: GA4 + Amplitude, one implementation for the
 * React app and every static page (AI 实干派, decks, product pages).
 * Event names and properties follow analytics/tracking-plan.md.
 *
 * Load order on a page:
 *   <script src="/vendor/amplitude-min.js" defer></script>
 *   <script src="/analytics.js" defer></script>
 * Static pages get an automatic Page Viewed; the React app sets
 * <html data-spa> and calls siteAnalytics.pageView() on route change.
 *
 * Declarative tracking for static HTML: any element with
 *   data-track-event="CTA Clicked" data-track-cta_id="podcast"
 * sends that event on click, with every data-track-* attribute as a property.
 */
(function () {
  var GA_ID = 'G-SNN7DGK4GT';
  var AMPLITUDE_KEY = '0489ab47ac928c3fe4f2fba2f46689af';

  // GA4 recommended events sent alongside our own names, so GA's built-in reports pick them up.
  var GA_RECOMMENDED = {
    'Contact Initiated': 'generate_lead',
    'Newsletter Signup Submitted': 'sign_up',
    'Product Download Clicked': 'file_download',
  };

  function pageType(path) {
    var p = (path || location.pathname).replace(/\/+$/, '') || '/';
    if (p === '/') return 'home';
    if (p === '/blog') return 'blog_list';
    if (p.indexOf('/blog/') === 0) return 'blog_post';
    if (p === '/books') return 'books';
    if (p === '/services') return 'services';
    if (p === '/products') return 'products';
    if (p.indexOf('/products/') === 0) return 'product_landing';
    if (p === '/ai-practice') return 'ai_practice_home';
    if (p.indexOf('/ai-practice/d/') === 0) return 'ai_practice_digest';
    if (p.indexOf('/ai-practice/i/') === 0) return 'ai_practice_item';
    if (p.indexOf('/ai-practice/c') === 0) return 'ai_practice_category';
    if (p.indexOf('/ai-practice/subscribe') === 0) return 'ai_practice_subscribe';
    if (p.indexOf('/decks') === 0) return 'deck';
    return 'other';
  }

  // The page's own language. The React app keeps <html lang> in sync with its 中文/EN toggle.
  function language() {
    return (document.documentElement.lang || 'zh').slice(0, 2) === 'en' ? 'en' : 'zh';
  }

  function snake(name) {
    return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  }

  // --- GA4 ---
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () {
    // gtag.js reads the raw arguments object, not an array.
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA_ID, { send_page_view: false });
  var ga = document.createElement('script');
  ga.async = true;
  ga.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  document.head.appendChild(ga);

  // --- Amplitude (self-hosted SDK: no third-party CDN, reachable from mainland China) ---
  var amp = window.amplitude;
  if (amp && amp.init) {
    amp.init(AMPLITUDE_KEY, {
      autocapture: {
        attribution: true,
        sessions: true,
        pageViews: false, // sent as Page Viewed with page_type instead
        formInteractions: true,
        fileDownloads: true,
        elementInteractions: true,
      },
    });
    // The React app sets the language user property itself once its language is known.
    if (!document.documentElement.hasAttribute('data-spa')) {
      var who = new amp.Identify();
      who.set('language', language());
      amp.identify(who);
    }
  }

  function withGlobals(props) {
    var out = { page_type: pageType(), language: language() };
    for (var k in props || {}) out[k] = props[k];
    return out;
  }

  function track(name, props) {
    var p = withGlobals(props);
    window.gtag('event', snake(name), p);
    if (GA_RECOMMENDED[name] && p.result !== 'failed') window.gtag('event', GA_RECOMMENDED[name], p);
    if (amp && amp.track) amp.track(name, p);
    if (name === 'Contact Initiated' && p.result !== 'failed') setUser({ has_contacted: true });
  }

  function pageView(path) {
    var p = path || location.pathname;
    var props = withGlobals({ page_path: p, page_title: document.title, page_location: location.href });
    props.page_type = pageType(p);
    window.gtag('event', 'page_view', props);
    if (amp && amp.track) amp.track('Page Viewed', props);
  }

  function setUser(props) {
    window.gtag('set', 'user_properties', props);
    if (amp && amp.Identify) {
      var id = new amp.Identify();
      for (var k in props) id.set(k, props[k]);
      amp.identify(id);
    }
  }

  window.siteAnalytics = { track: track, pageView: pageView, setUser: setUser, pageType: pageType };

  // Declarative click tracking for static pages.
  document.addEventListener(
    'click',
    function (e) {
      var el = e.target && e.target.closest ? e.target.closest('[data-track-event]') : null;
      if (!el) return;
      var props = {};
      for (var i = 0; i < el.attributes.length; i++) {
        var a = el.attributes[i];
        if (a.name.indexOf('data-track-') === 0 && a.name !== 'data-track-event') props[a.name.slice(11)] = a.value;
      }
      track(el.getAttribute('data-track-event'), props);
    },
    true,
  );

  // Buttondown forms anywhere on the site. The form posts away, so this records the submit, not confirmation.
  document.addEventListener(
    'submit',
    function (e) {
      var form = e.target;
      if (!form || !form.action || form.action.indexOf('buttondown.com') === -1) return;
      track('Newsletter Signup Submitted', {
        list: pageType().indexOf('ai_practice') === 0 ? 'ai_practice' : 'jiabinlu',
        location: form.getAttribute('data-track-location') || pageType(),
      });
    },
    true,
  );

  if (!document.documentElement.hasAttribute('data-spa')) pageView();
})();
