#!/bin/bash
# XEngineer 环境初始化脚本
# clone 仓库后运行一次：bash scripts/setup.sh

cd /home/z/my-project/XEngineer || exit 1

echo "=== XEngineer 环境初始化 ==="

# 1. 设置 git hooks 路径
git config core.hooksPath .githooks
echo "[OK] core.hooksPath = .githooks"

# 2. 设置 hook 可执行权限
chmod +x .githooks/* 2>/dev/null
echo "[OK] hook 权限已设置"

# 3. 检查 .env 文件
if [ -f .env ]; then
    echo "[OK] .env 文件存在"
else
    echo "[WARN] .env 文件不存在！请手动创建 .env 并填入 API Keys"
    echo "       参考模板：.env.example（如存在）"
fi

# 4. 设置 remote URL（不含 token，hook 会动态注入）
git remote set-url origin https://github.com/bigmanBass666/XEngineer-temp.git 2>/dev/null
echo "[OK] remote URL 已标准化"

# 5. 清理旧的 .git/hooks 中的同名 hook（避免冲突）
if [ -f .git/hooks/post-commit ]; then
    mv .git/hooks/post-commit .git/hooks/post-commit.bak 2>/dev/null
    echo "[INFO] 旧的 .git/hooks/post-commit 已备份为 .bak"
fi

echo ""
echo "=== 初始化完成 ==="
echo "后续 commit 将自动 push 到远程（post-commit hook）"
