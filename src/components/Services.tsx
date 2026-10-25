import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, ChevronDown, Copy, Quote, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { WECHAT } from '../config/siteProfile';

const CASE_URL = '/blog/ai-consulting-say-no';
const DECK_URL = '/decks/ai-three-mindsets/';
const BIBI_SCREENSHOT = '/images/testimonials/bibi.webp';

const toNumber = (price: string) => Number(price.replace(/[^\d.]/g, ''));

const SectionTitle:React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <h2 className={`text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 ${className}`}>{children}</h2>
);

const Services: React.FC = () => {
  const { t } = useLanguage();
  const [showSticky, setShowSticky] = useState(false);
  const [copied, setCopied] = useState(false);

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
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const proofs = ['proof1', 'proof2', 'proof3'];
  const problems = ['problem1', 'problem2', 'problem3', 'problem4'];
  const layers = ['layer1', 'layer2', 'layer3', 'layer4'];
  const outcomes = ['outcome1', 'outcome2', 'outcome3'];
  const creds = ['cred1', 'cred2', 'cred3', 'cred4'];
  // Add a testimonial: t2Quote / t2Author / t2Meta / t2Note in both locales, then list it here.
  const testimonials = ['t1'];
  const steps = ['step1', 'step2', 'step3'];
  const tiers = ['tier1', 'tier2'];
  const faqs = ['faq1', 'faq2', 'faq3', 'faq4', 'faq5', 'faq6'];

  return (
    <div className="min-h-screen bg-white text-slate-800">
      {/* Hero */}
      <section className="bg-gradient-to-b from-amber-50/70 to-white">
        <div className="max-w-5xl mx-auto px-6 pt-32 pb-20">
          <p className="text-sm font-semibold text-amber-700 tracking-wide">{t('services.eyebrow')}</p>
          <h1 className="mt-4 text-4xl sm:text-5xl font-bold tracking-tight leading-tight text-slate-900 max-w-3xl">
            {t('services.heroTitle')}
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl">{t('services.heroSub')}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#book"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-amber-600 text-white font-semibold hover:bg-amber-700 transition-colors"
            >
              {t('services.ctaBook')}
              <ArrowRight className="w-4 h-4" />
            </a>
            <Link
              to={CASE_URL}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:border-amber-500 hover:text-amber-700 transition-colors"
            >
              {t('services.ctaCase')}
            </Link>
          </div>
          <ul className="mt-12 flex flex-wrap gap-x-8 gap-y-2 text-sm text-slate-500">
            {proofs.map((key) => (
              <li key={key} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                {t(`services.${key}`)}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Problems */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <SectionTitle>{t('services.problemsTitle')}</SectionTitle>
        <div className="mt-10 grid sm:grid-cols-2 gap-5">
          {problems.map((key, i) => (
            <div key={key} className="p-6 rounded-xl border border-slate-200 bg-white">
              <p className="text-xs font-mono text-amber-600">0{i + 1}</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{t(`services.${key}Title`)}</p>
              <p className="mt-2 text-slate-600 leading-relaxed">{t(`services.${key}`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <SectionTitle>{t('services.testimonialsTitle')}</SectionTitle>
        <div className="mt-10 grid lg:grid-cols-3 gap-5">
          {testimonials.map((key) => (
            <figure key={key} className="lg:col-span-2 p-8 rounded-2xl bg-amber-50 border border-amber-100">
              <Quote className="w-8 h-8 text-amber-400" />
              <blockquote className="mt-4 text-lg text-slate-800 leading-relaxed">{t(`services.${key}Quote`)}</blockquote>
              <figcaption className="mt-6 text-sm">
                <span className="font-semibold text-slate-900">{t(`services.${key}Author`)}</span>
                <span className="text-slate-500"> · {t(`services.${key}Meta`)}</span>
                {t(`services.${key}Note`) && (
                  <span className="block mt-1 text-xs text-slate-400">{t(`services.${key}Note`)}</span>
                )}
              </figcaption>
            </figure>
          ))}
          <Link
            to={CASE_URL}
            className="group p-8 rounded-2xl border border-slate-200 hover:border-amber-400 transition-colors flex flex-col"
          >
            <p className="text-sm font-semibold text-amber-600">{t('services.caseCardTitle')}</p>
            <p className="mt-3 text-xl font-semibold text-slate-900 leading-snug">{t('services.caseCardDesc')}</p>
            <span className="mt-auto pt-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 group-hover:text-amber-700">
              {t('services.caseCardLink')}
              <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        </div>

        {/* Featured testimonial: original screenshot beside who wrote it */}
        <figure className="mt-5 p-6 sm:p-8 rounded-2xl border border-slate-200 grid md:grid-cols-5 gap-8 items-start">
          <div className="md:col-span-2">
            <img
              src={BIBI_SCREENSHOT}
              alt={t('services.bibiImageAlt')}
              width={923}
              height={1593}
              loading="lazy"
              className="w-full max-w-sm mx-auto rounded-xl shadow-lg ring-1 ring-slate-900/10"
            />
            <p className="mt-2 text-center text-xs text-slate-400">{t('services.bibiImageNote')}</p>
          </div>
          <div className="md:col-span-3">
            <p className="text-sm font-semibold text-amber-600">{t('services.bibiLabel')}</p>
            <Quote className="mt-4 w-8 h-8 text-amber-400" />
            <blockquote className="mt-3 text-xl text-slate-900 leading-relaxed font-medium">{t('services.bibiQuote')}</blockquote>
            <figcaption className="mt-5">
              <span className="font-semibold text-slate-900">{t('services.bibiAuthor')}</span>
              <span className="block mt-1 text-sm text-slate-500">{t('services.bibiMeta')}</span>
            </figcaption>
            <p className="mt-6 text-slate-600 leading-relaxed">{t('services.bibiContext')}</p>
            <div className="mt-6 pt-5 border-t border-slate-100 text-sm">
              <span className="text-slate-500">{t('services.bibiIntroLabel')}</span>
              <span className="font-semibold text-slate-900">{t('services.bibiIntroName')}</span>
              <span className="block mt-1 text-slate-500">{t('services.bibiIntroMeta')}</span>
            </div>
          </div>
        </figure>
      </section>

      {/* Four layers */}
      <section className="bg-slate-50 border-y border-slate-100">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <SectionTitle>{t('services.layersTitle')}</SectionTitle>
          <p className="mt-4 text-lg text-slate-600 leading-relaxed max-w-3xl">{t('services.layersIntro')}</p>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {layers.map((key) => (
              <div key={key} className="p-5 rounded-xl bg-white border border-slate-200 flex flex-col">
                <p className="text-xl font-bold text-slate-900">{t(`services.${key}Name`)}</p>
                <p className="mt-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">{t('services.issueLabel')}</p>
                <p className="mt-1 text-sm text-slate-600 leading-relaxed">{t(`services.${key}Issue`)}</p>
                <p className="mt-4 text-xs font-semibold text-amber-600 uppercase tracking-wide">{t('services.doLabel')}</p>
                <p className="mt-1 text-sm text-slate-800 leading-relaxed">{t(`services.${key}Do`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Outcomes */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <SectionTitle>{t('services.outcomesTitle')}</SectionTitle>
        <div className="mt-10 grid md:grid-cols-3 gap-8">
          {outcomes.map((key, i) => (
            <div key={key} className="border-t-2 border-amber-500 pt-5">
              <p className="text-sm font-mono text-amber-600">0{i + 1}</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{t(`services.${key}Title`)}</p>
              <p className="mt-2 text-slate-600 leading-relaxed">{t(`services.${key}`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why me */}
      <section className="bg-slate-900 text-slate-100">
        <div className="max-w-5xl mx-auto px-6 py-20 grid lg:grid-cols-5 gap-12">
          <div className="lg:col-span-2 space-y-5">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">{t('services.whyTitle')}</h2>
            <p className="text-slate-300 leading-relaxed">{t('services.why2')}</p>
            <p className="text-amber-300 font-medium leading-relaxed">{t('services.why3')}</p>
          </div>
          <div className="lg:col-span-3 grid sm:grid-cols-2 gap-4">
            {creds.map((key) => (
              <div key={key} className="p-5 rounded-xl bg-slate-800/70 border border-slate-700">
                <p className="font-semibold text-white">{t(`services.${key}Title`)}</p>
                <p className="mt-2 text-sm text-slate-300 leading-relaxed">{t(`services.${key}`)}</p>
                {key === 'cred4' && (
                  <a
                    href={DECK_URL}
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
      <section className="bg-slate-50 border-y border-slate-100">
        <div className="max-w-5xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-14">
          <div>
            <SectionTitle>{t('services.processTitle')}</SectionTitle>
            <ol className="mt-8 space-y-6">
              {steps.map((key, i) => (
                <li key={key} className="flex gap-4">
                  <span className="shrink-0 w-8 h-8 rounded-full bg-amber-600 text-white text-sm font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900">{t(`services.${key}Title`)}</p>
                    <p className="mt-1 text-slate-600 leading-relaxed">{t(`services.${key}`)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <SectionTitle>{t('services.pricingTitle')}</SectionTitle>
            <p className="mt-3 text-sm text-amber-700">{t('services.pricingNote')}</p>
            <div className="mt-6 space-y-4">
              {tiers.map((key) => {
                const price = t(`services.${key}Price`);
                const original = t(`services.${key}OriginalPrice`);
                const pct = Math.round((1 - toNumber(price) / toNumber(original)) * 100);
                return (
                  <div key={key} className="p-6 rounded-xl bg-white border border-slate-200">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="font-semibold text-slate-900">{t(`services.${key}Name`)}</p>
                      <p className="text-sm text-slate-500">{t(`services.${key}Duration`)}</p>
                    </div>
                    <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <p className="text-3xl font-bold text-amber-600">{price}</p>
                      <p className="text-lg text-slate-400 line-through">{original}</p>
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">
                        {t('services.discountLabel').replace('{pct}', String(pct))}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600 leading-relaxed">{t(`services.${key}Desc`)}</p>
                  </div>
                );
              })}
              <div className="p-6 rounded-xl bg-slate-900 text-white">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-semibold">{t('services.tier3Name')}</p>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold">
                    {t('services.tier3Badge')}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-400">{t('services.tier3Duration')}</p>
                <p className="mt-2 text-2xl font-bold text-amber-400">{t('services.tier3Price')}</p>
                <p className="mt-2 text-sm text-slate-300 leading-relaxed">{t('services.tier3Desc')}</p>
                <p className="mt-3 text-sm text-amber-200">{t('services.tier3Note')}</p>
              </div>
            </div>
            <div className="mt-4 flex gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50">
              <ShieldCheck className="shrink-0 w-5 h-5 mt-0.5 text-amber-600" />
              <div>
                <p className="font-semibold text-slate-900">{t('services.guaranteeTitle')}</p>
                <p className="mt-1 text-sm text-slate-700 leading-relaxed">{t('services.guarantee')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-6 pt-20">
        <SectionTitle>{t('services.faqTitle')}</SectionTitle>
        <div className="mt-8 divide-y divide-slate-200 border-y border-slate-200">
          {faqs.map((key) => (
            <details key={key} className="group py-4">
              <summary className="flex items-center justify-between gap-4 cursor-pointer list-none font-semibold text-slate-900">
                {t(`services.${key}Q`)}
                <ChevronDown className="shrink-0 w-5 h-5 text-slate-400 transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-slate-600 leading-relaxed">{t(`services.${key}A`)}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section id="book" className="max-w-5xl mx-auto px-6 py-20 scroll-mt-20">
        <div className="flex flex-col md:flex-row items-center gap-8 p-8 sm:p-10 rounded-2xl bg-slate-900 text-white">
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{t('services.finalTitle')}</h2>
            <p className="mt-3 text-slate-300 leading-relaxed">{t('services.finalDesc')}</p>
            {WECHAT.id ? (
              <button
                type="button"
                onClick={copyWechatId}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-medium transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-amber-300" /> : <Copy className="w-4 h-4" />}
                {copied ? t('services.copiedWechatId') : `${t('services.copyWechatId')}：${WECHAT.id}`}
              </button>
            ) : (
              <p className="mt-3 text-sm text-slate-400">{t('wechat.handle').replace('{name}', WECHAT.displayName)}</p>
            )}
          </div>
          <div className="p-3 bg-white rounded-xl shrink-0">
            <img
              src={WECHAT.qrImage}
              alt={t('wechat.alt')}
              width={160}
              height={160}
              loading="lazy"
              className="w-36 h-36 sm:w-40 sm:h-40 object-contain"
            />
            <p className="md:hidden mt-2 max-w-[9rem] text-center text-xs text-slate-500 leading-snug">{t('services.qrHint')}</p>
          </div>
        </div>
      </section>

      {/* Mobile booking bar */}
      <div
        className={`md:hidden fixed inset-x-0 bottom-0 z-40 p-3 bg-white/95 backdrop-blur border-t border-slate-200 transition-transform duration-300 ${
          showSticky ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <a
          href="#book"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-amber-600 text-white font-semibold"
        >
          {t('services.stickyCta')}
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
};

export default Services;
