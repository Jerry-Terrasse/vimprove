# Vimprove

一个交互式 Vim 学习网站，通过浏览器中的"迷你 Vim 编辑器 + 关卡式练习"帮助用户掌握 Vim 命令。

## ✨ 功能特性

- **纯函数 Vim 引擎** - 零依赖的 Vim 命令解析器，所有状态更新通过 reducer 管理
- **关卡式学习** - 循序渐进的课程设计，从基础移动到高级编辑
- **实时反馈** - 即时验证目标完成情况，可视化编辑器状态
- **可播放示例** - Run Example 功能展示命令执行过程
- **进度追踪** - 本地存储学习进度，记录完成时间和尝试次数

## 🎯 已支持的 Vim 命令

### 移动
- `h`, `j`, `k`, `l` - 基础移动
- `w`, `b`, `e` - 单词移动
- `W`, `B`, `E` - WORD 移动（空白分隔）
- `0`, `^`, `_`, `$` - 行内移动
- `f{char}`, `F{char}`, `t{char}`, `T{char}` - 字符查找
- `;`, `,` - 重复/反向查找

### 搜索
- `/pattern`, `?pattern` - 正向/反向搜索
- `n`, `N` - 在匹配间前进/后退
- `*`, `#` - 以当前单词为模式搜索正向/反向

### 编辑
- `x` - 删除字符
- `s` - 替换字符并进入 Insert
- `r{char}` - 替换字符
- `dd` - 删除行
- `d{motion}` - 删除到 motion 位置
- `c{motion}` - 修改到 motion 位置
- `i`, `a`, `I`, `A`, `o`, `O` - 进入 Insert 模式
- 文本对象：`iw/aw/ip/ap`、`i(`/`i{`/`i[`、`i"` 等，可与 `d/c/y` 组合进行整词/段落/括号/字符串编辑

### 复制粘贴
- `y{motion}`, `yy` - 复制文本
- `p`, `P` - 粘贴

### 其他
- `u` - 撤销
- `Ctrl-r` - 重做
- `.` - 重复上次修改
- 数字前缀 - `3w`, `5dd`, `2.` 等

## 🚀 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview

# 代码检查
npm run lint

# 运行测试
npm test

# 测试 UI 界面
npm run test:ui

# 生成测试覆盖率
npm run test:coverage
```

访问 `http://localhost:3000` 开始学习。

## 🛠️ 技术栈

- **React 19** - UI 框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **Tailwind CSS 3** - 样式方案
- **React Router** - 路由管理
- **React Markdown** - Markdown 渲染

## 📁 项目结构

```
src/
├── core/              # Vim 引擎核心（纯逻辑，零依赖）
│   ├── types.ts      # 类型定义
│   ├── vimReducer.ts # 状态管理 reducer
│   ├── motions.ts    # 移动逻辑
│   ├── operators.ts  # 操作符逻辑
│   └── utils.ts      # 工具函数
│
├── data/              # 课程数据
│   ├── categories.ts # 课程分类
│   └── lessons/      # 课程文件（按章节组织）
│       ├── chapter1/ # 模式与基础移动（4 课）
│       ├── chapter2/ # 单词移动与小编辑（5 课）
│       ├── chapter3/ # 高级编辑（5 课）
│       ├── chapter4/ # 行内查找与精确编辑（4 课）
│       ├── chapter5/ # 文本对象（5 课）
│       └── chapter6/ # 搜索与重构（4 课）
│
├── hooks/             # 自定义 hooks
│   ├── useVimEngine.ts    # Vim 引擎封装
│   ├── useChallenge.ts    # 挑战逻辑
│   └── useProgress.ts     # 进度持久化
│
├── components/        # UI 组件
│   ├── common/       # 通用组件
│   ├── lesson/       # 课程组件
│   ├── challenge/    # 挑战组件
│   ├── example/      # 示例播放器
│   └── layout/       # 布局组件
│
└── pages/            # 页面组件
```

## 🧪 测试

项目使用 Vitest 进行单元测试，已覆盖 Vim 引擎的所有核心功能。

### 测试覆盖

- ✅ **motions.ts** - 所有移动命令（h/j/k/l/w/b/e/0/$/f/t等）
- ✅ **operators.ts** - 操作符与 motion 组合（d/c/y + motion）
- ✅ **vimReducer.ts** - 核心状态管理（模式切换、编辑、undo/redo）
- ✅ **dot-command** - `.` 命令（重复上次修改）

### 测试统计

- **总测试数**: 176
- **测试文件**: 4
- **通过率**: 86%+（核心功能 100% 通过）

详细信息见 `tmp/test-summary.md`

## 📝 CHANGELOG

### v0.6.0 (2025-11-22)
- ✨ 新增 Chapter 4-6 课程：find/till 精准编辑、文本对象、搜索/重构关卡
- 🔍 实现搜索能力 `/ ? n N * #`，支持重复匹配跳转
- 🧩 新增文本对象 `iw/aw/ip/ap/()`/`{}`/`[]`/`""`，可与 d/c/y 组合
- 🧪 添加文本对象与搜索路径的单元测试

### v0.5.1 (2025-11-21)
- 🐛 修复 `.` 重放在 `cw`/`c$`/粘贴/计数覆盖等场景的边界问题，点命令测试全绿
- 🔄 优化 Undo/Redo 历史记录，确保重做正确恢复最新变更
- 🧭 调整 `w`/`e` 动作与寄存器行为，末尾空格处理更贴近预期
- ✅ 176/176 单元测试全面通过

### v0.5.0 (2025-11-20)
- ✅ 建立完整的单元测试系统（Vitest）
- 📊 176 个测试用例，覆盖所有 Vim 引擎核心功能
- 🧪 测试覆盖：motions、operators、vimReducer、dot-command
- 📈 86%+ 通过率，核心功能 100% 验证

### v0.4.0 (2025-11-20)
- ✨ 新增 `.` 命令 - 重复上次修改操作
- 🏗️ 重构 VimState，新增按键记录机制
- 📚 支持 count prefix 覆盖（如 `3x` 后可用 `2.` 覆盖）

### v0.3.0 (2025-01)
- ✨ 新增 Chapter 3 - 高级编辑课程
- ✨ 实现 Undo/Redo 系统（`u`, `Ctrl-r`）
- ✨ 实现 Yank/Paste 功能（`y`, `p`, `P`）
- ✨ 支持数字前缀（`3w`, `5dd` 等）
- ✨ 实现字符查找（`f`, `F`, `t`, `T`, `;`, `,`）

### v0.2.0 (2025-01)
- ✨ 新增 Chapter 1-2 课程
- ✨ 实现 Run Example 可播放示例功能
- ✨ 支持 Markdown 渲染
- 🎨 完善 UI 样式和交互

### v0.1.0 (2025-01)
- 🎉 项目初始化
- 🏗️ 模块化架构搭建
- 🔧 基础 Vim 引擎实现
- 📦 课程系统框架

## 📄 许可证

MIT

---

**当前版本**: v0.5.1 Alpha
