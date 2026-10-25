import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, ChevronDown, Copy, Quote, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { WECHAT } from '../config/siteProfile';
import { track } from '../utils/analytics';

const CASE_URL = '/blog/ai-consulting-say-no';
const DECK_URL = '/decks/ai-three-mindsets/';
const BIBI_SCREENSHOT = '/images/testimonials/bibi.webp';
const PORTRAIT = '/images/services/portrait.webp';

const toNumber = (price: string) => Number(price.replace(/[^\d.]/g, ''));

// One spacing scale for the page: every band uses this padding, every title sits mt-8 above its content.
const BAND = 'py-16 lg:py-20';
const WRAP = 'max-w-5xl mx-auto px-6';

const SectionTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <h2 className={`font-display text-[1.75rem] sm:text-[2rem] font-bold leading-snug text-stone-900 ${className}`}>{children}</h2>
);

const Services: React.FC = () => {
  const { t } = useLanguage();
  const [showSticky, setShowSticky] = useState(false);
  const [copied, setCopied] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const qrPressStart = useRef(0);

  // Funnel depth: one event the first time each key section scrolls into view.
  useEffect(() => {
    const seen = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const section = (entry.target as HTMLElement).dataset.track;
          if (entry.isIntersecting && section && !seen.has(section)) {
            seen.add(section);
            track('services_section_view', { section });
          }
        });
      },
      // Counts once the section reaches the middle of the screen; a ratio threshold can't fire on sections taller than the viewport.
      { rootMargin: '0px 0px -50% 0px' },
    );
    document.querySelectorAll('[data-track]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const previous = document.title;
    document.title = t('services.pageTitle');
    return () => {
      document.title = previous;
    };
  }, [t]);

  // Mobile booking bar: visible once the hero is scrolled past, hidden from the booking section onward.
  useEffect(() => {
    const book = document.getElementById('book');
    const update = () => {
      const reachedBook = book ? book.getBoundingClientRect().top < window.innerHeight : false;
      setShowSticky(window.scrollY > 600 && !reachedBook);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  const copyWechatId = async () => {
    let ok = false;
    try {
      await navigator.clipboard.writeText(WECHAT.id);
      ok = true;
    } catch {
      // In-app browsers (WeChat included) often block the Clipboard API; fall back to execCommand.
      const input = document.createElement('textarea');
      input.value = WECHAT.id;
      input.setAttribute('readonly', '');
      input.style.position = 'fixed';
      input.style.opacity = '0';
      document.body.appendChild(input);
      input.select();
      ok = document.execCommand('copy');
      document.body.removeChild(input);
    }
    // If both fail, the ID stays visible on the button to copy by hand.
    track('services_wechat_copy', { result: ok ? 'copied' : 'failed' });
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const proofs = ['proof1', 'proof4', 'proof2', 'proof3'];
  const problems = ['problem1', 'problem2', 'problem3', 'problem4'];
  const layers = ['layer1', 'layer2', 'layer3', 'layer4'];
  const outcomes = ['outcome1', 'outcome2', 'outcome3'];
  const creds = ['cred1', 'cred2', 'cred3', 'cred4'];
  // Add a testimonial: t2Quote / t2Author / t2Meta / t2Note in both locales, then list it here.
  const testimonials = ['t1'];
  const steps = ['step1', 'step2', 'step3', 'step4'];
  const tiers = ['tier1', 'tier2'];
  const faqs = ['faq1', 'faq2', 'faq3', 'faq4', 'faq5', 'faq6'];

  return (
    <div className="min-h-screen bg-white text-stone-700">
      {/* Hero */}
      <section className={`${WRAP} pt-28 pb-16 lg:pt-32 lg:pb-20 grid lg:grid-cols-12 gap-10 lg:gap-14 items-center`}>
        <div className="lg:col-span-7">
          <p className="text-sm font-semibold text-amber-700">{t('services.eyebrow')}</p>
          <h1 className="mt-5 font-display text-[2.25rem] sm:text-5xl lg:text-[3.4rem] font-bold leading-[1.2] text-stone-900 [text-wrap:balance]">
            {t('services.heroTitle')}
          </h1>
          <p className="mt-6 text-lg text-stone-600 leading-relaxed max-w-xl">{t('services.heroSub')}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#book"
              onClick={() => track('services_book_click', { location: 'hero' })}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-amber-700 text-white font-semibold hover:bg-amber-800 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700"
            >
              {t('services.ctaBook')}
              <ArrowRight className="w-4 h-4" />
            </a>
            <Link
              to={CASE_URL}
              onClick={() => track('services_case_click', { location: 'hero' })}
              className="inline-flex items-center px-6 py-3 rounded-lg border border-stone-300 text-stone-800 font-semibold hover:border-stone-900 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700"
            >
              {t('services.ctaCase')}
            </Link>
          </div>
          <ul className="mt-10 pt-6 border-t border-stone-200 space-y-2.5 text-[0.9375rem] text-stone-600">
            {proofs.map((key) => (
              <li key={key} className="flex gap-2.5">
                <Check className="shrink-0 w-4 h-4 mt-0.5 text-amber-700" />
                {t(`services.${key}`)}
              </li>
            ))}
          </ul>
        </div>
        <figure className="lg:col-span-5 lg:max-w-[22rem] lg:ml-auto flex lg:block items-center gap-4">
          <img
            src={PORTRAIT}
            alt={t('services.portraitName')}
            width={720}
            height={900}
            className="w-20 h-20 lg:w-full lg:h-auto shrink-0 rounded-full lg:rounded-2xl object-cover object-top shadow-[0_24px_60px_-28px_rgba(28,25,23,0.35)]"
          />
          <figcaption className="lg:mt-4">
            <p className="font-semibold text-stone-900">{t('services.portraitName')}</p>
            <p className="mt-0.5 text-sm text-stone-500">{t('services.portraitCaption')}</p>
          </figcaption>
        </figure>
      </section>

      {/* Problems */}
      <section className="bg-stone-100">
        <div className={`${WRAP} ${BAND}`}>
          <SectionTitle>{t('services.problemsTitle')}</SectionTitle>
          <div className="mt-8 grid sm:grid-cols-2 gap-x-12">
            {problems.map((key) => (
              <div key={key} className="py-6 border-t border-stone-300">
                <p className="text-lg font-semibold text-stone-900">{t(`services.${key}Title`)}</p>
                <p className="mt-2 text-stone-600 leading-relaxed">{t(`services.${key}`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section data-track="testimonials" className={`${WRAP} ${BAND}`}>
        <SectionTitle>{t('services.testimonialsTitle')}</SectionTitle>
        <div className="mt-8 grid lg:grid-cols-3 gap-5">
          {testimonials.map((key) => (
            <figure key={key} className="lg:col-span-2 p-7 sm:p-8 rounded-2xl bg-amber-50 ring-1 ring-amber-100">
              <Quote className="w-7 h-7 text-amber-500" />
              <blockquote
                className={`mt-4 text-[1.0625rem] text-stone-800 leading-relaxed ${quoteOpen ? '' : 'line-clamp-4 sm:line-clamp-none'}`}
              >
                {t(`services.${key}Quote`)}
              </blockquote>
              {!quoteOpen && (
                <button
                  type="button"
                  onClick={() => setQuoteOpen(true)}
                  className="sm:hidden mt-2 text-sm font-medium text-amber-700"
                >
                  {t('services.readMore')}
                </button>
              )}
              <figcaption className="mt-6 text-sm">
                <span className="font-semibold text-stone-900">{t(`services.${key}Author`)}</span>
                <span className="block mt-1 text-stone-500">{t(`services.${key}Meta`)}</span>
                {t(`services.${key}Note`) && (
                  <span className="block mt-1 text-xs text-stone-400">{t(`services.${key}Note`)}</span>
                )}
              </figcaption>
            </figure>
          ))}
          <Link
            to={CASE_URL}
            onClick={() => track('services_case_click', { location: 'testimonials' })}
            className="group p-7 sm:p-8 rounded-2xl ring-1 ring-stone-200 hover:ring-stone-400 transition-shadow flex flex-col"
          >
            <p className="text-sm font-semibold text-amber-700">{t('services.caseCardTitle')}</p>
            <p className="mt-3 font-display text-xl font-bold text-stone-900 leading-snug">{t('services.caseCardDesc')}</p>
            <span className="mt-auto pt-6 inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 group-hover:text-stone-900">
              {t('services.caseCardLink')}
              <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        </div>

        {/* Featured testimonial: original screenshot beside who wrote it */}
        <figure className="mt-5 p-6 sm:p-10 rounded-2xl ring-1 ring-stone-200 grid md:grid-cols-5 gap-8 md:gap-10 items-start">
          <div className="md:col-span-2 order-last md:order-none flex md:block items-center gap-4">
            <a href={BIBI_SCREENSHOT} target="_blank" rel="noopener" className="shrink-0 md:block">
              <img
                src={BIBI_SCREENSHOT}
                alt={t('services.bibiImageAlt')}
                width={923}
                height={1593}
                loading="lazy"
                className="w-24 md:w-full md:max-w-[18rem] mx-auto rounded-lg md:rounded-xl shadow-xl ring-1 ring-stone-900/10"
              />
            </a>
            <p className="md:mt-3 md:text-center text-xs text-stone-400 leading-relaxed">
              {t('services.bibiImageNote')}
              <span className="md:hidden block">{t('services.bibiImageTap')}</span>
            </p>
          </div>
          <div className="md:col-span-3">
            <p className="text-sm font-semibold text-amber-700">{t('services.bibiLabel')}</p>
            <blockquote className="mt-4 font-display text-[1.375rem] sm:text-2xl font-bold text-stone-900 leading-normal">
              “{t('services.bibiQuote')}”
            </blockquote>
            <figcaption className="mt-5">
              <span className="font-semibold text-stone-900">{t('services.bibiAuthor')}</span>
              <span className="block mt-1 text-sm text-stone-500">{t('services.bibiMeta')}</span>
            </figcaption>
            <p className="mt-6 text-stone-600 leading-relaxed">{t('services.bibiContext')}</p>
            <div className="mt-6 pt-5 border-t border-stone-200 text-sm">
              <p className="text-stone-500">{t('services.bibiIntroLabel')}</p>
              <ul className="mt-2 space-y-3">
                {['bibiIntro', 'bibiIntro2'].map((key) => (
                  <li key={key}>
                    <span className="font-semibold text-stone-900">{t(`services.${key}Name`)}</span>
                    <span className="block mt-1 text-stone-500 leading-relaxed">{t(`services.${key}Meta`)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </figure>
      </section>

      {/* Four layers */}
      <section data-track="layers" className="bg-stone-100">
        <div className={`${WRAP} ${BAND}`}>
          <SectionTitle>{t('services.layersTitle')}</SectionTitle>
          <p className="mt-4 text-lg text-stone-600 leading-relaxed max-w-2xl">{t('services.layersIntro')}</p>
          <p className="sm:hidden mt-3 text-sm text-stone-400">{t('services.swipeHint')}</p>
          <div className="mt-8 -mx-6 px-6 sm:mx-0 sm:px-0 flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto sm:overflow-visible snap-x snap-mandatory scroll-px-6 [scrollbar-width:none]">
            {layers.map((key) => (
              <div key={key} className="w-[82%] sm:w-auto shrink-0 snap-start p-6 rounded-xl bg-white ring-1 ring-stone-200 flex flex-col">
                <p className="font-display text-2xl font-bold text-stone-900">{t(`services.${key}Name`)}</p>
                <p className="mt-5 text-xs font-semibold text-stone-400">{t('services.issueLabel')}</p>
                <p className="mt-1 text-sm text-stone-600 leading-relaxed">{t(`services.${key}Issue`)}</p>
                <p className="mt-4 pt-4 border-t border-stone-100 text-xs font-semibold text-amber-700">{t('services.doLabel')}</p>
                <p className="mt-1 text-sm text-stone-800 leading-relaxed">{t(`services.${key}Do`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Outcomes */}
      <section className={`${WRAP} ${BAND}`}>
        <SectionTitle>{t('services.outcomesTitle')}</SectionTitle>
        <div className="mt-8 grid md:grid-cols-3 gap-x-10 gap-y-8">
          {outcomes.map((key) => (
            <div key={key} className="pt-5 border-t-2 border-stone-900">
              <p className="font-display text-xl font-bold text-stone-900">{t(`services.${key}Title`)}</p>
              <p className="mt-3 text-stone-600 leading-relaxed">{t(`services.${key}`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why me */}
      <section data-track="why_me" className="bg-stone-900 text-stone-200">
        <div className={`${WRAP} ${BAND} grid lg:grid-cols-5 gap-10 lg:gap-12`}>
          <div className="lg:col-span-2 space-y-5">
            <h2 className="font-display text-[1.75rem] sm:text-[2rem] font-bold leading-snug text-white">{t('services.whyTitle')}</h2>
            <p className="text-stone-300 leading-relaxed">{t('services.why2')}</p>
            <p className="text-amber-300 font-medium leading-relaxed">{t('services.why3')}</p>
          </div>
          <div className="lg:col-span-3 grid sm:grid-cols-2 gap-px bg-stone-700/60 rounded-xl overflow-hidden ring-1 ring-stone-700/60">
            {creds.map((key) => (
              <div key={key} className="p-6 bg-stone-900">
                <p className="font-semibold text-white">{t(`services.${key}Title`)}</p>
                <p className="mt-2 text-sm text-stone-400 leading-relaxed">{t(`services.${key}`)}</p>
                {key === 'cred4' && (
                  <a
                    href={DECK_URL}
                    onClick={() => track('services_deck_click')}
                    className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-amber-300 hover:text-amber-200"
                  >
                    {t('services.cred4Link')}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process + pricing */}
      <section data-track="pricing" className={`${WRAP} ${BAND} grid lg:grid-cols-2 gap-14 items-start`}>
        <div className="lg:sticky lg:top-24">
          <SectionTitle>{t('services.processTitle')}</SectionTitle>
          <ol className="mt-8 space-y-7">
            {steps.map((key, i) => (
              <li key={key} className="flex gap-4">
                <span className="shrink-0 w-8 h-8 rounded-full ring-1 ring-stone-300 text-stone-900 text-sm font-semibold flex items-center justify-center">
                  {i + 1}
                </span>
                <div>
                  <p className="font-semibold text-stone-900">{t(`services.${key}Title`)}</p>
                  <p className="mt-1 text-stone-600 leading-relaxed">{t(`services.${key}`)}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <SectionTitle>{t('services.pricingTitle')}</SectionTitle>
          <p className="mt-3 text-sm text-amber-700">{t('services.pricingNote')}</p>
          <div className="mt-6 space-y-3">
            {tiers.map((key) => {
              const price = t(`services.${key}Price`);
              const original = t(`services.${key}OriginalPrice`);
              const pct = Math.round((1 - toNumber(price) / toNumber(original)) * 100);
              return (
                <div key={key} className="p-6 rounded-xl ring-1 ring-stone-200">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="font-semibold text-stone-900">{t(`services.${key}Name`)}</p>
                    <p className="text-sm text-stone-500">{t(`services.${key}Duration`)}</p>
                  </div>
                  <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <p className="text-3xl font-bold text-stone-900 tabular-nums">{price}</p>
                    <p className="text-base text-stone-400 line-through tabular-nums">{original}</p>
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">
                      {t('services.discountLabel').replace('{pct}', String(pct))}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-stone-600 leading-relaxed">{t(`services.${key}Desc`)}</p>
                </div>
              );
            })}
            <div className="p-6 rounded-xl bg-stone-900 text-white">
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-semibold">{t('services.tier3Name')}</p>
                <span className="px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-300 text-xs font-semibold">
                  {t('services.tier3Badge')}
                </span>
              </div>
              <p className="mt-1 text-sm text-stone-400">{t('services.tier3Duration')}</p>
              <p className="mt-2 text-2xl font-bold text-white">{t('services.tier3Price')}</p>
              <p className="mt-2 text-sm text-stone-300 leading-relaxed">{t('services.tier3Desc')}</p>
              <p className="mt-3 text-sm text-amber-200">{t('services.tier3Note')}</p>
            </div>
          </div>
          <div className="mt-3 flex gap-3 p-5 rounded-xl bg-amber-50 ring-1 ring-amber-200">
            <ShieldCheck className="shrink-0 w-5 h-5 mt-0.5 text-amber-700" />
            <div>
              <p className="font-semibold text-stone-900">{t('services.guaranteeTitle')}</p>
              <p className="mt-1 text-sm text-stone-700 leading-relaxed">{t('services.guarantee')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section data-track="faq" className="bg-stone-100">
        <div className={`max-w-3xl mx-auto px-6 ${BAND}`}>
          <SectionTitle>{t('services.faqTitle')}</SectionTitle>
          <div className="mt-8 divide-y divide-stone-300 border-y border-stone-300">
            {faqs.map((key) => (
              <details
                key={key}
                className="group py-5"
                onToggle={(e) => e.currentTarget.open && track('services_faq_open', { question: key })}
              >
                <summary className="flex items-center justify-between gap-4 cursor-pointer list-none font-semibold text-stone-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-700 rounded">
                  {t(`services.${key}Q`)}
                  <ChevronDown className="shrink-0 w-5 h-5 text-stone-400 transition-transform group-open:rotate-180 motion-reduce:transition-none" />
                </summary>
                <p className="mt-3 text-stone-600 leading-relaxed">{t(`services.${key}A`)}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section id="book" data-track="book" className={`${WRAP} ${BAND} scroll-mt-16`}>
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 p-8 sm:p-12 rounded-2xl bg-stone-900 text-white">
          <div className="flex-1 text-center md:text-left">
            <h2 className="font-display text-[1.75rem] sm:text-[2rem] font-bold leading-snug">{t('services.finalTitle')}</h2>
            <p className="mt-3 text-stone-300 leading-relaxed">{t('services.finalDesc')}</p>
            {WECHAT.id ? (
              <button
                type="button"
                onClick={copyWechatId}
                className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
              >
                {copied ? <Check className="w-4 h-4 text-amber-300" /> : <Copy className="w-4 h-4" />}
                {copied ? t('services.copiedWechatId') : `${t('services.copyWechatId')}：${WECHAT.id}`}
              </button>
            ) : (
              <p className="mt-3 text-sm text-stone-400">{t('wechat.handle').replace('{name}', WECHAT.displayName)}</p>
            )}
          </div>
          <div className="p-3 bg-white rounded-xl shrink-0">
            <img
              onTouchStart={() => {
                qrPressStart.current = Date.now();
              }}
              onTouchEnd={() => {
                if (Date.now() - qrPressStart.current > 450) track('services_qr_longpress');
              }}
              src={WECHAT.qrImage}
              alt={t('wechat.alt')}
              width={160}
              height={160}
              loading="lazy"
              className="w-36 h-36 sm:w-40 sm:h-40 object-contain"
            />
            <p className="md:hidden mt-2 max-w-[9rem] text-center text-xs text-stone-500 leading-snug">{t('services.qrHint')}</p>
          </div>
        </div>
      </section>

      {/* Mobile booking bar */}
      <div
        className={`md:hidden fixed inset-x-0 bottom-0 z-40 p-3 bg-white/95 backdrop-blur border-t border-stone-200 transition-transform duration-300 motion-reduce:transition-none ${
          showSticky ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <a
          href="#book"
          onClick={() => track('services_book_click', { location: 'sticky_bar' })}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-amber-700 text-white font-semibold"
        >
          {t('services.stickyCta')}
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
};

export default Services;
