import React from 'react';
import Link from '@docusaurus/Link';
import styles from './TutorialsGrid.module.css';

interface Tutorial {
  id: string;
  title: string;
  description: string;
  category: string;
  url: string;
  type: 'article' | 'video' | 'project';
}

const tutorials: Tutorial[] = [
  // 文章
  {
    id: 'ai-cli-miniprogram',
    title: '用 CloudBase AI CLI 开发邻里闲置物品循环利用小程序',
    description: '详细案例教程，展示如何使用 CloudBase AI CLI 从零开始开发完整的小程序项目',
    category: '文章',
    url: 'https://docs.cloudbase.net/practices/ai-cli-mini-program',
    type: 'article',
  },
  {
    id: 'codebuddy-card-game',
    title: '使用 CodeBuddy IDE + CloudBase 一站式开发卡片翻翻翻游戏',
    description: '全栈 Web 应用开发实战',
    category: '文章',
    url: 'https://mp.weixin.qq.com/s/2EM3RBzdQUCdfld2CglWgg',
    type: 'article',
  },
  {
    id: 'breakfast-shop',
    title: '1小时开发微信小游戏《我的早餐店》',
    description: '基于 CloudBase AI Toolkit',
    category: '文章',
    url: 'https://cloud.tencent.com/developer/article/2532595',
    type: 'article',
  },
  {
    id: 'cursor-game',
    title: 'AI Coding宝藏组合：Cursor + Cloudbase-AI-Toolkit 开发游戏实战',
    description: '游戏开发实战案例',
    category: '文章',
    url: 'https://juejin.cn/post/7518783423277695028#comment',
    type: 'article',
  },
  {
    id: 'overcooked-game',
    title: '2天上线一款可联机的分手厨房小游戏',
    description: '联机游戏开发案例',
    category: '文章',
    url: 'https://mp.weixin.qq.com/s/nKfhHUf8w-EVKvA0u1rdeg',
    type: 'article',
  },
  {
    id: 'hospital-scheduling',
    title: 'CloudBase AI Toolkit 做一个医院实习生排班系统',
    description: '告别痛苦的 excel 表格',
    category: '文章',
    url: 'https://cloud.tencent.com/developer/article/2538023',
    type: 'article',
  },
  {
    id: 'cloud-deploy',
    title: '没有服务器，怎么云化部署前后端项目',
    description: '云化部署实战',
    category: '文章',
    url: 'https://cloud.tencent.com/developer/article/2537971',
    type: 'article',
  },
  {
    id: 'business-card',
    title: '快速打造程序员专属名片网站',
    description: '个人名片网站开发',
    category: '文章',
    url: 'https://cloud.tencent.com/developer/article/2536273',
    type: 'article',
  },
  {
    id: 'hot-words-miniprogram',
    title: '我用「CloudBase AI ToolKit」一天做出"网络热词"小程序',
    description: '小程序开发案例',
    category: '文章',
    url: 'https://cloud.tencent.com/developer/article/2537907',
    type: 'article',
  },
  {
    id: 'cloud-library',
    title: '用AI打造你的专属"云书房"小程序！',
    description: '小程序开发实战',
    category: '文章',
    url: 'https://cloud.tencent.com/developer/article/2535789',
    type: 'article',
  },
  {
    id: 'resume-miniprogram',
    title: '一人挑战全栈研发简历制作小程序',
    description: '全栈开发案例',
    category: '文章',
    url: 'https://cloud.tencent.com/developer/article/2535894',
    type: 'article',
  },
  {
    id: 'worry-box',
    title: '我用AI开发并上线了一款小程序：解忧百宝盒',
    description: '小程序上线案例',
    category: '文章',
    url: 'https://mp.weixin.qq.com/s/DYekRheNQ2u8LAl_F830fA',
    type: 'article',
  },
  {
    id: 'figma-cursor-cloudbase',
    title: 'AI时代，从零基础到全栈开发者之路',
    description: 'Figma + Cursor + Cloudbase 快速搭建微信小程序',
    category: '文章',
    url: 'https://mp.weixin.qq.com/s/nT2JsKnwBiup1imniCr2jA',
    type: 'article',
  },
  // 视频
  {
    id: 'video-overcooked',
    title: '云开发CloudBase：用AI开发一款分手厨房小游戏',
    description: 'Bilibili 视频教程',
    category: '视频教程',
    url: 'https://www.bilibili.com/video/BV1v5KAzwEf9/',
    type: 'video',
  },
  {
    id: 'video-software30',
    title: '软件3.0：AI 编程新时代的最佳拍档',
    description: '以开发微信小程序为例',
    category: '视频教程',
    url: 'https://www.bilibili.com/video/BV15gKdz1E5N/',
    type: 'video',
  },
  {
    id: 'video-resume',
    title: '用AiCoding 一人挑战全栈研发简历制作小程序',
    description: 'Bilibili 视频教程',
    category: '视频教程',
    url: 'https://www.bilibili.com/video/BV1D23Nz1Ec3/',
    type: 'video',
  },
  {
    id: 'video-business-card',
    title: '5分钟在本地创造一个程序员专属名片网站',
    description: 'Bilibili 视频教程',
    category: '视频教程',
    url: 'https://www.bilibili.com/video/BV19y3EzsEHQ/?vd_source=c8763f6ab9c7c6f7f760ad7ea9157011',
    type: 'video',
  },
  // 应用项目
  {
    id: 'project-resume',
    title: '简历助手小程序',
    description: 'GitCode 开源项目',
    category: '应用项目',
    url: 'https://gitcode.com/qq_33681891/resume_template',
    type: 'project',
  },
  {
    id: 'project-gomoku',
    title: '五子棋联机游戏',
    description: 'GitHub 开源项目',
    category: '应用项目',
    url: 'https://github.com/TencentCloudBase/awesome-cloudbase-examples/tree/master/web/gomoku-game',
    type: 'project',
  },
  {
    id: 'project-overcooked',
    title: '分手厨房联机游戏',
    description: 'GitHub 开源项目',
    category: '应用项目',
    url: 'https://github.com/TencentCloudBase/awesome-cloudbase-examples/tree/master/web/overcooked-game',
    type: 'project',
  },
  {
    id: 'project-ecommerce',
    title: '电商管理后台',
    description: 'GitHub 开源项目',
    category: '应用项目',
    url: 'https://github.com/TencentCloudBase/awesome-cloudbase-examples/tree/master/web/ecommerce-management-backend',
    type: 'project',
  },
  {
    id: 'project-video',
    title: '短视频小程序',
    description: 'GitHub 开源项目',
    category: '应用项目',
    url: 'https://github.com/TencentCloudBase/awesome-cloudbase-examples/tree/master/miniprogram/cloudbase-ai-video',
    type: 'project',
  },
  {
    id: 'project-dating',
    title: '约会小程序',
    description: 'GitHub 开源项目',
    category: '应用项目',
    url: 'https://github.com/TencentCloudBase/awesome-cloudbase-examples/tree/master/miniprogram/dating',
    type: 'project',
  },
];

const categoryLabels: Record<string, string> = {
  '文章': '文章',
  '视频教程': '视频教程',
  '应用项目': '应用项目',
};

const groupedTutorials = tutorials.reduce((acc, tutorial) => {
  if (!acc[tutorial.category]) {
    acc[tutorial.category] = [];
  }
  acc[tutorial.category].push(tutorial);
  return acc;
}, {} as Record<string, Tutorial[]>);

export default function TutorialsGrid() {
  return (
    <div className={styles.container}>
      {Object.entries(groupedTutorials).map(([category, items]) => (
        <div key={category} className={styles.category}>
          <h3 className={styles.categoryTitle}>{categoryLabels[category] || category}</h3>
          <div className={styles.grid}>
            {items.map((tutorial) => (
              <Link
                key={tutorial.id}
                to={tutorial.url}
                className={styles.card}
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className={styles.content}>
                  <div className={styles.header}>
                    <span className={styles.icon}>
                      {tutorial.type === 'article' && '📖'}
                      {tutorial.type === 'video' && '🎥'}
                      {tutorial.type === 'project' && '💻'}
                    </span>
                    <div className={styles.title}>{tutorial.title}</div>
                  </div>
                  <div className={styles.description}>{tutorial.description}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

