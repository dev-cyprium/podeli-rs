---
description: Color palette to use throughout the application
alwaysApply: true
---

# Color Palette

Always use this exact color palette when working with colors, styling, or design:

## Primary Colors

- **Orange/Yellow**: `#f0a202` - Primary accent color, CTAs, highlights
- **Dark Blue/Black**: `#02020a` - Primary text, dark backgrounds
- **Light Purple/White**: `#f8f7ff` - Light backgrounds, cards
- **Blue**: `#006992` - Secondary accent, links, info elements
- **Red**: `#dd1c1a` - Errors, warnings, destructive actions

## Usage Guidelines

- Use `#f0a202` for primary buttons, active states, and key interactive elements
- Use `#02020a` for body text, headings, and dark UI elements
- Use `#f8f7ff` for page backgrounds, card backgrounds, and light surfaces
- Use `#006992` for secondary actions, links, and informational elements
- Use `#dd1c1a` for error states, validation messages, and destructive buttons

## Tailwind CSS Equivalents

When using Tailwind, create custom colors or use the hex values directly:
- `#f0a202` - Custom orange
- `#02020a` - Custom dark (darker than slate-900)
- `#f8f7ff` - Custom light (lighter than slate-50)
- `#006992` - Custom blue
- `#dd1c1a` - Custom red

## Examples

```tsx
// Primary button
<button className="bg-[#f0a202] text-white">Click me</button>

// Text
<p className="text-[#02020a]">Main content</p>

// Background
<div className="bg-[#f8f7ff]">Light surface</div>

// Link
<a className="text-[#006992]">Learn more</a>

// Error
<span className="text-[#dd1c1a]">Error message</span>
```

**Always prefer these colors over default Tailwind colors or other palettes.**
