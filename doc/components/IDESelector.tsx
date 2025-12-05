import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './IDESelector.module.css';

interface IDE {
  id: string;
  name: string;
  platform: string;
  configPath: string;
  configExample: string;
  iconSlug?: string;
  iconUrl?: string;
  docUrl?: string;
  oneClickInstallUrl?: string;
  oneClickInstallImage?: string;
  supportsProjectMCP?: boolean;
  cliCommand?: string;
  cliConfigExample?: string;
  alternativeConfig?: string;
  verificationPrompt?: string;
  installCommand?: string;
  installCommandDocs?: string;
  useCommandInsteadOfConfig?: boolean;
}

const IDES: IDE[] = [
  {
    id: 'cursor',
    name: 'Cursor',
    platform: '独立 IDE',
    configPath: '.cursor/mcp.json',
    iconSlug: 'cursor',
    docUrl: 'https://docs.cursor.com/context/model-context-protocol#configuration-locations',
    supportsProjectMCP: true,
    oneClickInstallImage: 'https://cursor.com/deeplink/mcp-install-dark.svg',
    verificationPrompt: '检查 CloudBase 工具是否可用, 下载 CloudBase AI 开发规则',
    configExample: `{
  "mcpServers": {
    "cloudbase": {
      "command": "npx",
      "args": ["@cloudbase/cloudbase-mcp@latest"],
      "env": {
        "INTEGRATION_IDE": "Cursor"
      }
    }
  }
}`,
  },
  {
    id: 'claude-code',
    name: 'Claude Code',
    platform: '命令行工具',
    configPath: '.mcp.json',
    iconSlug: 'claude',
    docUrl: 'https://docs.anthropic.com/en/docs/claude-code/mcp#project-scope',
    supportsProjectMCP: true,
    cliCommand: 'claude mcp add --scope project --transport http cloudbase "npx @cloudbase/cloudbase-mcp@latest"',
    alternativeConfig: 'Alternatively, add this configuration to .mcp.json:',
    verificationPrompt: '检查 CloudBase 工具是否可用, 下载 CloudBase AI 开发规则',
    configExample: `{
  "mcpServers": {
    "cloudbase": {
      "command": "npx",
      "args": ["@cloudbase/cloudbase-mcp@latest"],
      "env": {
        "INTEGRATION_IDE": "ClaudeCode"
      }
    }
  }
}`,
  },
  {
    id: 'windsurf',
    name: 'WindSurf',
    platform: '独立 IDE',
    configPath: '.windsurf/mcp.json',
    iconSlug: 'windsurf',
    docUrl: 'https://docs.windsurf.com/windsurf/cascade/memories',
    supportsProjectMCP: true,
    verificationPrompt: '检查 CloudBase 工具是否可用, 下载 CloudBase AI 开发规则',
    configExample: `{
  "mcpServers": {
    "cloudbase": {
      "command": "npx",
      "args": ["@cloudbase/cloudbase-mcp@latest"],
      "env": {
        "INTEGRATION_IDE": "WindSurf"
      }
    }
  }
}`,
  },
  {
    id: 'codebuddy',
    name: 'CodeBuddy',
    platform: 'VS Code、JetBrains、微信开发者工具',
    configPath: '.codebuddy/mcp.json',
    iconUrl: 'https://codebuddy-1328495429.cos.accelerate.myqcloud.com/web/ide/logo.svg',
    supportsProjectMCP: true,
    verificationPrompt: '检查 CloudBase 工具是否可用, 下载 CloudBase AI 开发规则',
    configExample: `{
  "mcpServers": {
    "cloudbase": {
      "command": "npx",
      "args": ["@cloudbase/cloudbase-mcp@latest"],
      "env": {
        "INTEGRATION_IDE": "CodeBuddyManual"
      }
    }
  }
}`,
  },
  {
    id: 'github-copilot',
    name: 'VSCode',
    platform: 'VS Code 插件',
    configPath: '.vscode/mcp.json',
    iconUrl: 'https://code.visualstudio.com/favicon.ico',
    docUrl: 'https://code.visualstudio.com/docs/copilot/chat/mcp-servers',
    supportsProjectMCP: true,
    verificationPrompt: '检查 CloudBase 工具是否可用, 下载 CloudBase AI 开发规则',
    configExample: `{
  "servers": {
    "cloudbase": {
      "command": "npx",
      "args": ["@cloudbase/cloudbase-mcp@latest"],
      "env": {
        "INTEGRATION_IDE": "VSCode"
      }
    }
  }
}`,
  },
  {
    id: 'cline',
    name: 'Cline',
    platform: 'VS Code 插件',
    configPath: '.cline/mcp.json',
    iconSlug: 'cline',
    docUrl: 'https://docs.cline.bot/mcp/configuring-mcp-servers',
    configExample: `{
  "mcpServers": {
    "cloudbase": {
      "autoApprove": [],
      "timeout": 60,
      "command": "npx",
      "args": ["@cloudbase/cloudbase-mcp@latest"],
      "env": {
        "INTEGRATION_IDE": "Cline"
      },
      "transportType": "stdio",
      "disabled": false
    }
  }
}`,
  },
  {
    id: 'trae',
    name: 'Trae',
    platform: '独立 IDE',
    configPath: '.trae/mcp.json',
    iconUrl: 'https://lf-cdn.trae.ai/obj/trae-ai-sg/trae_website_prod/favicon.png',
    configExample: `{
  "mcpServers": {
    "cloudbase": {
      "command": "npx",
      "args": ["@cloudbase/cloudbase-mcp@latest"],
      "env": {
        "INTEGRATION_IDE": "Trae"
      }
    }
  }
}`,
  },
  {
    id: 'tongyi-lingma',
    name: '通义灵码',
    platform: 'VS Code、JetBrains 插件',
    configPath: '.tongyi-lingma/mcp.json',
    iconUrl: 'https://img.alicdn.com/imgextra/i1/O1CN01BN6Jtc1lCfJNviV7H_!!6000000004783-2-tps-134-133.png',
    docUrl: 'https://help.aliyun.com/zh/lingma/user-guide/guide-for-using-mcp',
    configExample: `{
  "mcpServers": {
    "cloudbase": {
      "command": "npx",
      "args": ["@cloudbase/cloudbase-mcp@latest"],
      "env": {
        "INTEGRATION_IDE": "LingMa"
      }
    }
  }
}`,
  },
  {
    id: 'baidu-comate',
    name: '文心快码',
    platform: 'VS Code、JetBrains 插件',
    configPath: '.baidu-comate/mcp.json',
    iconUrl: 'https://comate.baidu.com/images/favicon.ico',
    docUrl: 'https://cloud.baidu.com/doc/COMATE/s/km9l4bzwt',
    configExample: `{
  "mcpServers": {
    "cloudbase": {
      "command": "npx",
      "args": ["@cloudbase/cloudbase-mcp@latest"],
      "env": {
        "INTEGRATION_IDE": "Comate"
      }
    }
  }
}`,
  },
  {
    id: 'gemini-cli',
    name: 'Gemini CLI',
    platform: '命令行工具',
    configPath: '.gemini/settings.json',
    iconSlug: 'gemini',
    docUrl: 'https://ai.google.dev/gemini-api/docs',
    configExample: `{
  "mcpServers": {
    "cloudbase": {
      "command": "npx",
      "args": ["@cloudbase/cloudbase-mcp@latest"],
      "env": {
        "INTEGRATION_IDE": "Gemini"
      }
    }
  }
}`,
  },
  {
    id: 'openai-codex-cli',
    name: 'OpenAI Codex CLI',
    platform: '命令行工具',
    configPath: '.openai-codex/mcp.json',
    iconSlug: 'openai',
    useCommandInsteadOfConfig: true,
    installCommand: 'codex mcp add cloudbase --env INTEGRATION_IDE=CodeX -- cloudbase-mcp',
    installCommandDocs: '根据运行系统在终端中运行指令：\n\n**MacOS, Linux, WSL:**\n```bash\ncodex mcp add cloudbase --env INTEGRATION_IDE=CodeX -- cloudbase-mcp\n```\n\n**Windows Powershell:**\n```bash\ncodex mcp add cloudbase --env INTEGRATION_IDE=CodeX -- cmd /c cloudbase-mcp\n```',
    verificationPrompt: '检查 CloudBase 工具是否可用, 下载 CloudBase AI 开发规则',
    configExample: `{
  "mcpServers": {
    "cloudbase": {
      "command": "npx",
      "args": ["@cloudbase/cloudbase-mcp@latest"],
      "env": {
        "INTEGRATION_IDE": "OpenAI Codex CLI"
      }
    }
  }
}`,
  },
  {
    id: 'qwen-code',
    name: 'Qwen Code',
    platform: '命令行工具',
    configPath: '.qwen/settings.json',
    iconSlug: 'qwen',
    configExample: `{
  "mcpServers": {
    "cloudbase": {
      "command": "npx",
      "args": ["@cloudbase/cloudbase-mcp@latest"],
      "env": {
        "INTEGRATION_IDE": "Qwen"
      }
    }
  }
}`,
  },
  {
    id: 'roocode',
    name: 'RooCode',
    platform: 'VS Code 插件',
    configPath: '.roocode/mcp.json',
    iconUrl: 'https://docs.roocode.com/img/favicon.ico',
    docUrl: 'https://docs.roocode.com/features/mcp/using-mcp-in-roo',
    configExample: `{
  "mcpServers": {
    "cloudbase": {
      "command": "npx",
      "args": ["@cloudbase/cloudbase-mcp@latest"],
      "disabled": false,
      "env": {
        "INTEGRATION_IDE": "RooCode"
      }
    }
  }
}`,
  },
  {
    id: 'augment-code',
    name: 'Augment Code',
    platform: 'VS Code、JetBrains 插件',
    configPath: '.vscode/settings.json',
    iconUrl: 'https://www.augmentcode.com/favicon.svg',
    docUrl: 'https://docs.augmentcode.com/setup-augment/mcp',
    configExample: `{
  "mcpServers": {
    "cloudbase": {
      "command": "npx",
      "args": ["@cloudbase/cloudbase-mcp@latest"],
      "env": {
        "INTEGRATION_IDE": "Augment"
      }
    }
  }
}`,
  },
  {
    id: 'opencode',
    name: 'OpenCode',
    platform: '命令行工具',
    configPath: '.opencode.json',
    iconUrl: 'https://avatars.githubusercontent.com/u/66570915?s=200&v=4',
    configExample: `{
  "mcpServers": {
    "cloudbase": {
      "command": "npx",
      "args": ["@cloudbase/cloudbase-mcp@latest"],
      "env": {
        "INTEGRATION_IDE": "OpenCode"
      }
    }
  }
}`,
  },
];

