import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { WECHAT } from '../config/siteProfile';

type WeChatCTAProps = {
  className?: string;
};

const WeChatCTA: React.FC<WeChatCTAProps> = ({ className = '' }) => {
  const { t } = useLanguage();

  const panels = [
    {
      key: 'personal',
      src: WECHAT.qrImage,
      alt: t('wechat.alt'),
      headline: t('wechat.headline'),
      description: t('wechat.description'),
      note: t('wechat.handle').replace('{name}', WECHAT.displayName),
    },
    {
      key: 'mp',
      src: WECHAT.mpQrImage,
      alt: t('wechat.mpAlt'),
      headline: t('wechat.mpHeadline'),
      description: t('wechat.mpDescription'),
      note: '',
    },
  ];

  return (
    <div className={className}>
      <div className="grid sm:grid-cols-2 gap-5 p-5 sm:p-6 bg-emerald-50 border border-emerald-100 rounded-xl">
        {panels.map((panel) => (
          <div key={panel.key} className="flex flex-col items-center text-center gap-3">
            <div className="p-2 bg-white border border-emerald-100 rounded-lg shadow-sm">
              <img
                src={panel.src}
                alt={panel.alt}
                width={144}
                height={144}
                loading="lazy"
                className="w-32 h-32 sm:w-36 sm:h-36 object-contain"
              />
            </div>
            <div>
              <p className="text-base font-semibold text-slate-800">{panel.headline}</p>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">{panel.description}</p>
              {panel.note && <p className="text-xs text-slate-500 mt-2">{panel.note}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeChatCTA;
