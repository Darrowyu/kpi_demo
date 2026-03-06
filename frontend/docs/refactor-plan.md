# 前端页面重构实施计划 - 优雅极简风格

> **For Claude:** 使用 subagent-driven-development 来实施此计划

**目标:** 将所有6个前端页面从现有的渐变复杂风格重构为"优雅极简"风格

**架构:** 保持现有 React + TypeScript + Tailwind + shadcn/ui 架构不变，统一升级视觉设计语言

**技术栈:** React 18 + TypeScript + Tailwind CSS 4 + shadcn/ui + Lucide Icons

---

## 设计系统规范

### 色彩系统
```css
:root {
  /* 主色调 - 柔和青蓝 */
  --primary: 199 76% 55%;        /* #38bdf8 */
  --primary-foreground: 0 0% 100%;
  --primary-light: 199 89% 95%;  /* #f0f9ff */

  /* 辅助色 - 深蓝灰 */
  --secondary: 215 25% 27%;      /* #334155 */
  --secondary-foreground: 0 0% 100%;

  /* 背景色 */
  --background: 0 0% 100%;       /* #ffffff */
  --background-soft: 210 40% 98%; /* #f8fafc */
  --background-muted: 210 40% 96%; /* #f1f5f9 */

  /* 文字色 */
  --foreground: 222 47% 11%;     /* #0f172a */
  --foreground-muted: 215 16% 47%; /* #64748b */
  --foreground-subtle: 215 20% 65%; /* #94a3b8 */

  /* 边框 */
  --border: 214 32% 91%;         /* #e2e8f0 */
  --border-subtle: 220 13% 91%;  /* #e2e8f0 */

  /* 等级色彩 */
  --grade-a: 142 71% 45%;        /* #22c55e */
  --grade-b: 199 89% 48%;        /* #0ea5e9 */
  --grade-c: 35 92% 33%;         /* #a16207 */
  --grade-d: 0 72% 51%;          /* #dc2626 */
}
```

### 间距系统
- 页面内边距: `p-6 lg:p-8`
- 卡片内边距: `p-6`
- 元素间距: `space-y-6` 或 `gap-6`
- 紧凑间距: `space-y-3` 或 `gap-3`

### 圆角系统
- 卡片: `rounded-2xl` (1rem)
- 按钮: `rounded-xl` (0.75rem)
- 输入框: `rounded-xl` (0.75rem)
- 小元素: `rounded-lg` (0.5rem)

### 阴影系统
- 卡片: `shadow-sm hover:shadow-md`
- 悬浮元素: `shadow-md`
- 弹窗: `shadow-lg`

### 字体系统
- 标题: `font-semibold text-slate-900`
- 正文: `text-slate-600`
- 次要文字: `text-slate-500 text-sm`
- 数字: `tabular-nums`

---

## 组件重构规范

### Card 组件
```tsx
// 新风格
<Card className="rounded-2xl border-slate-100 shadow-sm hover:shadow-md transition-shadow">
```

### Button 组件
```tsx
// 主按钮
<Button className="rounded-xl bg-slate-900 hover:bg-slate-800">

// 次按钮
<Button variant="outline" className="rounded-xl border-slate-200 hover:bg-slate-50">
```

### 统计卡片
```tsx
<div className="rounded-2xl bg-white border border-slate-100 p-6 shadow-sm">
  <div className="flex items-center gap-4">
    <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center">
      <Icon className="w-6 h-6 text-slate-600" />
    </div>
    <div>
      <p className="text-sm text-slate-500">标题</p>
      <p className="text-2xl font-semibold text-slate-900">数值</p>
    </div>
  </div>
</div>
```

