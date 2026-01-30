#!/bin/bash
# 每日自动生成 AI 总结脚本
# 需要确保本地 Antigravity 服务运行在 127.0.0.1:8045

cd /Users/zhishengzhang/Projects/github-trending-tracker

# 记录日志
LOG_FILE="$HOME/Library/Logs/github-trending-tracker.log"
echo "======================================" >> "$LOG_FILE"
echo "$(date): 开始生成 AI 总结" >> "$LOG_FILE"

# 检查 Antigravity 服务是否运行
if ! curl -s http://127.0.0.1:8045/health > /dev/null 2>&1; then
    echo "$(date): ⚠️ Antigravity 服务未运行，跳过生成" >> "$LOG_FILE"
    exit 0
fi

# 运行生成脚本
npx tsx src/scripts/generate-summaries.ts >> "$LOG_FILE" 2>&1

echo "$(date): ✅ 完成" >> "$LOG_FILE"
