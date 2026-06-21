import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { BUTTONDOWN } from '../config/siteProfile';

type SubscribeCTAProps = {
  className?: string;
};

const SubscribeCTA: React.FC<SubscribeCTAProps> = ({ className = '' }) => {
  const { t } = useLanguage();

  return (
    <div className={className}>
      <p className="text-sm font-medium text-slate-700 mb-3">{t('blog.subscribe.label')}</p>
      <form
        action={BUTTONDOWN.embedAction}
        method="post"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 p-1.5 pl-4 sm:pl-5 border border-slate-200 rounded-full bg-white max-w-xl"
      >
        <input
          type="email"
          name="email"
          required
          placeholder={t('blog.subscribe.placeholder')}
          className="flex-1 min-w-0 py-2 text-sm bg-transparent border-0 outline-none focus:ring-0 text-slate-800 placeholder:text-slate-400"
        />
        <input type="hidden" name="embed" value="1" />
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-full hover:bg-slate-800 transition-colors shrink-0"
        >
          <ArrowRight className="w-4 h-4" />
          <span>{t('blog.subscribe.button')}</span>
        </button>
      </form>
    </div>
  );
};

export default SubscribeCTA;
