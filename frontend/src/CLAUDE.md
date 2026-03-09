# Larry Design System Guide

This document defines the design system for **Larry**, a personal "Now" dashboard. It serves as the single source of truth for UI patterns, component APIs, and visual standards. Follow this guide when building new features or modifying existing ones.

---

## Design Principles

1. **Clarity** -- Every element should communicate its purpose immediately. Use clear labels, obvious affordances, and meaningful empty states.
2. **Consistency** -- Reuse the same components, colors, and spacing across all features. If a pattern exists in this guide, use it.
3. **Accessibility** -- All interactive elements must be keyboard-navigable with visible focus rings. Use ARIA labels on icon-only buttons. Maintain WCAG 2.1 AA contrast ratios.
4. **Expressiveness** -- The gradient-based dark theme gives Larry its personality. Use gradients intentionally for primary actions and branding, not decoration.
5. **Efficiency** -- The dashboard is optimized for daily use. Interactions should complete in under 10 seconds. Prefer inline editing over navigation.

---

## Color System

Larry uses a dark theme with a gradient accent system. Colors are defined in `tailwind.config.js`.

### Primary Gradient Palette

The signature Larry gradient flows from blue through purple to indigo:

| Token | Hex | Usage |
|-------|-----|-------|
| `primary-500` | `#3B82F6` | Primary blue, start of gradient |
| `purple-500` | `#8B5CF6` | Midpoint of gradient |
| `indigo-500` | `#6366F1` | End of gradient |

Apply via: `bg-gradient-primary` (buttons, sidebar, branding) or `text-gradient` (headline text).

### Semantic Colors

| Semantic | Token prefix | Use for |
|----------|-------------|---------|
| Success | `success-*` | Completed tasks, save confirmations |
| Warning | `warning-*` | In-progress states, timer low-time |
| Danger | `danger-*` | Errors, delete actions |
| Info | `info-*` | Weather data, neutral information |

Each semantic color has shades 50-900. Use `500` for backgrounds, `300` for text on dark surfaces, `500/10` for subtle background tints.

### Surface Colors (Dark Theme)

| Token | Usage |
|-------|-------|
| `surface-950` | Page background |
| `surface-900` | Deep background, focus ring offset |
| `surface-800` | Card backgrounds, input backgrounds |
| `surface-700` | Borders, dividers |
| `surface-600` | Hover borders, secondary borders |
| `surface-500` | Placeholder text, muted labels |
| `surface-400` | Secondary text, icons |
| `surface-300` | Body text on dark backgrounds |
| `surface-200` | Emphasized body text |
| `surface-100` | Primary text, headings |

### Gradient Presets

| Class | Value | Usage |
|-------|-------|-------|
| `bg-gradient-primary` | `135deg, #3B82F6, #8B5CF6, #6366F1` | Primary buttons, sidebar |
| `bg-gradient-primary-hover` | `135deg, #2563eb, #7c3aed, #4f46e5` | Button hover states |
| `bg-gradient-surface` | `180deg, #0f172a, #1e293b` | Page background |
| `bg-gradient-card` | `135deg, rgba(30,41,59,0.8), rgba(15,23,42,0.9)` | Card `variant="gradient"` |
| `bg-gradient-subtle` | `135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1)` | Subtle accent backgrounds |

**Gradient guidelines:** Use `bg-gradient-primary` only for primary CTAs and the sidebar. Use `bg-gradient-card` for main content cards. Never stack gradients on top of each other.

---

## Typography

Font stack: `Inter, system-ui, -apple-system, sans-serif`. Monospace: `JetBrains Mono, Fira Code, monospace`.

| Token | Size | Weight | Line Height | Use for |
|-------|------|--------|-------------|---------|
| `text-display` | 3rem | 700 | 1.1 | Large display numbers (weather temp icon) |
| `text-h1` | 2rem | 700 | 1.2 | Page headings (rare in dashboard context) |
| `text-h2` | 1.5rem | 600 | 1.3 | Card titles via `CardHeader` |
| `text-body` | 1rem | 400 | 1.6 | Default body text, form inputs |
| `text-caption` | 0.875rem | 400 | 1.4 | Labels, section headings, secondary info |
| `text-small` | 0.75rem | 500 | 1.4 | Badges, timestamps, hints |

---

## Spacing Grid

Larry uses an **8px base grid**. All spacing values are multiples of 8px:

| Token | Value | Common usage |
|-------|-------|-------------|
| `0.5` | 4px | Tight gaps (badge padding, icon spacing) |
| `1` | 8px | Inline spacing, small gaps |
| `1.5` | 12px | Button gaps, form field spacing |
| `2` | 16px | Card padding (sm), section spacing |
| `3` | 24px | Card padding (md), main content gaps |
| `4` | 32px | Card padding (lg), major section spacing |
| `6` | 48px | Page-level spacing |

