---
title: "从域名到架构：我的个人网站现状与经验"
date: "2025-08-09"
author: "Jiabin Lu"
description: "分享我的个人网站技术架构、建设经验与运营心得，从域名选择到技术栈的完整解析。"
tags: ["个人网站", "技术架构", "GitHub Pages", "React", "TypeScript"]
published: true
---

## 域名与托管

- **域名**：jiabinlu.com — 个人品牌与搜索可见性
- **托管**：GitHub Pages — 免费静态托管，无需服务器运维
- **安全与加速**：自动 HTTPS，全球 CDN

## 技术架构与构建流程

- **前端框架**：React + TypeScript — 组件化、类型安全、易维护
- **构建工具**：Vite — 开发/打包速度快，支持现代语法
- **样式体系**：Tailwind CSS — 原子化样式，提高迭代效率
- **路由**：React Router — SPA 客户端路由

![技术架构图](/images/blog/website-journey/tech-stack.svg "现代Web开发技术栈：React + TypeScript + Vite + Tailwind CSS")

### 部署流程

```bash
npm run dev     # 本地开发
npm run build   # 打包静态文件到 docs/
git push        # 推送触发 GitHub Pages 自动部署
```

推送后几分钟内网站即可上线。

![部署流程图](/images/blog/website-journey/deployment-flow.svg "GitHub Pages自动部署流程：从代码提交到网站上线")

## 网站核心内容与定位

1. **个人简介**：职业背景、人生价值与方向
2. **技术博客**：AI 技术、产品开发、内容创作工具的实践和人生感悟
3. **产品/项目展示**：自己做的AI工具、SaaS、开源项目的介绍与链接
4. **双语支持**：中文/英文覆盖更广读者

## 简要历史回顾

- **2016–2017**：纯手写 HTML/CSS/JavaScript
- **2025**：重构为 React + TypeScript，并引入 AI 工具辅助开发与写作

## 网站建设经验总结

- **低成本**：自有域名（namecheap） + GitHub Pages，几乎零运维费用
- **高效率**：Vite + Tailwind + AI 辅助，大幅缩短搭建与迭代时间
- **易扩展**：模块化组件 + 类型系统，功能演进更稳
- **内容为王**：技术是载体，持续输出高价值内容才是增长核心
- **先天国际化**：从一开始就设计 i18n，后续维护成本低



