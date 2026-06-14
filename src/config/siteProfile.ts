export interface TimelineEntry {
  period: string;
  role: string;
  company: string;
  note?: { zh: string; en: string };
  href?: string;
}

export const VALUE_STACK_SERIES = {
  id: 'value-stack',
  title: { zh: '从写代码到拥有价值', en: 'From Code to Ownership' },
  parts: [
    { slug: 'whole-engineer', part: 1 },
    { slug: 'solution-outcome-value', part: 2 },
    { slug: 'value-creator-to-value-owner', part: 3 },
  ],
};

export const careerTimeline: TimelineEntry[] = [
  {
    period: '2026 – 今',
    role: 'GTM Lead',
    company: 'Amplitude',
    note: {
      zh: 'GTM × Engineering · 把碎片化的人工作流变成可落地的系统',
      en: 'GTM × Engineering · turning fragmented human workflows into scalable systems',
    },
    href: 'https://amplitude.com',
  },
  {
    period: '2025 – 2026',
    role: 'Senior Engineering Manager',
    company: 'Amplitude',
    note: {
      zh: 'Query 团队 · 分布式查询引擎',
      en: 'Query team · distributed analytics engine',
    },
    href: 'https://amplitude.com',
  },
  {
    period: '2023 – 2025',
    role: 'Engineering Manager',
    company: 'Amplitude',
    note: {
      zh: 'Query 团队 · Java / AWS · 数十亿事件/秒级查询',
      en: 'Query team · Java / AWS · billions of events per query',
    },
    href: 'https://amplitude.com',
  },
  {
    period: '2021 – 2023',
    role: 'Staff / Senior Software Engineer',
    company: 'Amplitude',
    note: {
      zh: 'Team Lead → Staff · 产品分析核心引擎',
      en: 'Team Lead → Staff · core product analytics engine',
    },
    href: 'https://amplitude.com',
  },
  {
    period: '2019 – 2021',
    role: 'Software Engineer',
    company: 'Apple',
    note: {
      zh: 'Apple Media Products · Commerce 后端（账户、订阅、交易）',
      en: 'Apple Media Products · Commerce backend (accounts, subscriptions, billing)',
    },
    href: 'https://apple.com',
  },
  {
    period: '2016 – 2019',
    role: 'Software Engineer',
    company: 'Amazon',
    note: {
      zh: 'Core AI · Hadoop / Spark · 西雅图',
      en: 'Core AI · Hadoop / Spark · Seattle',
    },
    href: 'https://amazon.com',
  },
];

export const EMAIL = 'jiabinlu325204@gmail.com';
export const LINKEDIN = 'https://www.linkedin.com/in/jiabinlu/';
export const BLOG_LEGACY = 'https://blog.lujiabin.me/';

export const BUTTONDOWN = {
  username: '325louis',
  subscribeUrl: 'https://buttondown.com/325louis',
  embedAction: 'https://buttondown.com/api/emails/embed-subscribe/325louis',
};
