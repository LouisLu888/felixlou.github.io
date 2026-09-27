import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { WECHAT } from '../config/siteProfile';

const Services: React.FC = () => {
  const { t } = useLanguage();

  const audience = ['who1', 'who2', 'who3'];
  const offerings = ['help1', 'help2', 'help3', 'help4'];
  const tiers = ['tier1', 'tier2'];

  return (
    <div className="min-h-screen bg-white text-slate-800">
      <div className="max-w-2xl mx-auto px-6 pt-28 pb-20 space-y-12">
        <header className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight">{t('services.title')}</h1>
          <p className="text-lg text-slate-700 leading-relaxed">{t('services.intro')}</p>
        </header>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">{t('services.whoTitle')}</h2>
          <ul className="list-disc list-outside pl-5 space-y-1.5 text-slate-700 leading-relaxed">
            {audience.map((key) => (
              <li key={key}>{t(`services.${key}`)}</li>
            ))}
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">{t('services.helpTitle')}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {offerings.map((key) => (
              <div key={key} className="p-4 border border-slate-200 rounded-xl">
                <p className="font-semibold text-slate-800">{t(`services.${key}Title`)}</p>
                <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">{t(`services.${key}`)}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">{t('services.pricingTitle')}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {tiers.map((key) => (
              <div key={key} className="p-5 bg-amber-50 border border-amber-100 rounded-xl space-y-2">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-semibold text-slate-800">{t(`services.${key}Name`)}</p>
                  <p className="text-sm text-slate-500">{t(`services.${key}Duration`)}</p>
                </div>
                <p className="text-2xl font-bold text-amber-600">{t(`services.${key}Price`)}</p>
                <p className="text-sm text-slate-600 leading-relaxed">{t(`services.${key}Desc`)}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col sm:flex-row items-center gap-5 p-5 sm:p-6 bg-emerald-50 border border-emerald-100 rounded-xl">
          <div className="p-2 bg-white border border-emerald-100 rounded-lg shadow-sm shrink-0">
            <img
              src={WECHAT.qrImage}
              alt={t('wechat.alt')}
              width={144}
              height={144}
              loading="lazy"
              className="w-32 h-32 sm:w-36 sm:h-36 object-contain"
            />
          </div>
          <div className="text-center sm:text-left">
            <p className="text-base font-semibold text-slate-800">{t('services.bookTitle')}</p>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">{t('services.bookDesc')}</p>
            <p className="text-xs text-slate-500 mt-2">{t('wechat.handle').replace('{name}', WECHAT.displayName)}</p>
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">{t('services.caseTitle')}</h2>
          <Link
            to="/blog/ai-consulting-say-no"
            className="inline-flex items-center gap-1.5 text-amber-600 hover:text-amber-700 font-medium"
          >
            {t('services.caseLink')}
            <ArrowRight className="w-4 h-4 shrink-0" />
          </Link>
        </section>
      </div>
    </div>
  );
};

export default Services;
