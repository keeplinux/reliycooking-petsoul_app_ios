#!/bin/bash
# =============================================================================
# live-build.sh —— VS Code 实时开发循环
# 监听 PetSoulApp 源码变化 → 增量编译 → 重装 → 重启模拟器 App
# 用法: ./Scripts/live-build.sh   (Ctrl+C 退出)
# =============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

SCHEME="PetSoul"
PROJECT="PetSoul.xcodeproj"
BUNDLE_ID="com.silifield.petsoul"
DERIVED="$ROOT/build/DerivedData"
APP_PATH="$DERIVED/Build/Products/Debug-iphonesimulator/PetSoul.app"
WATCH_DIR="$ROOT/PetSoulApp"

# 颜色
G="\033[32m"; Y="\033[33m"; R="\033[31m"; B="\033[36m"; N="\033[0m"

# ---- 选择模拟器（优先 iPhone 17 Pro）----
pick_sim() {
  xcrun simctl list devices available -j | python3 -c '
import sys,json
d=json.load(sys.stdin)
pref=["iPhone 17 Pro","iPhone 17","iPhone Air","iPhone 17e"]
for r in d["devices"]:
  for x in d["devices"][r]:
    if x["name"] in pref:
      print(x["udid"]); sys.exit()
for r in d["devices"]:
  for x in d["devices"][r]:
    if "iPhone" in x["name"]:
      print(x["udid"]); sys.exit()
'
}
SIM_UDID="$(pick_sim)"
if [ -z "$SIM_UDID" ]; then
  echo -e "${R}未找到可用 iPhone 模拟器${N}"; exit 1
fi
SIM_NAME=$(xcrun simctl list devices -j | python3 -c "import sys,json;d=json.load(sys.stdin);print(next(x['name'] for r in d['devices'] for x in d['devices'][r] if x['udid']=='$SIM_UDID'))")
echo -e "${B}目标模拟器: $SIM_NAME ($SIM_UDID)${N}"

# ---- 启动模拟器 ----
boot_sim() {
  xcrun simctl bootstatus "$SIM_UDID" -b 2>/dev/null || true
  xcrun simctl boot "$SIM_UDID" 2>/dev/null || true
  open -a Simulator 2>/dev/null || true
}

# ---- 编译 ----
build() {
  echo -e "${Y}🔨 增量编译...${N}"
  if xcodebuild -project "$PROJECT" -scheme "$SCHEME" \
      -destination "id=$SIM_UDID" -configuration Debug \
      -derivedDataPath "$DERIVED" \
      CODE_SIGNING_ALLOWED=NO build 2>&1 | tail -4 | grep -q "BUILD SUCCEEDED"; then
    echo -e "${G}✅ BUILD SUCCEEDED${N}"
    return 0
  else
    echo -e "${R}❌ BUILD FAILED${N}"
    return 1
  fi
}

# ---- 安装并启动 ----
install_launch() {
  xcrun simctl terminate "$SIM_UDID" "$BUNDLE_ID" 2>/dev/null || true
  xcrun simctl install "$SIM_UDID" "$APP_PATH"
  xcrun simctl launch "$SIM_UDID" "$BUNDLE_ID"
  echo -e "${G}🚀 已在模拟器启动 App${N}"
}

# ---- 主流程 ----
echo -e "${B}== PetSoul 实时开发循环 ==${N}"
echo -e "${B}在 VS Code 编辑 .swift 文件并保存，模拟器将自动刷新${N}\n"

boot_sim
build
install_launch

if ! command -v fswatch >/dev/null 2>&1; then
  echo -e "${R}未安装 fswatch，无法监听。请运行: brew install fswatch${N}"
  exit 1
fi

echo -e "\n${B}👀 开始监听 $WATCH_DIR ...${N}"
# -l 1: 1 秒延迟批量输出（天然防抖）; -o: 输出事件计数
fswatch -o -l 1 \
  --exclude 'build/' --exclude '.git/' --exclude 'DerivedData/' \
  -e "$WATCH_DIR" "$WATCH_DIR" | while read -r _; do
  # 再次防抖：等待 0.3s 合并连续保存
  sleep 0.3
  echo -e "${Y}⚡ 检测到代码变化，重建中...${N}"
  if build; then
    install_launch
  fi
done
