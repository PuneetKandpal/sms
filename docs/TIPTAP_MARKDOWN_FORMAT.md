# Tiptap Markdown Format Guide for LLM Output

This document describes the exact markdown format that should be used when generating content for the TiptapMarkdownViewer component.

## Overview

The TiptapMarkdownViewer is a rich markdown editor/viewer that supports:
- Standard markdown formatting
- Interactive color swatches with color pickers
- Image previews (data URIs and external URLs)
- Clickable links
- Tables, task lists, and more

## Markdown Syntax Reference

### 1. Headings

```markdown
# Heading 1
## Heading 2
### Heading 3
```

**Example:**
```markdown
# Project Brand Guide
## Color Palette
### Primary Colors
```

---

### 2. Text Formatting

```markdown
**Bold text**
*Italic text*
~~Strikethrough text~~
`Inline code`
```

**Example:**
```markdown
The brand uses **bold typography** with *subtle italics* for emphasis.
Use `#A4CEFE` for the primary color.
```

---

### 3. Color Swatches (IMPORTANT)

**Format:** Simply write hex color codes in the text. They will automatically be converted to interactive color swatches.

```markdown
Primary Color: #A4CEFE
Secondary Color: #072446
Accent Color: #FF5733
Background: #F5F5F5
Text: #333333
```

**Supported formats:**
- 6-digit hex: `#A4CEFE` ✅
- 3-digit hex: `#FFF` ✅
- Must have # symbol
- Case insensitive (#a4cefe or #A4CEFE both work)

**Example in context:**
```markdown
## Brand Colors

Our primary brand color is #A4CEFE, which represents trust and innovation.
The secondary color #072446 provides contrast and depth.
For call-to-action buttons, use #FF5733.
```

**Visual result:** Each hex code will appear as a colored circle with the hex value next to it, clickable to change the color.

---

### 4. Images

**Format 1: External URLs**
```markdown
![Alt text](https://example.com/image.png)
```

**Format 2: Data URIs (for SVG, base64 images)**
```markdown
![Logo](data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E...%3C%2Fsvg%3E)

![Icon](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...)
```

**Example:**
```markdown
## Company Logo

![Company Logo](https://example.com/logo.png)

## Favicon

![Favicon](https://developer.mozilla.org/favicon.ico)

## SVG Icon

![Arrow Icon](data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%3E%3Cpath%20d%3D%22M12%202l8%208-8%208-8-8z%22%2F%3E%3C%2Fsvg%3E)
```

---

### 5. Links

```markdown
[Link text](https://example.com)
[Visit our website](https://company.com)
```

**Example:**
```markdown
Learn more about our brand guidelines at [Brand Portal](https://brand.company.com).
```

---

### 6. Lists

**Unordered lists:**
```markdown
- Item 1
- Item 2
  - Nested item 2.1
  - Nested item 2.2
- Item 3
```

**Ordered lists:**
```markdown
1. First item
2. Second item
3. Third item
```

**Example:**
```markdown
## Design Principles

1. **Simplicity** - Keep interfaces clean and minimal
2. **Consistency** - Use the same patterns throughout
3. **Accessibility** - Ensure everyone can use our products
```

---

### 7. Task Lists

```markdown
- [ ] Incomplete task
- [x] Completed task
- [ ] Another task
```

**Example:**
```markdown
## Brand Implementation Checklist

- [x] Define color palette
- [x] Create logo variations
- [ ] Design business cards
- [ ] Update website with new branding
```

---

### 8. Blockquotes

```markdown
> This is a blockquote
> It can span multiple lines
```

**Example:**
```markdown
> "Simplicity is the ultimate sophistication."
> — Leonardo da Vinci
```

---

### 9. Code Blocks

**Inline code:**
```markdown
Use the `background-color` property in CSS.
```

**Code blocks:**
````markdown
```css
.primary-button {
  background-color: #A4CEFE;
  color: #FFFFFF;
  padding: 12px 24px;
}
```
````

---

### 10. Tables

```markdown
| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |
```

**Example:**
```markdown
## Color Usage Guide

| Element | Primary Color | Text Color | Usage |
|---------|--------------|------------|-------|
| Buttons | #A4CEFE | #FFFFFF | Call-to-action |
| Headers | #072446 | #FFFFFF | Section titles |
| Links | #0066CC | - | Hyperlinks |
```

---

### 11. Horizontal Rules

```markdown
---
```

---

### 12. Highlights

```markdown
This is ==highlighted text==
```

**Example:**
```markdown
Remember to ==always use the brand colors== in all marketing materials.
```

---

## Complete Example: Brand Guidelines Document

Here's a complete example of how to structure a brand guidelines document:

```markdown
# XYZ Company Brand Guidelines

## Introduction

Welcome to the XYZ Company brand guidelines. These guidelines ensure consistency across all our communications.

---

## Color Palette

### Primary Colors

Our primary brand color is #A4CEFE. This color represents trust, innovation, and clarity.

![Primary Color Swatch](data:image/svg+xml;utf8,%3Csvg%20width%3D%22100%22%20height%3D%22100%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20fill%3D%22%23A4CEFE%22%2F%3E%3C%2Fsvg%3E)

### Secondary Colors

- Dark Blue: #072446
- Accent: #FF5733
- Neutral Gray: #F5F5F5

### Usage Guidelines

| Element Type | Color Code | Usage |
|-------------|-----------|--------|
| Primary CTA | #A4CEFE | Main action buttons |
| Headers | #072446 | Page titles, navigation |
| Alerts | #FF5733 | Error states, important notices |

---

## Typography

**Headings:** Use bold, large typography for impact

*Body Text:* Keep it clean and readable with our standard font

```css
h1 {
  font-family: 'Inter', sans-serif;
  color: #072446;
}
```

---

## Logo Usage

![Company Logo](https://company.com/assets/logo.png)

### Logo Variations

- [ ] Full color logo on white background
- [x] White logo on dark background
- [ ] Monochrome version for print

> **Important:** Always maintain minimum clear space around the logo of 20px.

---

## Implementation Checklist

Before launching any branded material, ensure:

1. All colors match the specified hex codes
2. Logo is properly sized and positioned
3. Typography follows the hierarchy
4. Images are high-resolution

---

## Resources

Visit our [Brand Portal](https://brand.company.com) for downloadable assets.

For questions, contact the design team at design@company.com.
```

---

## LLM Prompt Template

When instructing an LLM to generate markdown for the TiptapMarkdownViewer, use this prompt template:

### Prompt Template:

```
Generate a comprehensive markdown document about [TOPIC] following these exact formatting rules:

1. **Color Codes**: Write all color references as hex codes (e.g., #A4CEFE). Do NOT use color names. Always include the # symbol.

2. **Images**: 
   - For external images: Use ![alt text](URL)
   - For data URIs: Use ![alt text](data:image/...)
   - Always include descriptive alt text

3. **Headings**: Use proper markdown heading hierarchy (# for H1, ## for H2, ### for H3)

4. **Lists**: Use proper markdown list syntax with - for bullets or 1. for numbered

5. **Tables**: Format tables with | separators and header rows

6. **Code**: Use backticks for inline code and triple backticks for code blocks

7. **Links**: Format as [text](URL)

8. **Task Lists**: Use - [ ] for incomplete and - [x] for complete

9. **Emphasis**: Use **bold**, *italic*, and ==highlight== as appropriate

Include the following sections:
- [List specific sections needed]

Make sure all hex color codes are prominently featured and properly formatted with the # symbol.
```

### Example LLM Prompt:

```
Generate a brand guidelines document in markdown format for a tech startup called "InnovateTech". 

Requirements:
- Include a color palette section with hex codes for primary (#4F46E5), secondary (#10B981), and accent (#F59E0B) colors
- Add logo image using this URL: https://example.com/logo.png
- Include typography guidelines
- Create a table showing color usage for different UI elements
- Add a checklist for brand implementation
- Use proper markdown formatting throughout

Remember:
- Write ALL colors as hex codes with # symbol
- Use markdown image syntax for the logo
- Format tables properly with header rows
- Include at least 5 specific hex color codes
```

---

## Best Practices

1. **Always use hex codes for colors** - Never write "blue" or "red", always use #RRGGBB format
2. **Test image URLs** - Ensure image URLs are accessible and not blocked by CORS
3. **Use descriptive alt text** - Important for accessibility
4. **Proper markdown syntax** - Follow standard markdown conventions
5. **Consistent formatting** - Use the same patterns throughout the document
6. **Include visual hierarchy** - Use headings, lists, and spacing effectively

---

## Component Props Reference

When using the TiptapMarkdownViewer component:

```jsx
<TiptapMarkdownViewer 
  content={markdownString}           // Your markdown content
  initialMode="preview"              // "preview" or "edit"
  showToolbar={true}                 // Show editing toolbar in edit mode
  showBubbleMenu={true}              // Show floating menu on text selection
  showModeToggle={true}              // Show preview/edit toggle button
  onContentChange={(html) => {}}     // Callback when content changes
  className=""                       // Additional CSS classes
/>
```

**Props:**
- `content` (string, required): The markdown content to display
- `initialMode` (string): Start in "preview" or "edit" mode (default: "preview")
- `showToolbar` (boolean): Display the editing toolbar (default: true)
- `showBubbleMenu` (boolean): Show floating toolbar on selection (default: true)
- `showModeToggle` (boolean): Display mode toggle button (default: true)
- `onContentChange` (function): Called when content is edited
- `className` (string): Additional CSS classes

---

## Troubleshooting

### Colors not appearing as swatches?
- Ensure hex codes have the # symbol
- Use 3 or 6 character hex codes (not 8 with alpha)
- Format: `#A4CEFE` not `A4CEFE` or `0xA4CEFE`

### Images not showing?
- Check URL is accessible
- For data URIs, ensure proper encoding
- Verify image format is supported (jpg, png, svg, gif, etc.)

### Tables not rendering?
- Ensure header separator row has correct format: `|---|---|---|`
- Each row must have same number of columns

---

## Summary for LLMs

When generating markdown for TiptapMarkdownViewer:

✅ **DO:**
- Use hex codes for ALL colors (#A4CEFE)
- Include # symbol in hex codes
- Use standard markdown image syntax
- Format tables with proper separators
- Use descriptive headings
- Include alt text for images
- Test that URLs are accessible

❌ **DON'T:**
- Use color names instead of hex codes
- Forget the # symbol in hex codes
- Use invalid markdown syntax
- Use 8-character hex codes with alpha
- Reference local file paths for images
- Use HTML directly (stick to markdown)

---

This format ensures all features of the TiptapMarkdownViewer work correctly!