// JSON syntax highlighter
function highlightJSON(json: string): React.ReactNode[] {
  const lines = json.split('\n');
  return lines.map((line, lineIndex) => {
    const parts: React.ReactNode[] = [];
    let remaining = line;
    let keyIndex = 0;

    // Match patterns in order
    while (remaining.length > 0) {
      // String key (before colon)
      const keyMatch = remaining.match(/^(\s*)("[\w-]+")(:\s*)/);
      if (keyMatch) {
        if (keyMatch[1]) parts.push(keyMatch[1]);
        parts.push(<span key={`key-${lineIndex}-${keyIndex++}`} className={styles.jsonKey}>{keyMatch[2]}</span>);
        parts.push(keyMatch[3]);
        remaining = remaining.slice(keyMatch[0].length);
        continue;
      }

      // String value
      const stringMatch = remaining.match(/^("(?:[^"\\]|\\.)*")/);
      if (stringMatch) {
        parts.push(<span key={`str-${lineIndex}-${keyIndex++}`} className={styles.jsonString}>{stringMatch[1]}</span>);
        remaining = remaining.slice(stringMatch[0].length);
        continue;
      }

      // Brackets, braces, etc.
      const bracketMatch = remaining.match(/^([\[\]{}:,])/);
      if (bracketMatch) {
        parts.push(<span key={`br-${lineIndex}-${keyIndex++}`} className={styles.jsonBracket}>{bracketMatch[1]}</span>);
        remaining = remaining.slice(1);
        continue;
      }

      // Whitespace or other
      parts.push(remaining[0]);
      remaining = remaining.slice(1);
    }

    return (
      <div key={lineIndex} className={styles.codeLine}>
        <span className={styles.lineNumber}>{lineIndex + 1}</span>
        <span className={styles.lineContent}>{parts}</span>
      </div>
    );
  });
}