Use `gap-3` for dashboard grid gaps. Use `space-y-1.5` for form fields within cards. Use `mb-2` for spacing between card header and content.

---

## Component Library

All UI primitives live in `src/components/ui/` and are re-exported from `src/components/ui/index.ts`.

### Button

```tsx
import { Button } from './components/ui';

<Button variant="primary" size="md" loading={false} fullWidth={false}>
  Save Focus
</Button>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'danger' \| 'ghost' \| 'outline'` | `'primary'` | Visual style |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Size preset |
| `loading` | `boolean` | `false` | Shows spinner, disables button |
| `fullWidth` | `boolean` | `false` | Stretch to container width |
| `disabled` | `boolean` | `false` | Standard HTML disabled |

**Variant usage:**
- `primary` -- Main actions (Save, Add Task). Uses gradient background.
- `secondary` -- Secondary actions (Reset timer).
- `danger` -- Destructive actions (Delete).
- `ghost` -- Tertiary actions (Edit, Cancel, preset selectors). Transparent background.
- `outline` -- Alternative emphasis (Pause timer, Unpin note). Border with transparent fill.

### Input

```tsx
import { Input } from './components/ui';

<Input
  label="Task name"
  placeholder="Enter task..."
  error="Required"
  hint="Press Enter to add"
  size="md"
  validate={(v) => v.length === 0 ? 'Required' : undefined}
/>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | -- | Label text above input |
| `error` | `string` | -- | Error message (external). Overrides internal validation. |
| `hint` | `string` | -- | Helper text below input (hidden when error shows) |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Size preset |
| `fullWidth` | `boolean` | `true` | Fill container width |
| `validate` | `(value: string) => string \| undefined` | -- | Built-in validation function |

**Validation timing:** The Input component uses a mixed validation strategy. Fields with type `email`, `url`, or `password` validate in realtime after first blur. All other types validate on blur.

### Textarea

Same API as Input, but renders a `<textarea>`. Additional prop: `rows` (default `3`).

### Select

```tsx
import { Select } from './components/ui';

<Select
  label="Status"
  options={[
    { value: 'TODO', label: 'To Do' },
    { value: 'DOING', label: 'In Progress' },
    { value: 'DONE', label: 'Done' },
  ]}
  placeholder="Select status..."
/>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `options` | `{ value: string; label: string; disabled?: boolean }[]` | required | Options list |
| `placeholder` | `string` | -- | Disabled placeholder option |
| `label` | `string` | -- | Label text |
| `error` / `hint` / `size` / `fullWidth` | same as Input | -- | -- |

### Card

```tsx
import { Card, CardHeader } from './components/ui';

<Card variant="gradient" padding="md" hoverable>
  <CardHeader title="Today's Focus" action={<Button variant="ghost" size="sm">Edit</Button>} />
  {/* content */}
</Card>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'gradient' \| 'outlined'` | `'default'` | Visual style |
| `padding` | `'none' \| 'sm' \| 'md' \| 'lg'` | `'md'` | Internal padding |
| `hoverable` | `boolean` | `false` | Adds hover lift effect |

**Variant usage:**
- `gradient` -- Main feature cards (FocusCard, TasksList, TimerWidget). Uses `bg-gradient-card`.
- `default` -- Standard content cards. Solid `bg-surface-800`.
- `outlined` -- Nested cards, form containers, list items. Transparent with border.

**CardHeader** takes `title` (string) and optional `action` (ReactNode) for right-aligned buttons.

### Alert

```tsx
import { Alert } from './components/ui';

<Alert variant="danger" title="Error" dismissible onDismiss={() => setError(null)}>
  Failed to save focus
</Alert>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'info' \| 'success' \| 'warning' \| 'danger'` | `'info'` | Color and icon |
| `title` | `string` | -- | Bold title line |
| `dismissible` | `boolean` | `false` | Show close button |
| `onDismiss` | `() => void` | -- | Dismiss callback |

Uses `role="alert"` for screen readers. Icons auto-selected by variant.

### Badge

```tsx
import { Badge } from './components/ui';

<Badge variant="success" size="sm">Done</Badge>
```

| Prop | Type | Default |
|------|------|---------|
| `variant` | `'default' \| 'primary' \| 'success' \| 'warning' \| 'danger' \| 'info'` | `'default'` |
| `size` | `'sm' \| 'md'` | `'md'` |

### Dialog

