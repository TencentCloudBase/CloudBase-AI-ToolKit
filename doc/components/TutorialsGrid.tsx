import Link from '@docusaurus/Link';
import React from 'react';
import styles from './TutorialsGrid.module.css';

interface Tutorial {
  id: string;
  title: string;
  description: string;
  category: string;
  url: string;
  type: 'article' | 'video' | 'project';
  thumbnail?: string;
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
    id: 'video-bilibili-ai-assistant',
    title: '【教程】不写一行代码，开发B站热门选题AI助手 | 数据分析  | 爬虫',
    description: '熠辉IndieDev',
    category: '视频教程',
    url: 'https://www.bilibili.com/video/BV1JBmKBBEZa/?share_source=copy_web&vd_source=068decbd00a3d00ff8662b6a358e5e1e',
    type: 'video',
    thumbnail: 'https://7463-tcb-advanced-a656fc-1257967285.tcb.qcloud.la/video-thumbnails/BV1JBmKBBEZa.jpg',
  },
  {
    id: 'video-mbti-dating',
    title: '我用AI做了个MBTI交友网站：从写代码到部署上线，AI+MCP 全部自己搞定！简直离谱！',
    description: '御风大世界',
    category: '视频教程',
    url: 'https://www.bilibili.com/video/BV1QG3EzjEFZ/?share_source=copy_web&vd_source=068decbd00a3d00ff8662b6a358e5e1e',
    type: 'video',
    thumbnail: 'https://7463-tcb-advanced-a656fc-1257967285.tcb.qcloud.la/video-thumbnails/BV1QG3EzjEFZ.jpg',
  },
  {
    id: 'video-ai-try-on',
    title: 'AI编程：从0到1开发一个AI试衣小程序！免费分享 | 含源码',
    description: '熠辉IndieDev',
    category: '视频教程',
    url: 'https://www.bilibili.com/video/BV1NEsWzRE6U/?share_source=copy_web&vd_source=068decbd00a3d00ff8662b6a358e5e1e',
    type: 'video',
    thumbnail: 'https://7463-tcb-advanced-a656fc-1257967285.tcb.qcloud.la/video-thumbnails/BV1NEsWzRE6U.jpg',
  },
  {
    id: 'video-cursor-cloudbase',
    title: 'Cursor教学视频08：Cursor+Cloudbase MCP，10分钟完成带后端的全栈应用开发',
    description: 'AI进化论-花生',
    category: '视频教程',
    url: 'https://www.bilibili.com/video/BV1TXuVzoE9p/?vd_source=c8763f6ab9c7c6f7f760ad7ea9157011',
    type: 'video',
    thumbnail: 'https://7463-tcb-advanced-a656fc-1257967285.tcb.qcloud.la/video-thumbnails/BV1TXuVzoE9p.jpg',
  },
  {
    id: 'video-english-learning',
    title: '【新手向】 从 0 到 1构建一个可视化的 AI 英语学习应用',
    description: '吕立青_JimmyLv',
    category: '视频教程',
    url: 'https://www.bilibili.com/video/BV1SK2xBTE2M/?share_source=copy_web&vd_source=068decbd00a3d00ff8662b6a358e5e1e',
    type: 'video',
    thumbnail: 'https://7463-tcb-advanced-a656fc-1257967285.tcb.qcloud.la/video-thumbnails/BV1SK2xBTE2M.jpg',
  },
  {
    id: 'video-ecommerce',
    title: '单挑整个电商项目？AI 能代替程序员了吗',
    description: '吴悠讲编程',
    category: '视频教程',
    url: 'https://www.bilibili.com/video/BV1QzSYBBEBe/?share_source=copy_web&vd_source=068decbd00a3d00ff8662b6a358e5e1e',
    type: 'video',
    thumbnail: 'https://7463-tcb-advanced-a656fc-1257967285.tcb.qcloud.la/video-thumbnails/BV1QzSYBBEBe.jpg',
  },
  {
    id: 'video-miniprogram-basics',
    title: '零基础入门AI小程序开发教程',
    description: '野码AI',
    category: '视频教程',
    url: 'https://www.bilibili.com/video/BV123SyB4Ekt/?share_source=copy_web&vd_source=068decbd00a3d00ff8662b6a358e5e1e',
    type: 'video',
    thumbnail: 'https://7463-tcb-advanced-a656fc-1257967285.tcb.qcloud.la/video-thumbnails/BV123SyB4Ekt.jpg',
  },
  {
    id: 'video-software30',
    title: '软件3.0：AI 编程新时代的最佳拍档 CloudBase AI ToolKit，以开发微信小程序为例',
    description: '吕立青_JimmyLv',
    category: '视频教程',
    url: 'https://www.bilibili.com/video/BV15gKdz1E5N/?share_source=copy_web',
    type: 'video',
    thumbnail: 'https://7463-tcb-advanced-a656fc-1257967285.tcb.qcloud.la/video-thumbnails/BV15gKdz1E5N.jpg',
  },
  {
    id: 'video-overcooked',
    title: '云开发CloudBase：用AI开发一款分手厨房小游戏',
    description: '腾讯云云开发',
    category: '视频教程',
    url: 'https://www.bilibili.com/video/BV1v5KAzwEf9/',
    type: 'video',
    thumbnail: 'https://7463-tcb-advanced-a656fc-1257967285.tcb.qcloud.la/video-thumbnails/BV1v5KAzwEf9.jpg',
  },
  {
    id: 'video-resume',
    title: '用AiCoding 一人挑战全栈研发简历制作小程序',
    description: '全栈若城',
    category: '视频教程',
    url: 'https://www.bilibili.com/video/BV1D23Nz1Ec3/',
    type: 'video',
    thumbnail: 'https://7463-tcb-advanced-a656fc-1257967285.tcb.qcloud.la/video-thumbnails/BV1D23Nz1Ec3.jpg',
  },
  {
    id: 'video-business-card',
    title: '5分钟在本地创造一个程序员专属名片网站',
    description: 'LucianaiB',
    category: '视频教程',
    url: 'https://www.bilibili.com/video/BV19y3EzsEHQ/?vd_source=c8763f6ab9c7c6f7f760ad7ea9157011',
    type: 'video',
    thumbnail: 'https://7463-tcb-advanced-a656fc-1257967285.tcb.qcloud.la/video-thumbnails/BV19y3EzsEHQ.jpg',
  },
  {
    id: 'video-codebuddy-miniprogram',
    title: '实战教程：通过codeBuddy +cloudBase 开发上线一款微信小程序！你也可以！',
    description: '空菜',
    category: '视频教程',
    url: 'https://www.bilibili.com/video/BV1NEbjzjEeZ/?share_source=copy_web&vd_source=068decbd00a3d00ff8662b6a358e5e1e',
    type: 'video',
    thumbnail: 'https://7463-tcb-advanced-a656fc-1257967285.tcb.qcloud.la/video-thumbnails/BV1NEbjzjEeZ.jpg',
  },
  {
    id: 'video-codebuddy-backend',
    title: 'CodeBuddyIDE 搭配 CloudBase完成小程序后台管理系统快速搭建',
    description: '全栈若城',
    category: '视频教程',
    url: 'https://www.bilibili.com/video/BV13C8nzzEoq/?share_source=copy_web&vd_source=068decbd00a3d00ff8662b6a358e5e1e',
    type: 'video',
    thumbnail: 'https://7463-tcb-advanced-a656fc-1257967285.tcb.qcloud.la/video-thumbnails/BV13C8nzzEoq.jpg',
  },
  {
    id: 'video-cloudbase-deploy',
    title: '女大学生教你不买服务器，一秒把网站弄上线！0-1开发｜小白教程｜腾讯云CloudBase',
    description: '冰激凌奶茶雪糕子',
    category: '视频教程',
    url: 'https://www.bilibili.com/video/BV1LQpBzrEb2/?share_source=copy_web&vd_source=068decbd00a3d00ff8662b6a358e5e1e',
    type: 'video',
    thumbnail: 'https://7463-tcb-advanced-a656fc-1257967285.tcb.qcloud.la/video-thumbnails/BV1LQpBzrEb2.jpg',
  },
  {
    id: 'video-xiaohe-architecture',
    title: '腾讯 CodeBuddy IDE × CloudBase 云开发实战：从零上线「小禾建筑AI智能平台」',
    description: 'AI创业进行时',
    category: '视频教程',
    url: 'https://www.bilibili.com/video/BV1DWbwz1EBU/?share_source=copy_web&vd_source=068decbd00a3d00ff8662b6a358e5e1e',
    type: 'video',
    thumbnail: 'https://7463-tcb-advanced-a656fc-1257967285.tcb.qcloud.la/video-thumbnails/BV1DWbwz1EBU.jpg',
  },
  {
    id: 'video-cursor-miniprogram',
    title: '【小白教程】手把手教你用Cursor+微信云开发做个小程序 | 小白 AI 编程 | 零基础',
    description: '熠辉IndieDev',
    category: '视频教程',
    url: 'https://www.bilibili.com/video/BV1jx5kziEqz/?share_source=copy_web&vd_source=068decbd00a3d00ff8662b6a358e5e1e',
    type: 'video',
    thumbnail: 'https://7463-tcb-advanced-a656fc-1257967285.tcb.qcloud.la/video-thumbnails/BV1jx5kziEqz.jpg',
  },
  {
    id: 'video-podcast-tool',
    title: '零基础用codebuddy+CloudBase AI做播客推荐工具，我悟了："不必要的功能不加"',
    description: '马腾漫步',
    category: '视频教程',
    url: 'https://www.bilibili.com/video/BV1fb8XzMEDk/?share_source=copy_web&vd_source=068decbd00a3d00ff8662b6a358e5e1e',
    type: 'video',
    thumbnail: 'https://7463-tcb-advanced-a656fc-1257967285.tcb.qcloud.la/video-thumbnails/BV1fb8XzMEDk.jpg',
  },
  {
    id: 'video-breakfast-shop',
    title: '沉浸式体验，从零用AI开发微信小游戏《我的早餐店》：CloudBase AI Toolkit教程',
    description: 'Lion_Long',
    category: '视频教程',
    url: 'https://www.bilibili.com/video/BV12J3XzzE67/?share_source=copy_web&vd_source=068decbd00a3d00ff8662b6a358e5e1e',
    type: 'video',
    thumbnail: 'https://7463-tcb-advanced-a656fc-1257967285.tcb.qcloud.la/video-thumbnails/BV12J3XzzE67.jpg',
  },
  {
    id: 'video-jixian-huiche',
    title: '极限惠车 - 停车充电优惠平台-基于CodeBuddy+云开发 + CloudBase AI ToolKit 构建的项目',
    description: 'vellzhao',
    category: '视频教程',
    url: 'https://www.bilibili.com/video/BV1TCYyzBEAC/?share_source=copy_web&vd_source=068decbd00a3d00ff8662b6a358e5e1e',
    type: 'video',
    thumbnail: 'https://7463-tcb-advanced-a656fc-1257967285.tcb.qcloud.la/video-thumbnails/BV1TCYyzBEAC.jpg',
  },
  {
    id: 'video-boss-miniprogram',
    title: '老板让我1小时建好公司小程序…',
    description: '三太子敖丙',
    category: '视频教程',
    url: 'https://www.bilibili.com/video/BV1hX3DzuExZ/?share_source=copy_web&vd_source=068decbd00a3d00ff8662b6a358e5e1e',
    type: 'video',
    thumbnail: 'https://7463-tcb-advanced-a656fc-1257967285.tcb.qcloud.la/video-thumbnails/BV1hX3DzuExZ.jpg',
  },
  {
    id: 'video-codebuddy-game',
    title: '用 CodeBuddy+CloudBase，轻松开发个性化游戏',
    description: '全栈若城',
    category: '视频教程',
    url: 'https://www.bilibili.com/video/BV1hpbsz1E7m/?share_source=copy_web&vd_source=068decbd00a3d00ff8662b6a358e5e1e',
    type: 'video',
    thumbnail: 'https://7463-tcb-advanced-a656fc-1257967285.tcb.qcloud.la/video-thumbnails/BV1hpbsz1E7m.jpg',
  },
  {
    id: 'video-codebuddy-zero-coding',
    title: '使用CodeBuddy从0-1零编程打造一款微信小程序（附体验二维码）',
    description: '蓝镜空间',
    category: '视频教程',
    url: 'https://www.bilibili.com/video/BV1mNY2z3ESU/?share_source=copy_web&vd_source=068decbd00a3d00ff8662b6a358e5e1e',
    type: 'video',
    thumbnail: 'https://7463-tcb-advanced-a656fc-1257967285.tcb.qcloud.la/video-thumbnails/BV1mNY2z3ESU.jpg',
  },
  {
    id: 'video-hospital-scheduling-saas',
    title: 'AI做的医院实习生排班SAAS系统',
    description: '采云小程序',
    category: '视频教程',
    url: 'https://www.bilibili.com/video/BV1SYYkziEy9/?share_source=copy_web&vd_source=068decbd00a3d00ff8662b6a358e5e1e',
    type: 'video',
    thumbnail: 'https://7463-tcb-advanced-a656fc-1257967285.tcb.qcloud.la/video-thumbnails/BV1SYYkziEy9.jpg',
  },
  {
    id: 'video-big-eye-notes',
    title: 'Codebuddy*Cloudbase AI大眼萌笔记工具及开发过程介绍',
    description: 'AI大眼萌',
    category: '视频教程',
    url: 'https://www.bilibili.com/video/BV1B6b8zBEWT/?share_source=copy_web&vd_source=068decbd00a3d00ff8662b6a358e5e1e',
    type: 'video',
    thumbnail: 'https://7463-tcb-advanced-a656fc-1257967285.tcb.qcloud.la/video-thumbnails/BV1B6b8zBEWT.jpg',
  },
  {
    id: 'video-cursor-gomoku',
    title: '【直播回放】Cursor+云开发，开发双人五子棋对战小游戏',
    description: '腾讯云云开发',
    category: '视频教程',
    url: 'https://www.bilibili.com/video/BV1uE3uzHEou/?share_source=copy_web&vd_source=068decbd00a3d00ff8662b6a358e5e1e',
    type: 'video',
    thumbnail: 'https://7463-tcb-advanced-a656fc-1257967285.tcb.qcloud.la/video-thumbnails/BV1uE3uzHEou.jpg',
  },
  {
    id: 'video-one-person-company',
    title: '一人公司不是梦！1小时开发全栈应用【含完整前后端】',
    description: 'AI进化论-花生',
    category: '视频教程',
    url: 'https://www.bilibili.com/video/BV1Rp37zDESt/?share_source=copy_web&vd_source=068decbd00a3d00ff8662b6a358e5e1e',
    type: 'video',
    thumbnail: 'https://7463-tcb-advanced-a656fc-1257967285.tcb.qcloud.la/video-thumbnails/BV1Rp37zDESt.jpg',
  },
  {
    id: 'video-wechat-sport',
    title: '云开发Cloudbase AI Toolkit + Cursor开发演示：用AI开发一个支持微信运动的小程序',
    description: '腾讯云云开发',
    category: '视频教程',
    url: 'https://www.bilibili.com/video/BV1hpjvzGESg/?share_source=copy_web&vd_source=068decbd00a3d00ff8662b6a358e5e1e',
    type: 'video',
    thumbnail: 'https://7463-tcb-advanced-a656fc-1257967285.tcb.qcloud.la/video-thumbnails/BV1hpjvzGESg.jpg',
  },
  {
    id: 'video-finance-assistant',
    title: '腾讯云CodeBuddy IDE+CloudBase AI ToolKit打造理财小助手网页',
    description: 'irpickstars',
    category: '视频教程',
    url: 'https://www.bilibili.com/video/BV1o1bXzYEm9/?share_source=copy_web&vd_source=068decbd00a3d00ff8662b6a358e5e1e',
    type: 'video',
    thumbnail: 'https://7463-tcb-advanced-a656fc-1257967285.tcb.qcloud.la/video-thumbnails/BV1o1bXzYEm9.jpg',
  },
  {
    id: 'video-codebuddy-international',
    title: 'CodeBuddy IDE国际版试用体验，让开发小程序的门槛再次降低！',
    description: '嘉锅实验室',
    category: '视频教程',
    url: 'https://www.bilibili.com/video/BV1YReMz7EKn/?share_source=copy_web&vd_source=068decbd00a3d00ff8662b6a358e5e1e',
    type: 'video',
    thumbnail: 'https://7463-tcb-advanced-a656fc-1257967285.tcb.qcloud.la/video-thumbnails/BV1YReMz7EKn.jpg',
  },
  {
    id: 'video-ai-programming-deploy',
    title: 'AI编程，一键部署',
    description: '腾讯云云开发',
    category: '视频教程',
    url: 'https://www.bilibili.com/video/BV1Honwz1E64/?share_source=copy_web&vd_source=068decbd00a3d00ff8662b6a358e5e1e',
    type: 'video',
    thumbnail: 'https://7463-tcb-advanced-a656fc-1257967285.tcb.qcloud.la/video-thumbnails/BV1Honwz1E64.jpg',
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
  // Separate videos with thumbnails from others
  const videoCategory = groupedTutorials['视频教程'] || [];
  const videosWithThumbnails = videoCategory.filter(v => v.thumbnail);
  const videosWithoutThumbnails = videoCategory.filter(v => !v.thumbnail);
  const otherCategories = Object.entries(groupedTutorials).filter(([cat]) => cat !== '视频教程');

  return (
    <div className={styles.container}>
      {/* Videos with thumbnails - displayed first */}
      {videosWithThumbnails.length > 0 && (
        <div className={styles.category}>
          <h3 className={styles.categoryTitle}>{categoryLabels['视频教程'] || '视频教程'}</h3>
          <div className={styles.videoGrid}>
            {videosWithThumbnails.map((tutorial) => (
              <Link
                key={tutorial.id}
                to={tutorial.url}
                className={styles.videoCard}
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className={styles.thumbnailWrapper}>
                  <img 
                    src={tutorial.thumbnail} 
                    alt={tutorial.title}
                    className={styles.thumbnail}
                    loading="lazy"
                  />
                  <div className={styles.playIcon}>▶</div>
                </div>
                <div className={styles.videoContent}>
                  <div className={styles.videoTitle}>{tutorial.title}</div>
                  <div className={styles.videoDescription}>{tutorial.description}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Videos without thumbnails */}
      {videosWithoutThumbnails.length > 0 && (
        <div className={styles.category}>
          {videosWithThumbnails.length === 0 && (
            <h3 className={styles.categoryTitle}>{categoryLabels['视频教程'] || '视频教程'}</h3>
          )}
          <div className={styles.grid}>
            {videosWithoutThumbnails.map((tutorial) => (
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
      )}

      {/* Other categories */}
      {otherCategories.map(([category, items]) => (
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