interface IDESelectorProps {
  defaultIDE?: string;
  showInstallButton?: boolean;
}

// i18n translations
const translations: Record<string, Record<string, string>> = {
  'zh-CN': {
    client: 'Client',
    configureDescription: '配置你的 MCP 客户端以连接 CloudBase 环境',
    installation: '步骤 1：安装',
    useTemplate: '使用项目模板（推荐）',
    templateDescription: '模板已内置 MCP 配置和 AI 规则',
    viewTemplates: '查看模板',
    oneClickInstall: '一键安装',
    orManualConfig: '或手动配置',
    orAddConfig: '或者将以下配置添加到',
    step2Verify: '步骤 2：验证连接',
    verifyDescription: '配置完成后，在 AI 对话中输入以下内容验证',
    defaultVerifyPrompt: '检查 CloudBase 工具是否可用, 下载 CloudBase AI 开发规则',
    cliCommand: 'CLI 命令',
    alternativeConfig: '替代配置',
    needHelp: '需要帮助？',
    viewDocs: '查看',
    docs: '文档',
    searchPlaceholder: '搜索...',
    noResults: '未找到匹配的 IDE',
    copyCode: '复制代码',
    copyPrompt: '复制提示词',
  },
  'en': {
    client: 'Client',
    configureDescription: 'Configure your MCP client to connect with your CloudBase environment',
    installation: 'Step 1: Installation',
    useTemplate: 'Use project template (recommended)',
    templateDescription: 'Template includes MCP configuration and AI rules',
    viewTemplates: 'View templates',
    oneClickInstall: 'Install in one click',
    orManualConfig: 'Or manual configuration',
    orAddConfig: 'Or add this configuration to',
    step2Verify: 'Step 2: Verify connection',
    verifyDescription: 'After configuration, enter the following in your AI chat to verify',
    defaultVerifyPrompt: 'Check if CloudBase tools are available, download CloudBase AI development rules',
    cliCommand: 'CLI command',
    alternativeConfig: 'Alternative configuration',
    needHelp: 'Need help?',
    viewDocs: 'View',
    docs: 'docs',
    searchPlaceholder: 'Search...',
    noResults: 'No matching IDE found',
    copyCode: 'Copy code',
    copyPrompt: 'Copy prompt',
  },
};

