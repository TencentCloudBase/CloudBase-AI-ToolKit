import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { useLocation } from '@docusaurus/router';
import React, { useState, useMemo } from 'react';
import IDESelector from './IDESelector';
import styles from './ErrorCodeIDEButton.module.css';

// IDE list for icons (from IDESelector)
const POPULAR_IDES = [
  { id: 'cursor', iconSlug: 'cursor' },
  { id: 'codebuddy', iconUrl: 'https://codebuddy-1328495429.cos.accelerate.myqcloud.com/web/ide/logo.svg' },
  { id: 'github-copilot', iconUrl: 'https://code.visualstudio.com/favicon.ico' },
  { id: 'claude-code', iconSlug: 'claude' },
  { id: 'windsurf', iconSlug: 'windsurf' },
  { id: 'cline', iconSlug: 'cline' },
];

// Get icon URL helper (same as IDESelector)
const iconsWithColor = new Set(['claude', 'gemini', 'baidu', 'alibaba', 'qwen', 'bytedance', 'tencent']);

function getIconUrl(ide: { iconSlug?: string; iconUrl?: string }): string | null {
  if (ide.iconUrl) return ide.iconUrl;
  if (ide.iconSlug) {
    const baseUrl = 'https://img.jsdelivr.com/raw.githubusercontent.com/lobehub/lobe-icons/refs/heads/master/packages/static-png/light';
    if (iconsWithColor.has(ide.iconSlug)) {
      return `${baseUrl}/${ide.iconSlug}-color.png`;
    }
    return `${baseUrl}/${ide.iconSlug}.png`;
  }
  return null;
}

interface ErrorCodeIDEButtonProps {
  errorCode?: string;
  pageUrl?: string;
}

// i18n translations
const translations: Record<string, Record<string, string>> = {
  'zh-CN': {
    openInAI: '使用 AI 工具修复错误',
    troubleshoot: '故障排除',
    promptLabel: '提示词',
    copyPrompt: '复制提示词',
  },
  'en': {
    openInAI: 'Fix Error with AI Tool',
    troubleshoot: 'Troubleshoot',
    promptLabel: 'Prompt',
    copyPrompt: 'Copy prompt',
  },
};

// Generate prompt based on page URL (Chinese version)
function generatePrompt(pageUrl: string, locale: string): string {
  if (locale === 'zh-CN' || locale === 'zh-Hans' || locale.startsWith('zh')) {
    return `我遇到了一个错误，正在查看文档 ${pageUrl} 以了解发生了什么。

请帮助我解决这个问题：

1. **建议修复方案**：分析我的代码库上下文，提出需要更改什么来解决这个错误

2. **解释根本原因**：分析为什么会出现这个错误：
   - 代码实际在做什么 vs. 它需要做什么？
   - 什么条件触发了这个特定错误？
   - 是什么误解或疏忽导致了这个问题？

3. **教授概念**：帮助我理解底层原理：
   - 为什么这个错误存在，它保护我免受什么？
   - 这个概念的正确心智模型是什么？
   - 这如何融入更广泛的框架/语言设计？

4. **展示警告信号**：帮助我在未来识别这种模式：
   - 我应该注意什么可能导致这种情况再次发生？
   - 在相关场景中我可能犯哪些类似的错误？
   - 哪些代码异味或模式表明这个问题？

5. **讨论替代方案**：解释是否有不同的有效方法及其权衡

我的目标是修复眼前的问题，同时建立持久的理解，这样我就可以在未来独立避免和解决类似的错误。`;
  }
  
  return `I'm encountering an error and reviewing the docs at ${pageUrl} to understand what's happening.

Please help me resolve this by:

1. **Suggest the fix**: Analyze my codebase context and propose what needs to be changed to resolve this error

2. **Explain the root cause**: Break down why this error occurred:
   - What was the code actually doing vs. what it needed to do?
   - What conditions triggered this specific error?
   - What misconception or oversight led to this?

3. **Teach the concept**: Help me understand the underlying principle:
   - Why does this error exist and what is it protecting me from?
   - What's the correct mental model for this concept?
   - How does this fit into the broader framework/language design?

4. **Show warning signs**: Help me recognize this pattern in the future:
   - What should I look out for that might cause this again?
   - Are there similar mistakes I might make in related scenarios?
   - What code smells or patterns indicate this issue?

5. **Discuss alternatives**: Explain if there are different valid approaches and their trade-offs

My goal is to fix the immediate issue while building lasting understanding so I can avoid and resolve similar errors independently in the future.`;
}

export default function ErrorCodeIDEButton({
  errorCode,
  pageUrl,
}: ErrorCodeIDEButtonProps) {
  const { i18n, siteConfig } = useDocusaurusContext();
  const location = useLocation();
  const rawLocale = i18n.currentLocale || i18n.defaultLocale || 'zh-CN';
  // Normalize locale: zh-Hans -> zh-CN
  const locale = rawLocale === 'zh-Hans' ? 'zh-CN' : rawLocale;
  const t = translations[locale] || translations['zh-CN'];
  const isChinese = locale === 'zh-CN' || rawLocale.startsWith('zh');

  const [isExpanded, setIsExpanded] = useState(false);

  // Generate full page URL
  const fullPageUrl = useMemo(() => {
    if (pageUrl) return pageUrl;
    const baseUrl = siteConfig.url || '';
    const basePath = siteConfig.baseUrl || '/';
    const path = location.pathname;
    return `${baseUrl}${basePath === '/' ? '' : basePath}${path}`.replace(/\/$/, '');
  }, [pageUrl, siteConfig.url, siteConfig.baseUrl, location.pathname]);

  // Generate prompt
  const prompt = useMemo(() => generatePrompt(fullPageUrl, isChinese ? 'zh-CN' : 'en'), [fullPageUrl, isChinese]);

  return (
    <div className={styles.wrapper}>
      <div className={`${styles.container} ${!isExpanded ? styles.containerCollapsed : ''}`}>
        <div className={styles.content}>
          <div className={styles.headerContent}>
            <p className={styles.description}>
              {isChinese
                ? '我遇到了一个错误，正在查看文档以了解发生了什么。请帮助我解决这个问题。'
                : "I'm encountering an error and reviewing the docs to understand what's happening. Please help me resolve this."}
            </p>
            <a
              href="#"
              className={`${styles.button} ${isExpanded ? styles.buttonExpanded : ''}`}
              onClick={(e) => {
                e.preventDefault();
                setIsExpanded(!isExpanded);
              }}
            >
              <div className={styles.buttonLeft}>
                <div className={styles.ideIcons}>
                  {POPULAR_IDES.map((ide, index) => {
                    const iconUrl = getIconUrl(ide);
                    if (!iconUrl) return null;
                    return (
                      <img
                        key={ide.id}
                        src={iconUrl}
                        alt=""
                        className={styles.ideIcon}
                        style={{
                          marginLeft: index > 0 ? '-8px' : '0',
                          zIndex: POPULAR_IDES.length - index,
                        }}
                      />
                    );
                  })}
                </div>
                <span className={styles.buttonText}>{t.openInAI}</span>
              </div>
              <svg
                className={`${styles.buttonArrow} ${isExpanded ? styles.buttonArrowExpanded : ''}`}
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
              >
                <path
                  d="M3 4.5L6 7.5L9 4.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className={styles.expandedContent}>
          {/* IDE Selector with custom prompt */}
          <div className={styles.ideSelectorSection}>
            <IDESelector customPrompt={prompt} collapsibleInstallSteps={true} collapseStep1={true} />
          </div>
        </div>
      )}
    </div>
  );
}

