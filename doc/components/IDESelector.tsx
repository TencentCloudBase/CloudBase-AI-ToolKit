import React, { useState } from 'react';
import styles from './IDESelector.module.css';

interface IDE {
  id: string;
  name: string;
  platform: string;
  configPath: string;
  configExample: string;
  installUrl?: string;
}

const IDES: IDE[] = [
  {
    id: 'cursor',
    name: 'Cursor',
    platform: '独立 IDE',
    configPath: '.cursor/mcp.json',
    configExample: `{
  "mcpServers": {
    "cloudbase": {
      "command": "npx",
      "args": ["npm-global-exec@latest", "@cloudbase/cloudbase-mcp@latest"],
      "env": {
        "INTEGRATION_IDE": "Cursor"
      }
    }
  }
}`,
  },
  {
    id: 'windsurf',
    name: 'WindSurf',
    platform: '独立 IDE, VSCode、JetBrains 插件',
    configPath: '.windsurf/mcp.json',
    configExample: `{
  "mcpServers": {
    "cloudbase": {
      "command": "npx",
      "args": ["npm-global-exec@latest", "@cloudbase/cloudbase-mcp@latest"],
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
    platform: 'VS Code、JetBrains、微信开发者工具、独立 IDE',
    configPath: '.codebuddy/mcp.json',
    configExample: `{
  "mcpServers": {
    "cloudbase": {
      "command": "npx",
      "args": ["npm-global-exec@latest", "@cloudbase/cloudbase-mcp@latest"],
      "env": {
        "INTEGRATION_IDE": "CodeBuddy"
      }
    }
  }
}`,
  },
  {
    id: 'claude-code',
    name: 'Claude Code',
    platform: '命令行工具',
    configPath: '~/.config/claude/mcp.json',
    configExample: `{
  "mcpServers": {
    "cloudbase": {
      "command": "npx",
      "args": ["npm-global-exec@latest", "@cloudbase/cloudbase-mcp@latest"],
      "env": {
        "INTEGRATION_IDE": "Claude Code"
      }
    }
  }
}`,
  },
  {
    id: 'cline',
    name: 'CLINE',
    platform: 'VS Code 插件',
    configPath: '.cline/mcp.json',
    configExample: `{
  "mcpServers": {
    "cloudbase": {
      "command": "npx",
      "args": ["npm-global-exec@latest", "@cloudbase/cloudbase-mcp@latest"],
      "env": {
        "INTEGRATION_IDE": "CLINE"
      }
    }
  }
}`,
  },
  {
    id: 'github-copilot',
    name: 'GitHub Copilot',
    platform: 'VS Code 插件',
    configPath: '.github-copilot/mcp.json',
    configExample: `{
  "mcpServers": {
    "cloudbase": {
      "command": "npx",
      "args": ["npm-global-exec@latest", "@cloudbase/cloudbase-mcp@latest"],
      "env": {
        "INTEGRATION_IDE": "GitHub Copilot"
      }
    }
  }
}`,
  },
  {
    id: 'trae',
    name: 'Trae',
    platform: '独立 IDE',
    configPath: '.trae/mcp.json',
    configExample: `{
  "mcpServers": {
    "cloudbase": {
      "command": "npx",
      "args": ["npm-global-exec@latest", "@cloudbase/cloudbase-mcp@latest"],
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
    platform: '独立 IDE，VS Code、JetBrains 插件',
    configPath: '.tongyi-lingma/mcp.json',
    configExample: `{
  "mcpServers": {
    "cloudbase": {
      "command": "npx",
      "args": ["npm-global-exec@latest", "@cloudbase/cloudbase-mcp@latest"],
      "env": {
        "INTEGRATION_IDE": "Tongyi Lingma"
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
    configExample: `{
  "mcpServers": {
    "cloudbase": {
      "command": "npx",
      "args": ["npm-global-exec@latest", "@cloudbase/cloudbase-mcp@latest"],
      "env": {
        "INTEGRATION_IDE": "RooCode"
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
    configExample: `{
  "mcpServers": {
    "cloudbase": {
      "command": "npx",
      "args": ["npm-global-exec@latest", "@cloudbase/cloudbase-mcp@latest"],
      "env": {
        "INTEGRATION_IDE": "Baidu Comate"
      }
    }
  }
}`,
  },
  {
    id: 'augment-code',
    name: 'Augment Code',
    platform: 'VS Code、JetBrains 插件',
    configPath: '.augment-code/mcp.json',
    configExample: `{
  "mcpServers": {
    "cloudbase": {
      "command": "npx",
      "args": ["npm-global-exec@latest", "@cloudbase/cloudbase-mcp@latest"],
      "env": {
        "INTEGRATION_IDE": "Augment Code"
      }
    }
  }
}`,
  },
  {
    id: 'gemini-cli',
    name: 'Gemini CLI',
    platform: '命令行工具',
    configPath: '.gemini/mcp.json',
    configExample: `{
  "mcpServers": {
    "cloudbase": {
      "command": "npx",
      "args": ["npm-global-exec@latest", "@cloudbase/cloudbase-mcp@latest"],
      "env": {
        "INTEGRATION_IDE": "Gemini CLI"
      }
    }
  }
}`,
  },
  {
    id: 'opencode',
    name: 'OpenCode',
    platform: '命令行工具',
    configPath: '.opencode/mcp.json',
    configExample: `{
  "mcpServers": {
    "cloudbase": {
      "command": "npx",
      "args": ["npm-global-exec@latest", "@cloudbase/cloudbase-mcp@latest"],
      "env": {
        "INTEGRATION_IDE": "OpenCode"
      }
    }
  }
}`,
  },
  {
    id: 'qwen-code',
    name: 'Qwen Code',
    platform: '命令行工具',
    configPath: '.qwen-code/mcp.json',
    configExample: `{
  "mcpServers": {
    "cloudbase": {
      "command": "npx",
      "args": ["npm-global-exec@latest", "@cloudbase/cloudbase-mcp@latest"],
      "env": {
        "INTEGRATION_IDE": "Qwen Code"
      }
    }
  }
}`,
  },
  {
    id: 'openai-codex-cli',
    name: 'OpenAI Codex CLI',
    platform: '命令行工具',
    configPath: '.openai-codex-cli/mcp.json',
    configExample: `{
  "mcpServers": {
    "cloudbase": {
      "command": "npx",
      "args": ["npm-global-exec@latest", "@cloudbase/cloudbase-mcp@latest"],
      "env": {
        "INTEGRATION_IDE": "OpenAI Codex CLI"
      }
    }
  }
}`,
  },
];

interface IDESelectorProps {
  defaultIDE?: string;
  showInstallButton?: boolean;
}

export default function IDESelector({ 
  defaultIDE,
  showInstallButton = true 
}: IDESelectorProps) {
  const [selectedIDE, setSelectedIDE] = useState<string>(defaultIDE || 'cursor');
  const ide = IDES.find(i => i.id === selectedIDE) || IDES[0];

  return (
    <div className={styles.container}>
      <div className={styles.selector}>
        <label htmlFor="ide-select" className={styles.label}>
          平台
        </label>
        <select
          id="ide-select"
          value={selectedIDE}
          onChange={(e) => setSelectedIDE(e.target.value)}
          className={styles.select}
        >
          {IDES.map((ide) => (
            <option key={ide.id} value={ide.id}>
              {ide.name}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.config}>
        <div className={styles.step}>
          <h4>安装</h4>
          <p>在项目根目录创建 <code>{ide.configPath}</code> 文件：</p>
          <pre className={styles.code}>
            <code>{ide.configExample}</code>
          </pre>
        </div>

        {showInstallButton && (
          <div className={styles.actions}>
            <a
              href={`/ai/cloudbase-ai-toolkit/ide-setup/${ide.id}`}
              className={styles.link}
            >
              查看 {ide.name} 配置指南
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

