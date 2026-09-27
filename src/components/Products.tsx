import React from 'react';
import { ExternalLink } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { PRODUCTS } from '../config/siteProfile';

const Products: React.FC = () => {
  const { t } = useLanguage();

  const products = [{ key: 'fixclip', buyUrl: PRODUCTS.fixclip.buyUrl }];

  return (
    <div className="min-h-screen bg-white text-slate-800">
      <div className="max-w-2xl mx-auto px-6 pt-28 pb-20 space-y-10">
        <header className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight">{t('products.title')}</h1>
          <p className="text-lg text-slate-700 leading-relaxed">{t('products.intro')}</p>
        </header>

        <div className="space-y-5">
          {products.map(({ key, buyUrl }) => (
            <article key={key} className="p-5 sm:p-6 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-xl font-semibold">{t(`products.${key}.name`)}</h2>
                <span className="text-sm text-slate-500">{t(`products.${key}.platform`)}</span>
              </div>
              <p className="text-slate-700 font-medium">{t(`products.${key}.tagline`)}</p>
              <p className="text-sm text-slate-600 leading-relaxed">{t(`products.${key}.description`)}</p>
              <div className="flex items-center justify-between gap-3 pt-2">
                <div>
                  <span className="text-2xl font-bold text-amber-600">{t(`products.${key}.price`)}</span>
                  <span className="text-sm text-slate-500 ml-2">{t('products.oneTime')}</span>
                </div>
                <a
                  href={buyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors shadow-sm"
                >
                  {t('products.buy')}
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Products;
