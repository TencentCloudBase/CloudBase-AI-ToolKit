#!/bin/bash

# CloudBase AI 配置文件硬链接修复脚本
# 用于确保所有 AI 编辑器的配置文件都指向同一个源文件

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 源文件（主配置文件）
SOURCE_FILE="config/.cursor/rules/cloudbase-rules.mdc"

# 目标文件列表（需要创建硬链接的文件）
TARGET_FILES=(
    "config/.trae/rules/cloudbase-rules.md"
    "config/.windsurf/rules/cloudbase-rules.md"
    "config/.roo/rules/cloudbaase-rules.md"
    "config/.lingma/rules/cloudbaase-rules.md"
    "config/.rules/cloudbase-rules.md"
    "config/.clinerules/cloudbase-rules.mdc"
    "config/.github/copilot-instructions.md"
    "config/.comate/rules/cloudbase-rules.mdr"
    "config/.augment-guidelines"
    "config/CLAUDE.md"
    "config/.gemini/GEMINI.md"
    "config/AGENTS.md"
    "config/.qwen/QWEN.md"
)

echo -e "${BLUE}🔧 CloudBase AI 配置文件硬链接修复工具${NC}"
echo "=================================================="

# 检查源文件是否存在
if [ ! -f "$SOURCE_FILE" ]; then
    echo -e "${RED}❌ 错误: 源文件 $SOURCE_FILE 不存在${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 源文件存在: $SOURCE_FILE${NC}"

# 获取源文件的 inode
SOURCE_INODE=$(ls -i "$SOURCE_FILE" | awk '{print $1}')
echo -e "${BLUE}📋 源文件 inode: $SOURCE_INODE${NC}"

# 检查当前硬链接状态
echo -e "\n${YELLOW}🔍 检查当前硬链接状态...${NC}"

BROKEN_LINKS=()
CORRECT_LINKS=()

for target in "${TARGET_FILES[@]}"; do
    if [ -f "$target" ]; then
        target_inode=$(ls -i "$target" | awk '{print $1}')
        if [ "$target_inode" = "$SOURCE_INODE" ]; then
            echo -e "${GREEN}✅ $target (正确链接)${NC}"
            CORRECT_LINKS+=("$target")
        else
            echo -e "${RED}❌ $target (独立文件, inode: $target_inode)${NC}"
            BROKEN_LINKS+=("$target")
        fi
    else
        echo -e "${YELLOW}⚠️  $target (文件不存在)${NC}"
        BROKEN_LINKS+=("$target")
    fi
done

# 如果所有文件都正确链接，则退出
if [ ${#BROKEN_LINKS[@]} -eq 0 ]; then
    echo -e "\n${GREEN}🎉 所有配置文件都已正确硬链接！${NC}"
    echo -e "${BLUE}📊 总共 $((${#CORRECT_LINKS[@]} + 1)) 个硬链接${NC}"
    exit 0
fi

# 显示需要修复的文件
echo -e "\n${YELLOW}🔧 需要修复的文件 (${#BROKEN_LINKS[@]} 个):${NC}"
for broken in "${BROKEN_LINKS[@]}"; do
    echo "   - $broken"
done

# 询问用户是否继续
echo -e "\n${YELLOW}❓ 是否继续修复这些文件？这将删除独立副本并创建硬链接。 [y/N]${NC}"
read -r response
if [[ ! "$response" =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}🚫 操作已取消${NC}"
    exit 0
fi

# 修复硬链接
echo -e "\n${BLUE}🔧 开始修复硬链接...${NC}"

FIXED_COUNT=0
ERROR_COUNT=0

for target in "${BROKEN_LINKS[@]}"; do
    echo -e "${YELLOW}🔄 处理: $target${NC}"
    
    # 创建目录（如果不存在）
    target_dir=$(dirname "$target")
    if [ ! -d "$target_dir" ]; then
        echo "   📁 创建目录: $target_dir"
        mkdir -p "$target_dir"
    fi
    
    # 删除现有文件（如果存在）
    if [ -f "$target" ]; then
        echo "   🗑️  删除现有文件"
        rm "$target"
    fi
    
    # 创建硬链接
    if ln "$SOURCE_FILE" "$target" 2>/dev/null; then
        echo -e "   ${GREEN}✅ 硬链接创建成功${NC}"
        ((FIXED_COUNT++))
    else
        echo -e "   ${RED}❌ 硬链接创建失败${NC}"
        ((ERROR_COUNT++))
    fi
done

# 显示结果
echo -e "\n${BLUE}📊 修复完成统计:${NC}"
echo -e "${GREEN}✅ 成功修复: $FIXED_COUNT 个文件${NC}"
if [ $ERROR_COUNT -gt 0 ]; then
    echo -e "${RED}❌ 修复失败: $ERROR_COUNT 个文件${NC}"
fi

# 最终验证
echo -e "\n${BLUE}🔍 最终验证硬链接状态...${NC}"
total_links=$(ls -l "$SOURCE_FILE" | awk '{print $2}')
echo -e "${GREEN}🎉 总硬链接数: $total_links${NC}"

# 显示所有链接的文件
echo -e "\n${BLUE}📋 所有硬链接文件:${NC}"
find config -samefile "$SOURCE_FILE" | sort

echo -e "\n${GREEN}✨ 硬链接修复完成！现在修改任何一个文件都会同步到所有其他文件。${NC}"
