import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { WECHAT } from '../config/siteProfile';

type WeChatCTAProps = {
  className?: string;
};

const WeChatCTA: React.FC<WeChatCTAProps> = ({ className = '' }) => {
  const { t } = useLanguage();

  return (
    <div className={className}>
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 p-5 sm:p-6 bg-emerald-50 border border-emerald-100 rounded-xl">
        <div className="shrink-0 p-2 bg-white border border-emerald-100 rounded-lg shadow-sm">
          <img
            src={WECHAT.qrImage}
            alt={t('wechat.alt')}
            width={160}
            height={160}
            loading="lazy"
            className="w-36 h-36 sm:w-40 sm:h-40 object-contain"
          />
        </div>
        <div className="text-center sm:text-left">
          <p className="text-base font-semibold text-slate-800">{t('wechat.headline')}</p>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">{t('wechat.description')}</p>
          <p className="text-xs text-slate-500 mt-3">
            {t('wechat.handle').replace('{name}', WECHAT.displayName)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default WeChatCTA;