```tsx
import { Dialog } from './components/ui';

<Dialog open={isOpen} onClose={() => setIsOpen(false)} title="Confirm Delete">
  <p>Are you sure?</p>
  <div className="flex gap-1.5 mt-2">
    <Button variant="danger" onClick={handleDelete}>Delete</Button>
    <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
  </div>
</Dialog>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `open` | `boolean` | required | Controls visibility |
| `onClose` | `() => void` | required | Called on backdrop click or Escape |
| `title` | `string` | -- | Dialog header title |

Features: focus trap, Escape to close, scroll lock, backdrop blur, `aria-modal`.

### Spinner

```tsx
import { Spinner } from './components/ui';

<Spinner size="lg" />
```

Sizes: `sm` (16px), `md` (24px), `lg` (40px). Uses `role="status"` and `aria-label="Loading"`.

---

## useForm Hook

Located at `src/hooks/useForm.ts`. Provides form state management with mixed validation strategies.

```tsx
import { useForm } from '../hooks/useForm';

const { getFieldProps, values, isValid, validate, reset } = useForm({
  title: {
    initialValue: '',
    rules: { required: 'Title is required' },
    strategy: 'blur',
  },
  email: {
    initialValue: '',
    rules: {
      required: 'Email is required',
      pattern: { value: /^[^\s@]+@[^\s@]+$/, message: 'Invalid email' },
    },
    strategy: 'realtime',
  },
});

// In JSX:
<Input {...getFieldProps('title')} label="Title" />
<Input {...getFieldProps('email')} label="Email" type="email" />
<Button onClick={() => { if (validate()) handleSubmit(values); }}>Submit</Button>
```

### Validation Strategies

| Strategy | Behavior |
|----------|----------|
| `submit` | Only validates when `validate()` is called explicitly |
| `blur` | Validates on blur after first touch |
| `realtime` | Validates on every change after first blur |

**Rule types:** `required`, `minLength`, `maxLength`, `pattern`, `custom`.

---

## Layout System

### Layout Component

Located at `src/components/layout/Layout.tsx`. Wraps the entire application with the sidebar and header.

```tsx
import { Layout } from './components/layout/Layout';

<Layout currentFeature={feature} onFeatureChange={setFeature}>
  {/* page content */}
</Layout>
```

The Layout manages sidebar open/close state internally. The sidebar uses the primary gradient background with white text.

### Dashboard Grid

The dashboard uses a responsive CSS Grid:

```tsx
<div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
  <div className="lg:col-span-2 space-y-3">
    {/* Primary content: FocusCard, TasksList */}
  </div>
  <div className="space-y-3">
    {/* Sidebar widgets: TimerWidget, WeatherWidget */}
  </div>
</div>
<div className="mt-3">
  {/* Full-width: UpcomingWidget */}
</div>
```

Mobile: single column. Desktop (lg+): 2/3 + 1/3 split.

---

## Error, Success, and Warning Patterns

### API Errors

All feature components follow this pattern:

```tsx
const [error, setError] = useState<string | null>(null);

// In catch block:
setError('Failed to load tasks');

// In JSX:
{error && (
  <Alert variant="danger" dismissible onDismiss={() => setError(null)} className="mb-2">
    {error}
  </Alert>
)}
```

### Loading States

- **Initial load (no data):** Show `Spinner` centered in the card, or a spinning border div.
- **Background refresh (data exists):** Keep existing content visible. Show refresh icon spinning (WeatherWidget pattern).
- **Button loading:** Use `Button`'s `loading` prop to show inline spinner and disable.

### Empty States

Use centered muted text:

```tsx
<p className="text-center text-surface-500 text-caption py-4">
  No tasks yet. Create one above!
