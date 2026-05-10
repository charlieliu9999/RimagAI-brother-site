#!/usr/bin/env bash
# deploy.sh — 本地一键部署 rimagai-brother-site 到 VPS
#
# 用法: ./scripts/deploy.sh
#
# 依赖：已通过 ssh-copy-id 将公钥部署到 VPS
#   ssh-copy-id -i ~/.ssh/id_ed25519.pub root@220.154.3.166
#
# 仓库公开，脚本不含任何密钥。

set -euo pipefail

VPS_HOST="220.154.3.166"
VPS_USER="root"
DEPLOY_PATH="/var/www/rimagai-brother-site"
HEALTH_URL="http://localhost:18088/nginx-health"
PUBLIC_URL="http://${VPS_HOST}:18088/"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

SSH_OPTS=(-o StrictHostKeyChecking=no -o BatchMode=yes -o ConnectTimeout=10)

# 预检：免密登录是否可用
if ! ssh "${SSH_OPTS[@]}" "${VPS_USER}@${VPS_HOST}" true 2>/dev/null; then
  cat >&2 <<EOF
❌ 免密 SSH 登录失败。请先部署公钥：
   ssh-copy-id -i ~/.ssh/id_ed25519.pub ${VPS_USER}@${VPS_HOST}
EOF
  exit 1
fi

echo "==> 1/3 rsync 同步到 ${VPS_HOST}:${DEPLOY_PATH}"
rsync -avz --delete \
  --exclude='.git/' \
  --exclude='.gitlab-ci.yml' \
  --exclude='.gitignore' \
  --exclude='.github/' \
  --exclude='.vscode/' \
  --exclude='.idea/' \
  --exclude='.DS_Store' \
  --exclude='._*' \
  --exclude='*.bak' \
  --exclude='node_modules/' \
  --exclude='README.md' \
  --exclude='AGENTS.md' \
  --exclude='scripts/' \
  --exclude='docs/' \
  -e "ssh ${SSH_OPTS[*]}" \
  "${REPO_ROOT}/" \
  "${VPS_USER}@${VPS_HOST}:${DEPLOY_PATH}/"

echo ""
echo "==> 2/3 reload nginx"
ssh "${SSH_OPTS[@]}" "${VPS_USER}@${VPS_HOST}" \
  "nginx -t && systemctl reload nginx"

echo ""
echo "==> 3/3 健康检查"
ssh "${SSH_OPTS[@]}" "${VPS_USER}@${VPS_HOST}" \
  "curl -sf ${HEALTH_URL}" && echo " -- health OK"

echo ""
echo "✅ 部署成功！访问：${PUBLIC_URL}"