export default function IDESelector({ 
  defaultIDE,
  showInstallButton = true 
}: IDESelectorProps) {
  const { i18n } = useDocusaurusContext();
  const locale = i18n.currentLocale || i18n.defaultLocale || 'zh-CN';
  const t = translations[locale] || translations['zh-CN'];

  const [selectedIDE, setSelectedIDE] = useState<string>(defaultIDE || 'cursor');
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const ide = IDES.find(i => i.id === selectedIDE) || IDES[0];

  const filteredIDES = useMemo(() => {
    if (!searchQuery) return IDES;
    const query = searchQuery.toLowerCase();
    return IDES.filter(ide => 
      ide.name.toLowerCase().includes(query) || 
      ide.platform.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Icons that have -color version
  const iconsWithColor = new Set(['claude', 'gemini', 'baidu', 'alibaba', 'qwen', 'bytedance', 'tencent']);
  
  const getIconUrl = (ide: IDE) => {
    if (ide.iconUrl) return ide.iconUrl;
    if (ide.iconSlug) {
      const baseUrl = 'https://img.jsdelivr.com/raw.githubusercontent.com/lobehub/lobe-icons/refs/heads/master/packages/static-png/light';
      if (iconsWithColor.has(ide.iconSlug)) {
        return `${baseUrl}/${ide.iconSlug}-color.png`;
      }
      return `${baseUrl}/${ide.iconSlug}.png`;
    }
    return null;
  };

  // Generate Cursor one-click install URL
  const generateCursorInstallUrl = (ideConfig: IDE): string => {
    const config = {
      env: {
        INTEGRATION_IDE: ideConfig.name
      },
      command: 'npx',
      args: ['@cloudbase/cloudbase-mcp@latest']
    };
    const base64Config = btoa(JSON.stringify(config));
    return `https://cursor.com/en-US/install-mcp?name=cloudbase&config=${encodeURIComponent(base64Config)}`;
  };

  // Generate VSCode one-click install URL
  const generateVSCodeInstallUrl = (ideConfig: IDE): string => {
    const config = {
      name: 'cloudbase',
      command: 'npx',
      args: ['@cloudbase/cloudbase-mcp@latest'],
      env: {
        INTEGRATION_IDE: ideConfig.name
      }
    };
    const configJson = JSON.stringify(config);
    return `vscode:mcp/install?${encodeURIComponent(configJson)}`;
  };

  const getOneClickInstallUrl = (): string | null => {
    if (ide.id === 'cursor') {
      return generateCursorInstallUrl(ide);
    }
    if (ide.id === 'github-copilot') {
      return generateVSCodeInstallUrl(ide);
    }
    return ide.oneClickInstallUrl || null;
  };

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(ide.configExample);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedCli, setCopiedCli] = useState(false);

  const handleCopyPrompt = async () => {
    const prompt = ide.verificationPrompt || t.defaultVerifyPrompt;
    await navigator.clipboard.writeText(prompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleCopyCli = async () => {
    if (ide.cliCommand) {
      await navigator.clipboard.writeText(ide.cliCommand);
      setCopiedCli(true);
      setTimeout(() => setCopiedCli(false), 2000);
    }
  };

  const handleSelectIDE = (ideId: string) => {
    setSelectedIDE(ideId);
    setIsOpen(false);
    setSearchQuery('');
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;
    
    const currentIndex = filteredIDES.findIndex(i => i.id === selectedIDE);
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (currentIndex < filteredIDES.length - 1) {
          setSelectedIDE(filteredIDES[currentIndex + 1].id);
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (currentIndex > 0) {
          setSelectedIDE(filteredIDES[currentIndex - 1].id);
        }
        break;
      case 'Enter':
        e.preventDefault();
        setIsOpen(false);
        setSearchQuery('');
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchQuery('');
        break;
    }
  };

  return (
    <div className={styles.container}>
      {/* Header with Client label and IDE selector */}
      <div className={styles.header}>
        <span className={styles.clientLabel}>{t.client}</span>
        <div className={styles.dropdownWrapper} ref={dropdownRef}>
          <button
            className={`${styles.dropdownTrigger} ${isOpen ? styles.dropdownTriggerOpen : ''}`}
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            aria-haspopup="listbox"
          >
            {getIconUrl(ide) && (
              <img
                src={getIconUrl(ide)!}
                alt=""
                className={styles.triggerIcon}
              />
            )}
            <span className={styles.triggerText}>{ide.name}</span>
            <svg 
              className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
              width="12" 
              height="12" 
              viewBox="0 0 12 12"
              fill="none"
            >
              <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {isOpen && (
            <div className={styles.dropdown} role="listbox">
              <div className={styles.searchWrapper}>
                <svg className={styles.searchIcon} width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M6.5 11C9.26142 11 11.5 8.76142 11.5 6C11.5 3.23858 9.26142 1 6.5 1C3.73858 1 1.5 3.23858 1.5 6C1.5 8.76142 3.73858 11 6.5 11Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12.5 12L10 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <input
                  ref={searchInputRef}
                  type="text"
                  className={styles.searchInput}
                  placeholder={t.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </div>
              <div className={styles.dropdownList}>
                {filteredIDES.map((item) => (
                  <button
                    key={item.id}
                    className={`${styles.dropdownItem} ${item.id === selectedIDE ? styles.dropdownItemSelected : ''}`}
                    onClick={() => handleSelectIDE(item.id)}
                    role="option"
                    aria-selected={item.id === selectedIDE}
                  >
                    {getIconUrl(item) && (
                      <img
                        src={getIconUrl(item)!}
                        alt=""
                        className={styles.itemIcon}
                      />
                    )}
                    <span className={styles.itemName}>{item.name}</span>
                    {item.id === selectedIDE && (
                      <svg className={styles.checkIcon} width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M11.5 3.5L5.5 10L2.5 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                ))}
                {filteredIDES.length === 0 && (
                  <div className={styles.noResults}>{t.noResults}</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <p className={styles.description}>
        {t.configureDescription}
      </p>

      {/* Installation Card */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>{t.installation}</h3>

        {/* Template hint for project-level MCP support */}
        {ide.supportsProjectMCP && (
          <div className={styles.templateHint}>
            <strong>{t.useTemplate}</strong> - {t.templateDescription}
            <a 
              href="/ai/cloudbase-ai-toolkit/templates" 
              className={styles.templateLink}
            >
              {t.viewTemplates}
            </a>
          </div>
        )}

        {/* One-click install button */}
        {getOneClickInstallUrl() && (
          <div className={styles.oneClickInstall}>
            <p className={styles.oneClickLabel}>{t.oneClickInstall}:</p>
            <a
              href={getOneClickInstallUrl()!}
              className={styles.oneClickButton}
              target="_blank"
              rel="noopener noreferrer"
            >
              {ide.oneClickInstallImage ? (
                <img 
                  src={ide.oneClickInstallImage} 
                  alt={`Add to ${ide.name}`}
                  className={styles.oneClickImage}
                />
              ) : (
                <span>Add to {ide.name}</span>
              )}
            </a>
          </div>
        )}

        {/* Install command (for command-based installation) */}
        {ide.useCommandInsteadOfConfig && ide.installCommandDocs && (
          <div className={styles.installCommandSection}>
            {ide.installCommandDocs.split(/\n\n/).map((section, idx) => {
              const codeMatch = section.match(/```bash\n([^`]+)```/);
              if (codeMatch) {
                const textBefore = section.split('```bash')[0].trim();
                const platformMatch = textBefore.match(/\*\*([^*]+)\*\*/);
                return (
                  <div key={idx} className={styles.installCommandBlock}>
                    {textBefore && (
                      <p className={styles.installCommandLabel}>
                        {platformMatch ? <strong>{platformMatch[1]}</strong> : textBefore}
                      </p>
                    )}
                    <div className={styles.codeBlock}>
                      <div className={styles.codeHeader}>
                        <span className={styles.codeLanguage}>bash</span>
                        <button 
                          className={styles.copyCodeButton}
                          onClick={async () => {
                            await navigator.clipboard.writeText(codeMatch[1].trim());
                            setCopiedCode(true);
                            setTimeout(() => setCopiedCode(false), 2000);
                          }}
                          title={t.copyCode}
                        >
                          {copiedCode ? (
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                              <path d="M13 4L6 11L3 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                              <rect x="5" y="5" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                              <path d="M3 11V3C3 2.44772 3.44772 2 4 2H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                          )}
                        </button>
                      </div>
                      <pre className={styles.codeContent}>
                        <code>{codeMatch[1].trim()}</code>
                      </pre>
                    </div>
                  </div>
                );
              }
              if (section.trim()) {
                return (
                  <p key={idx} className={styles.installCommandText}>
                    {section.split(/\*\*([^*]+)\*\*/).map((part, i) => 
                      i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                    )}
                  </p>
                );
              }
              return null;
            })}
          </div>
        )}

        {/* CLI command */}
        {ide.cliCommand && !ide.useCommandInsteadOfConfig && (
          <div className={styles.cliSection}>
            <p className={styles.cliLabel}>{t.cliCommand}:</p>
            <div className={styles.cliCommandBlock}>
              <code className={styles.cliCommandText}>{ide.cliCommand}</code>
              <button
                className={styles.copyCliButton}
                onClick={handleCopyCli}
                title={t.copyCode}
              >
                {copiedCli ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M13 4L6 11L3 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect x="5" y="5" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M3 11V3C3 2.44772 3.44772 2 4 2H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                )}
              </button>
            </div>
            {ide.alternativeConfig && (
              <p className={styles.alternativeConfig}>{ide.alternativeConfig}</p>
            )}
          </div>
        )}

        {/* Manual configuration */}
        {!ide.useCommandInsteadOfConfig && (getOneClickInstallUrl() || ide.cliCommand) && (
          <p className={styles.orManualConfig}>{t.orManualConfig}:</p>
        )}
        
        {!ide.useCommandInsteadOfConfig && (
          <>
            <p className={styles.configHint}>
              {t.orAddConfig} <code className={styles.inlineCode}>{ide.configPath}</code>:
            </p>

            {/* Code block with syntax highlighting */}
            <div className={styles.codeBlock}>
              <div className={styles.codeHeader}>
                <span className={styles.codeLanguage}>json</span>
                <button 
                  className={styles.copyCodeButton}
                  onClick={handleCopyCode}
                  title={t.copyCode}
                >
                  {copiedCode ? (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M13 4L6 11L3 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <rect x="5" y="5" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M3 11V3C3 2.44772 3.44772 2 4 2H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  )}
                </button>
              </div>
              <pre className={styles.codeContent}>
                <code>{highlightJSON(ide.configExample)}</code>
              </pre>
            </div>
          </>
        )}

            {/* Help link */}
            {ide.docUrl && (
              <div className={styles.helpSection}>
                <span className={styles.helpText}>{t.needHelp}</span>
                <a
                  href={ide.docUrl}
                  className={styles.helpLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t.viewDocs} {ide.name} {t.docs}
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M3.5 8.5L8.5 3.5M8.5 3.5H4.5M8.5 3.5V7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </a>
              </div>
            )}
      </div>

      {/* Step 2: Verify connection */}
      <div className={styles.verifyCard}>
        <h3 className={styles.verifyTitle}>{t.step2Verify}</h3>
        <p className={styles.verifyDescription}>{t.verifyDescription}:</p>
        <div className={styles.promptWrapper}>
          <div className={styles.promptLabel}>prompt</div>
          <div className={styles.promptContent}>
            <code className={styles.promptText}>
              {ide.verificationPrompt || t.defaultVerifyPrompt}
            </code>
            <button
              onClick={handleCopyPrompt}
              className={styles.copyPromptButton}
              title={t.copyPrompt}
            >
              {copiedPrompt ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M13 4L6 11L3 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="5" y="5" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M3 11V3C3 2.44772 3.44772 2 4 2H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