</p>
```

---

## Accessibility Standards

- **Focus rings:** All focusable elements use `ring-2 ring-primary-500/50 ring-offset-2 ring-offset-surface-900` via the global `:focus-visible` rule.
- **Icon-only buttons:** Must have `aria-label` (e.g., `aria-label="Refresh weather"`).
- **Alerts:** Use `role="alert"` (built into the Alert component).
- **Dialog:** Uses `role="dialog"`, `aria-modal="true"`, `aria-label`, focus trap, and Escape to close.
- **Color contrast:** Text uses `surface-100` through `surface-300` on dark backgrounds, maintaining 4.5:1+ contrast ratios.
- **Keyboard navigation:** All interactive elements are reachable via Tab. Sidebar and Dialog implement focus trapping.

---

## Responsive Design

| Breakpoint | Width | Layout behavior |
|------------|-------|----------------|
| Default | < 640px | Single column, sidebar hidden (overlay on toggle) |
| `sm` | >= 640px | Increased horizontal padding |
| `lg` | >= 1024px | Sidebar visible, 3-column dashboard grid |

The sidebar is `fixed` on mobile (with backdrop overlay) and `static` on desktop. The main content area has `max-w-7xl` with auto margins.

---

## CSS Utilities

Defined in `src/styles/globals.css`:

| Class | Description |
|-------|-------------|
| `text-gradient` | Applies primary gradient as text color via `bg-clip-text` |
| `glass` | Glassmorphism effect: semi-transparent background + backdrop blur + border |
| `border-gradient` | Pseudo-element gradient border effect |
| `transition-base` | Standard transition: `all 200ms ease-in-out` |

---

## Animations

| Class | Duration | Use for |
|-------|----------|---------|
| `animate-fade-in` | 200ms | Card/alert entrance |
| `animate-slide-up` | 300ms | Content appearing from below |
| `animate-slide-down` | 300ms | Dropdown menus |
| `animate-scale-in` | 200ms | Dialog entrance |
| `animate-pulse-soft` | 2s infinite | Subtle attention indicator |

---

## File Structure

```
src/
  components/
    layout/
      Header.tsx        -- App header with branding and date
      Sidebar.tsx       -- Navigation sidebar with gradient background
      Layout.tsx        -- Root layout wrapper
    ui/
      index.ts          -- Barrel export for all UI primitives
      Button.tsx
      Input.tsx
      Textarea.tsx
      Select.tsx
      Alert.tsx
      Badge.tsx
      Card.tsx           -- Card + CardHeader
      Dialog.tsx
      Spinner.tsx
    FocusCard.tsx        -- Today's Focus feature
    NotesList.tsx        -- Notes CRUD feature
    TasksList.tsx        -- Tasks CRUD feature
    TimerWidget.tsx      -- Pomodoro timer widget
    WeatherWidget.tsx    -- Weather display widget
    UpcomingWidget.tsx   -- Upcoming events widget
  hooks/
    useForm.ts          -- Form state + validation hook
  lib/
    api.ts              -- API client and type definitions
  styles/
    globals.css         -- Tailwind directives, base styles, utilities
  App.tsx               -- Root component with routing
  main.tsx              -- Entry point
```

---

## Adding New Features

When adding a new feature to Larry:

1. **Create UI primitives first** in `src/components/ui/` if needed. Export from `index.ts`.
2. **Use existing components.** Wrap content in `Card variant="gradient"`. Use `CardHeader` for titles. Use `Alert` for errors. Use `Button` with appropriate variants.
3. **Follow the loading/error pattern** from existing components (useState for error/loading, Alert for display, Spinner for loading).
4. **Use the spacing grid.** Card content spacing is `space-y-2` or `space-y-3`. Form fields use `space-y-1.5`.
5. **Use semantic colors.** Match the meaning: `success` for completion, `warning` for caution, `danger` for errors/deletion, `info` for neutral data.
6. **Add to the dashboard grid** in `App.tsx` if the feature is a widget.
7. **Add to the sidebar** in `src/components/layout/Sidebar.tsx` if it's a full page feature.
8. **Test the build** with `npx tsc --noEmit && npx vite build` before committing.

---

## Git Workflow

### Commit Strategy

**Always commit new files and changes to git:**

1. **After creating a new file:** Immediately add and commit it
   ```bash
   git add src/components/NewFeature.tsx
   git commit -m "feat: add NewFeature component"
   ```

2. **After implementing a feature:** Commit with a descriptive message
   ```bash
   git commit -m "feat: implement weather widget refresh"
   ```

3. **After fixing a bug:** Use a fix commit
   ```bash
   git commit -m "fix: correct timer reset button behavior"
   ```

4. **After refactoring:** Use a refactor commit
   ```bash
   git commit -m "refactor: simplify task validation logic"
   ```

5. **After updating styles/design:** Use a style commit
   ```bash
   git commit -m "style: update button gradient colors"
   ```

### Commit Message Format

Follow the conventional commits pattern:
```
<type>: <short description>

<optional detailed description>
```

**Types:**
- `feat` -- New feature or component
- `fix` -- Bug fix
- `refactor` -- Code restructuring without changing functionality
- `style` -- Styling or CSS changes
- `docs` -- Documentation updates
- `test` -- Test additions or changes
- `chore` -- Build, dependencies, or tooling changes

### Best Practices

- ✅ **Commit early and often** -- Each logical change gets its own commit
- ✅ **One feature per commit** -- Don't mix unrelated changes
- ✅ **Write clear messages** -- Future developers (and future you) will thank you
- ✅ **Test before committing** -- Run `npm run build` and verify no TypeScript errors
- ✅ **Use git status** -- Always check what you're committing with `git status` and `git diff`
- ✅ **Keep commits small** -- Easier to review, easier to revert if needed
- ❌ **Don't wait** -- Don't accumulate uncommitted changes. Commit after each logical step
- ❌ **Don't commit broken code** -- Only commit code that compiles and runs
