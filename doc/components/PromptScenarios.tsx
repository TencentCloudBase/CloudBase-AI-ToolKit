import Link from '@docusaurus/Link';
import React from 'react';
import styles from './PromptScenarios.module.css';

interface Scenario {
  id: string;
  title: string;
  description: string;
  category: string;
  docUrl: string;
}

const scenarios: Scenario[] = [
  // 身份认证
  {
    id: 'auth-web',
    title: '身份认证：Web',
    description: 'Web SDK 身份认证',
    category: '身份认证',
    docUrl: '/ai/cloudbase-ai-toolkit/prompts/auth-web',
  },
  {
    id: 'auth-wechat',
    title: '身份认证：微信小程序',
    description: '微信小程序身份认证',
    category: '身份认证',
    docUrl: '/ai/cloudbase-ai-toolkit/prompts/auth-wechat',
  },
  {
    id: 'auth-http-api',
    title: '身份认证：App',
    description: 'Android、iOS 原生应用',
    category: '身份认证',
    docUrl: '/ai/cloudbase-ai-toolkit/prompts/auth-http-api',
  },
  // 数据库
  {
    id: 'no-sql-web-sdk',
    title: '文档数据库：Web',
    description: 'Web SDK 文档数据库',
    category: '数据库',
    docUrl: '/ai/cloudbase-ai-toolkit/prompts/no-sql-web-sdk',
  },
  {
    id: 'no-sql-wx-mp-sdk',
    title: '文档数据库：小程序',
    description: '小程序 SDK 文档数据库',
    category: '数据库',
    docUrl: '/ai/cloudbase-ai-toolkit/prompts/no-sql-wx-mp-sdk',
  },
  {
    id: 'relational-database-tool',
    title: '关系型数据库',
    description: 'MySQL 关系型数据库',
    category: '数据库',
    docUrl: '/ai/cloudbase-ai-toolkit/prompts/relational-database-tool',
  },
  {
    id: 'data-model-creation',
    title: '数据模型创建',
    description: 'AI 创建数据模型',
    category: '数据库',
    docUrl: '/ai/cloudbase-ai-toolkit/prompts/data-model-creation',
  },
  {
    id: 'database-http-api',
    title: '数据库：App',
    description: 'Android、iOS 原生应用',
    category: '数据库',
    docUrl: '/ai/cloudbase-ai-toolkit/prompts/database-http-api',
  },
  // 后端开发
  {
    id: 'cloudrun-development',
    title: '云托管开发',
    description: 'Node.js、Python、Go、Java 等',
    category: '后端开发',
    docUrl: '/ai/cloudbase-ai-toolkit/prompts/cloudrun-development',
  },
  // 应用集成
  {
    id: 'web-development',
    title: 'Web 开发',
    description: 'React、Vue、Next.js',
    category: '应用集成',
    docUrl: '/ai/cloudbase-ai-toolkit/prompts/web-development',
  },
  {
    id: 'miniprogram-development',
    title: '微信小程序',
    description: '小程序开发与集成',
    category: '应用集成',
    docUrl: '/ai/cloudbase-ai-toolkit/prompts/miniprogram-development',
  },
  {
    id: 'ui-design',
    title: 'UI 设计',
    description: '专业界面设计指南',
    category: '应用集成',
    docUrl: '/ai/cloudbase-ai-toolkit/prompts/ui-design',
  },
  {
    id: 'http-api',
    title: 'App 集成',
    description: 'Android、iOS 原生应用',
    category: '应用集成',
    docUrl: '/ai/cloudbase-ai-toolkit/prompts/http-api',
  },
  // 开发工具
  {
    id: 'spec-workflow',
    title: 'Spec 工作流',
    description: '需求分析、技术设计、任务规划',
    category: '开发工具',
    docUrl: '/ai/cloudbase-ai-toolkit/prompts/spec-workflow',
  },
  {
    id: 'cloudbase-platform',
    title: 'CloudBase 平台',
    description: '平台知识库和最佳实践',
    category: '开发工具',
    docUrl: '/ai/cloudbase-ai-toolkit/prompts/cloudbase-platform',
  },
];

const categoryLabels: Record<string, string> = {
  '身份认证': '身份认证',
  '数据库': '数据库',
  '后端开发': '后端开发',
  '应用集成': '应用集成',
  '开发工具': '开发工具',
};


const groupedScenarios = scenarios.reduce((acc, scenario) => {
  if (!acc[scenario.category]) {
    acc[scenario.category] = [];
  }
  acc[scenario.category].push(scenario);
  return acc;
}, {} as Record<string, Scenario[]>);

export default function PromptScenarios() {
  return (
    <div className={styles.container}>
      {Object.entries(groupedScenarios).map(([category, items]) => (
        <div key={category} className={styles.category}>
          <h3 className={styles.categoryTitle}>{categoryLabels[category] || category}</h3>
          <div className={styles.grid}>
            {items.map((scenario) => {
              return (
                <Link
                  key={scenario.id}
                  to={scenario.docUrl}
                  className={styles.card}
                >
                  <div className={styles.content}>
                    <div className={styles.title}>{scenario.title}</div>
                    <div className={styles.description}>{scenario.description}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