### 表格样式
```tsx
<Table>
  <TableHeader className="bg-slate-50/50">
    <TableRow className="hover:bg-transparent border-slate-100">
      <TableHead className="text-slate-600 font-medium">列名</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow className="border-slate-100 hover:bg-slate-50/50">
      <TableCell className="text-slate-700">数据</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

---

## 任务清单

### Task 1: 更新全局样式 (index.css)

**文件:**
- 修改: `src/index.css`

**要求:**
1. 移除所有渐变背景样式
2. 简化色彩系统为单色方案
3. 添加新的动画变量
4. 更新滚动条样式为简约风格

**不要:**
- 不要使用渐变
- 不要使用发光效果
- 不要使用复杂的动画

---

### Task 2: 重构 Sidebar 组件

**文件:**
- 修改: `src/components/Sidebar.tsx`

**要求:**
1. 移除渐变背景，改为纯白
2. 简化 Logo 区域为单色
3. 菜单项改为简约的悬停效果
4. 激活状态使用左侧边框而非渐变背景
5. 简化底部信息卡片

**关键修改点:**
- 背景: `bg-white`
- Logo: 移除渐变，使用 `text-slate-900`
- 激活菜单: `border-l-2 border-slate-900 bg-slate-50`
- 悬停: `hover:bg-slate-50`

---

### Task 3: 重构 Layout 组件

**文件:**
- 修改: `src/components/Layout.tsx`

**要求:**
1. 背景改为纯色 `bg-slate-50`
2. 移除渐变背景
3. 调整内容区域间距

---

### Task 4: 重构 Dashboard 页面

**文件:**
- 修改: `src/pages/Dashboard.tsx`

**要求:**
1. 统计卡片简化：
   - 移除渐变图标背景
   - 改为 `bg-slate-50` 圆形图标
   - 文字改为单色
2. ActionCard 简化：
   - 移除渐变悬停效果
   - 改为边框和阴影变化
3. 表格样式更新
4. 移除所有动画延迟

---

### Task 5: 重构 DataUpload 页面

**文件:**
- 修改: `src/pages/DataUpload.tsx`

**要求:**
1. 文件拖拽区域简化：
   - 移除渐变装饰
   - 使用边框和纯色背景
2. 文件预览卡片简化
3. 上传按钮使用单色方案
4. 结果表格样式统一

---

### Task 6: 重构 EmployeeList 页面

**文件:**
- 修改: `src/pages/EmployeeList.tsx`

**要求:**
1. 统计卡片简化
2. 筛选工具栏简化
3. 员工表格样式更新
4. 头像改为单色渐变
5. 弹窗样式简化

---

### Task 7: 重构 StandardParamManager 页面

**文件:**
- 修改: `src/pages/StandardParamManager.tsx`

**要求:**
1. Tab 切换样式简化
2. KPI算法表格样式更新
3. 厂区卡片简化
4. 参数表格样式统一
5. 弹窗样式简化

---

### Task 8: 重构 KPICalculation 页面

**文件:**
- 修改: `src/pages/KPICalculation.tsx`

**要求:**
1. 计算卡片简化
2. 结果卡片组简化
3. 移除渐变背景
4. 表格样式统一

---

### Task 9: 重构 KPIReport 页面

**文件:**
- 修改: `src/pages/KPIReport.tsx`

**要求:**
1. 筛选卡片简化
2. 统计卡片组简化
3. 排名表格样式更新
4. 徽章样式统一
5. 进度条使用简约风格

---

### Task 10: 更新 UI 组件

**文件:**
- 检查并修改: `src/components/ui/` 下的所有组件

**需要检查的组件:**
- button.tsx
- card.tsx
- badge.tsx
- progress.tsx
- table.tsx
- dialog.tsx

**要求:**
确保所有组件支持新的设计风格

---

## 实施顺序

1. Task 1 (全局样式) - 必须先完成
2. Task 2, Task 3 (布局组件) - 可以并行
3. Task 4-9 (页面) - 可以并行
4. Task 10 (组件检查) - 最后完成

---

## 验收标准

- [ ] 所有渐变效果已移除
- [ ] 色彩系统统一为单色方案
- [ ] 所有卡片使用 `rounded-2xl` 圆角
- [ ] 所有表格样式统一
- [ ] 所有按钮样式统一
- [ ] 页面整体风格一致
- [ ] TypeScript 无错误
- [ ] 所有页面可正常访问
