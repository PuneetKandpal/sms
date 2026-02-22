'use client';

import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import { mergeAttributes, Node } from '@tiptap/core';
import { StarterKit } from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Highlight from '@tiptap/extension-highlight';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Typography from '@tiptap/extension-typography';
import TaskList from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { TextAlign } from '@tiptap/extension-text-align';
import { marked } from 'marked';
import TurndownService from 'turndown';
import { gfm } from '@joplin/turndown-plugin-gfm';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Slider from '@mui/material/Slider';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import {
  IconBold,
  IconItalic,
  IconStrikethrough,
  IconCode,
  IconList,
  IconListNumbers,
  IconBlockquote,
  IconArrowBackUp,
  IconArrowForwardUp,
  IconLink,
  IconPhoto,
  IconHighlight,
  IconAlignLeft,
  IconAlignCenter,
  IconAlignRight,
  IconAlignJustified,
  IconPlus,
  IconMaximize,
  IconX,
  IconChevronDown,
  IconLock,
  IconLockOpen,
  IconDeviceFloppy,
  IconUnderline,
  IconSuperscript,
  IconSubscript,
  IconCopy,
  IconLetterA,
  IconTrash,
  IconShieldCheck,
  IconHistory,
  IconClockHour5,
} from '@tabler/icons-react';

const clampByte = (n) => Math.max(0, Math.min(255, Math.round(Number(n) || 0)));

const normalizeHexColor = (value) => {
  const raw = String(value || '').trim();
  const withHash = raw.startsWith('#') ? raw : `#${raw}`;
  if (/^#[0-9a-fA-F]{3}$/.test(withHash)) {
    const r = withHash[1];
    const g = withHash[2];
    const b = withHash[3];
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  if (/^#[0-9a-fA-F]{6}$/.test(withHash)) {
    return withHash.toLowerCase();
  }
  return null;
};

const hexToRgb = (hex) => {
  const normalized = normalizeHexColor(hex) || '#000000';
  const r = parseInt(normalized.slice(1, 3), 16);
  const g = parseInt(normalized.slice(3, 5), 16);
  const b = parseInt(normalized.slice(5, 7), 16);
  return { r, g, b };
};

const rgbToHex = (r, g, b) => {
  const rr = clampByte(r).toString(16).padStart(2, '0');
  const gg = clampByte(g).toString(16).padStart(2, '0');
  const bb = clampByte(b).toString(16).padStart(2, '0');
  return `#${rr}${gg}${bb}`;
};

const ColorSlider = ({ label, value, onChange }) => (
  <div className="color-slider-modern">
    <div className="color-slider-info">
      <span className="color-slider-label">{label}</span>
      <span className="color-slider-value">{value}</span>
    </div>
    <input
      type="range"
      min="0"
      max="255"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="color-slider-input"
      style={{
        background: `linear-gradient(to right, rgb(${label === 'R' ? '0' : label === 'G' ? '0' : '0'}, ${label === 'R' ? '0' : label === 'G' ? '0' : '0'}, ${label === 'R' ? '0' : label === 'G' ? '0' : '0'}), rgb(${label === 'R' ? '255' : '0'}, ${label === 'G' ? '255' : '0'}, ${label === 'B' ? '255' : '0'}), rgb(${label === 'R' ? '255' : '255'}, ${label === 'G' ? '255' : '255'}, ${label === 'B' ? '255' : '255'}))`,
      }}
    />
  </div>
);

// Custom Color Swatch Node
const ColorSwatch = Node.create({
  name: 'colorSwatch',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      color: {
        default: '#000000',
        parseHTML: element => element.getAttribute('data-color'),
        renderHTML: attributes => {
          return {
            'data-color': attributes.color,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-color-swatch]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { 'data-color-swatch': '' })];
  },

  addNodeView() {
    return ({ node, editor, getPos }) => {
      const dom = document.createElement('span');
      dom.className = 'color-swatch-wrapper';
      dom.style.cursor = editor?.isEditable ? 'pointer' : 'default';

      const swatch = document.createElement('span');
      swatch.className = 'color-swatch';
      swatch.style.backgroundColor = node.attrs.color;
      swatch.setAttribute('data-color', node.attrs.color);
      
      const text = document.createElement('span');
      text.className = 'color-swatch-text';
      text.textContent = node.attrs.color;
      
      dom.appendChild(swatch);
      dom.appendChild(text);

      let currentNode = node;
      const applyColorToDom = (nextColor) => {
        swatch.style.backgroundColor = nextColor;
        swatch.setAttribute('data-color', nextColor);
        text.textContent = nextColor;
      };

      dom.onclick = (e) => {
        if (!editor?.isEditable) {
          return;
        }
        e.stopPropagation();
        const pos = typeof getPos === 'function' ? getPos() : null;
        window.dispatchEvent(
          new CustomEvent('tiptap-color-swatch-open', {
            detail: {
              color: currentNode?.attrs?.color,
              pos,
            },
          })
        );
      };

      return {
        dom,
        update: (updatedNode) => {
          if (!updatedNode || updatedNode.type !== currentNode.type) {
            return false;
          }

          currentNode = updatedNode;
          applyColorToDom(updatedNode.attrs.color);
          return true;
        },
      };
    };
  },
});

const TiptapMarkdownViewer = ({ 
  content, 
  editable = true, 
  onContentChange,
  lockStatus,
  onAcquireLock,
  onReleaseLock,
  isAcquiringLock,
  onRequestEdit,
  showToolbar = true,
  showBubbleMenu = true,
  showModeToggle = true,
  initialMode = 'preview',
  className = '',
  defaultTheme = 'light',
  theme: controlledTheme,
  onThemeChange,
  showExpandButton = true,
  filename,
  forcePreviewKey,
  expandedStatusBarProps,
}) => {
  const [mode, setMode] = useState(initialMode);
  const isEditable = mode === 'edit' && editable;
  const [theme, setTheme] = useState('light');
  const [isExpanded, setIsExpanded] = useState(false);

  const modeRef = useRef(mode);
  const isExpandedRef = useRef(isExpanded);

  const contentChangeTimerRef = useRef(null);
  const lastScrollRestoreRef = useRef({ winY: 0, containerY: 0, container: null, when: 0 });
  const lastSyncedHtmlRef = useRef(null);
  const scrollContainerRef = useRef(null);

  const turndownService = useMemo(() => {
    const service = new TurndownService({
      headingStyle: 'atx',
      hr: '---',
      bulletListMarker: '-',
      codeBlockStyle: 'fenced',
      emDelimiter: '_',
      strongDelimiter: '**',
    });

    service.use(gfm);
    return service;
  }, []);

  const getScrollContainer = useCallback(() => scrollContainerRef.current, []);

  const isDebugEnabled = () => {
    if (typeof window === 'undefined') return false;
    try {
      return window.localStorage?.getItem('TP_DEBUG') === '1';
    } catch (e) {
      return false;
    }
  };

  const debugLog = (...args) => {
    if (!isDebugEnabled()) return;
    // eslint-disable-next-line no-console
    console.log('[TiptapMarkdownViewer]', ...args);
  };

  const handleModeChange = useCallback(
    async (next) => {
      if (!next) return;

      if (next === 'edit') {
        const request = onRequestEdit || onAcquireLock;

        if (!editable && request) {
          const ok = await request();
          if (ok) {
            setMode('edit');
          } else {
            setMode('preview');
          }
          return;
        }

        if (editable && onRequestEdit) {
          const ok = await onRequestEdit();
          if (ok === false) {
            setMode('preview');
            return;
          }
        }

        if (editable) {
          setMode('edit');
        } else {
          setMode('preview');
        }
        return;
      }

      // Switch to preview mode WITHOUT releasing the lock
      setMode('preview');
    },
    [editable, onAcquireLock, onRequestEdit]
  );

  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [colorDialogOpen, setColorDialogOpen] = useState(false);
  const [colorDraft, setColorDraft] = useState('#000000');
  const [colorTargetPos, setColorTargetPos] = useState(null);
  const [colorTargetKind, setColorTargetKind] = useState('swatch');
  const colorInputRef = useRef(null);
  const [addMenuAnchorPos, setAddMenuAnchorPos] = useState(null);
  const isAddMenuOpen = Boolean(addMenuAnchorPos);
  const [headingMenuAnchorPos, setHeadingMenuAnchorPos] = useState(null);
  const isHeadingMenuOpen = Boolean(headingMenuAnchorPos);

  const setThemeSafe = useCallback(() => {
    setTheme('light');
    onThemeChange?.('light');
  }, [onThemeChange]);

  useEffect(() => {
    setTheme('light');
  }, [controlledTheme]);

  useEffect(() => {
    if (typeof forcePreviewKey === 'undefined') return;
    setMode('preview');
  }, [forcePreviewKey]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (!isExpanded) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isExpanded]);

  useEffect(() => {
    if (!isExpanded) return;
    const handler = (e) => {
      if (e.key === 'Escape') {
        setIsExpanded(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isExpanded]);

  // Process markdown and replace hex codes (plain, backtick-wrapped, or image swatch markdown) with color swatch placeholders
  const processedContent = useMemo(() => {
    if (!content) return '';

    const SWATCH_TOKEN = '__SWATCH__';
    const tokens = [];
    const makeToken = (hex) => {
      const token = `${SWATCH_TOKEN}${tokens.length}__`;
      tokens.push(hex);
      return token;
    };

    // Helper to normalize hex strings (with or without leading #)
    const normalizeHex = (value) => {
      if (!value) return null;
      const hex = value.replace(/^#/, '');
      return /^[0-9a-fA-F]{3,6}$/.test(hex) ? hex.toUpperCase() : null;
    };

    // Start with the raw content
    let processedText = content;

    // 0) Collapse previously inserted color swatch spans back into tokens
    processedText = processedText.replace(
      /<span\s+[^>]*data-color-swatch[^>]*>(.*?)<\/span>/gi,
      (match) => {
        const attrMatch = match.match(/data-color\s*=\s*"(#?[0-9a-fA-F]{3,6})"/i);
        const textMatch = match.match(/#([0-9a-fA-F]{3,6})/i);
        const hex =
          normalizeHex(attrMatch?.[1]) ||
          (textMatch ? textMatch[1].toUpperCase() : null);
        if (!hex) return match;
        return makeToken(hex);
      }
    );

    // 1) Replace placeholder markdown images like ![Primary Color](Primary Color) with plain text
    processedText = processedText.replace(
      /!\[([^\]]+)\]\(([^)]+)\)/g,
      (match, alt, src) => {
        const normalizedAlt = (alt || '').trim();
        const normalizedSrc = (src || '').trim();
        if (normalizedAlt && normalizedSrc && normalizedAlt === normalizedSrc) {
          return normalizedAlt;
        }
        return match;
      }
    );

    // 2) If the markdown has both image swatch + backtick literal for same hex, collapse to a single swatch
    processedText = processedText.replace(
      /!\[#([0-9A-Fa-f]{3,6})\]\([^)]+\)\s*`#\1`/g,
      (_, hex) => makeToken(hex)
    );

    // 3) Replace markdown image swatches like ![#A4CEFE](...) with tokens
    processedText = processedText.replace(
      /!\[#([0-9A-Fa-f]{3,6})\]\([^)]+\)/g,
      (_, hex) => makeToken(hex)
    );

    // 4) Replace backtick-wrapped hex codes `#A4CEFE` with tokens
    processedText = processedText.replace(
      /`#([0-9A-Fa-f]{3,6})`/g,
      (_, hex) => makeToken(hex)
    );

    // 5) Replace plain hex codes #A4CEFE with tokens
    processedText = processedText.replace(
      /#([0-9A-Fa-f]{3,6})\b/g,
      (_, hex) => makeToken(hex)
    );

    // 6) Expand tokens into color-swatch spans
    processedText = processedText.replace(
      new RegExp(`${SWATCH_TOKEN}(\\d+)__`, 'g'),
      (_, idx) => {
        const hex = tokens[Number(idx)] || '';
        return `<span data-color-swatch data-color="#${hex}">#${hex}</span>`;
      }
    );

    return processedText;
  }, [content]);

  const htmlContent = useMemo(() => {
    if (!processedContent) return '';
    try {
      marked.setOptions({
        gfm: true,
        breaks: true,
      });
      return marked.parse(processedContent);
    } catch (error) {
      console.error('Error parsing markdown:', error);
      return processedContent;
    }
  }, [processedContent]);

  const initialHtmlRef = useRef(htmlContent);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    isExpandedRef.current = isExpanded;
  }, [isExpanded]);

  useEffect(() => {
    if (!isExpanded && theme !== 'light') {
      setThemeSafe('light');
    }
  }, [isExpanded, theme, setThemeSafe]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: false,
        underline: false,
        hardBreak: false,
        paragraph: {
          HTMLAttributes: {
            class: 'tiptap-paragraph',
          },
        },
      }),
      TextStyle,
      Color,
      Underline,
      Subscript,
      Superscript,
      ColorSwatch,
      Table.configure({
        resizable: false,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Link.configure({
        openOnClick: true,
        linkOnPaste: true,
        HTMLAttributes: {
          class: 'text-blue-600 hover:underline cursor-pointer',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg my-4',
        },
      }),
      Highlight.configure({
        multicolor: true,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Typography,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
    ],
    // Important: keep initial content stable to avoid editor re-creation on every parent render.
    // We sync external content via the preview-mode effect below.
    content: initialHtmlRef.current,
    editable: isEditable,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'tiptap-viewer prose prose-sm sm:prose lg:prose-lg max-w-none focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      const container = getScrollContainer();
      const containerY = container ? container.scrollTop : 0;

      lastScrollRestoreRef.current = {
        winY: 0,
        containerY,
        container,
        when: Date.now(),
      };

      debugLog('onUpdate', {
        mode: modeRef.current,
        isExpanded: isExpandedRef.current,
        containerY,
        activeTag: typeof document !== 'undefined' ? document.activeElement?.tagName : null,
      });

      if (onContentChange) {
        if (contentChangeTimerRef.current) {
          clearTimeout(contentChangeTimerRef.current);
        }

        contentChangeTimerRef.current = setTimeout(() => {
          const html = editor.getHTML();
          const plainText = editor.getText();
          const isSimpleParagraph = html.trim().match(/^<p>([\s\S]*?)<\/p>$/);

          if (isSimpleParagraph) {
            onContentChange((plainText || '').trim());
            return;
          }

          try {
            const markdown = turndownService.turndown(html);
            onContentChange((markdown || '').trim());
          } catch (error) {
            console.error('Error converting HTML to markdown:', error);
            onContentChange((plainText || '').trim());
          }
        }, 150);
      }

      const restore = (phase) => {
        const snap = lastScrollRestoreRef.current;
        if (snap.container && snap.container.scrollTop !== snap.containerY) {
          snap.container.scrollTop = snap.containerY;
        }
        debugLog('restoreScroll', phase, {
          containerY_before: snap.container?.scrollTop,
          containerY_target: snap.containerY,
        });
      };

      if (typeof window !== 'undefined' && modeRef.current !== 'edit') {
        requestAnimationFrame(() => {
          restore('raf1');
          requestAnimationFrame(() => restore('raf2'));
        });
      }
    },
  }, []);

  const openTextColorDialog = useCallback(() => {
    if (!editor) return;
    const current = editor.getAttributes('textStyle')?.color;
    setColorDraft(current || '#000000');
    setColorTargetPos(null);
    setColorTargetKind('text');
    setColorDialogOpen(true);
  }, [editor]);

  const openHighlightColorDialog = useCallback(() => {
    if (!editor) return;
    const current = editor.getAttributes('highlight')?.color;
    setColorDraft(current || '#ffff00');
    setColorTargetPos(null);
    setColorTargetKind('highlight');
    setColorDialogOpen(true);
  }, [editor]);

  useEffect(() => {
    return () => {
      if (contentChangeTimerRef.current) {
        clearTimeout(contentChangeTimerRef.current);
        contentChangeTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!editor) return;
    if (mode === 'edit') return;
    if (typeof htmlContent === 'undefined') return;

    // Prevent re-setting identical content (which resets scroll/selection).
    if (lastSyncedHtmlRef.current === htmlContent) return;

    const container = getScrollContainer();
    const prevScrollTop = container ? container.scrollTop : 0;
    const prevSelection = editor.state.selection;

    // Sync without emitting update events to avoid feedback loops.
    editor.commands.setContent(htmlContent, false);
    lastSyncedHtmlRef.current = htmlContent;

    // Restore selection + scroll after ProseMirror has applied the new doc.
    if (typeof window !== 'undefined') {
      requestAnimationFrame(() => {
        try {
          if (prevSelection?.from != null) {
            editor.commands.setTextSelection({
              from: Math.min(prevSelection.from, editor.state.doc.content.size),
              to: Math.min(prevSelection.to, editor.state.doc.content.size),
            });
          }
        } catch (e) {
          // ignore
        }
        if (container) container.scrollTop = prevScrollTop;
      });
    }
  }, [htmlContent, editor, mode]);

  useEffect(() => {
    if (editor && editor.isEditable !== isEditable) {
      editor.setEditable(isEditable);
    }
  }, [isEditable, editor]);

  useEffect(() => {
    const handler = (e) => {
      const nextColor = typeof e?.detail?.color === 'string' ? e.detail.color : '#000000';
      setColorDraft(nextColor);
      setColorTargetPos(e?.detail?.pos ?? null);
      setColorTargetKind('swatch');
      setColorDialogOpen(true);
    };

    window.addEventListener('tiptap-color-swatch-open', handler);
    return () => window.removeEventListener('tiptap-color-swatch-open', handler);
  }, []);

  const openLinkDialog = useCallback(() => {
    if (!editor) return;
    const currentHref = editor.getAttributes('link')?.href || '';
    setLinkUrl(currentHref);
    setLinkDialogOpen(true);
  }, [editor]);

  const openImageDialog = useCallback(() => {
    if (!editor) return;
    setImageUrl('');
    setImageAlt('');
    setImageDialogOpen(true);
  }, [editor]);

  if (!editor) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse text-gray-500">Loading editor...</div>
      </div>
    );
  }

  const BubbleMenuBar = () => {
    if (!editor || !showBubbleMenu || mode !== 'edit') return null;

    return (
      <BubbleMenu 
        editor={editor} 
        className="tiptap-bubble-menu"
      >
        <div className="bubble-menu-content">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive('bold') ? 'is-active' : ''}
            title="Bold"
          >
            <IconBold size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive('italic') ? 'is-active' : ''}
            title="Italic"
          >
            <IconItalic size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={editor.isActive('strike') ? 'is-active' : ''}
            title="Strikethrough"
          >
            <IconStrikethrough size={18} />
          </button>
          <button
            onClick={openHighlightColorDialog}
            className={editor.isActive('highlight') ? 'is-active' : ''}
            title="Highlight color"
          >
            <IconHighlight size={18} />
          </button>

          <button
            onClick={openTextColorDialog}
            className={editor.getAttributes('textStyle')?.color ? 'is-active' : ''}
            title="Text color"
          >
            <IconLetterA size={18} />
          </button>

          <button
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={editor.isActive('code') ? 'is-active' : ''}
            title="Inline Code"
          >
            <IconCode size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={editor.isActive('underline') ? 'is-active' : ''}
            title="Underline"
          >
            <IconUnderline size={18} />
          </button>
          <button
            onClick={openLinkDialog}
            className={editor.isActive('link') ? 'is-active' : ''}
            title="Link"
          >
            <IconLink size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleSuperscript().run()}
            className={editor.isActive('superscript') ? 'is-active' : ''}
            title="Superscript"
          >
            <IconSuperscript size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleSubscript().run()}
            className={editor.isActive('subscript') ? 'is-active' : ''}
            title="Subscript"
          >
            <IconSubscript size={18} />
          </button>
        </div>
      </BubbleMenu>
    );
  };

  const MenuBar = () => {
    if (!editor || !showToolbar || mode !== 'edit') return null;

    return (
      <div className="tiptap-toolbar">
        <div className="toolbar-group">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive('bold') ? 'is-active' : ''}
            title="Bold"
          >
            <IconBold size={20} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive('italic') ? 'is-active' : ''}
            title="Italic"
          >
            <IconItalic size={20} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={editor.isActive('strike') ? 'is-active' : ''}
            title="Strikethrough"
          >
            <IconStrikethrough size={20} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={editor.isActive('code') ? 'is-active' : ''}
            title="Code"
          >
            <IconCode size={20} />
          </button>
        </div>

        <div className="toolbar-separator" />

        <div className="toolbar-group">
          <button
            type="button"
            className={editor.isActive('heading') ? 'is-active' : ''}
            onClick={(e) => {
              setHeadingMenuAnchorPos({
                top: e.clientY,
                left: e.clientX,
              });
            }}
            title="Heading"
          >
            <span style={{ fontWeight: 800 }}>H</span>
          </button>
          <Menu
            anchorReference="anchorPosition"
            anchorPosition={headingMenuAnchorPos}
            open={isHeadingMenuOpen}
            onClose={() => setHeadingMenuAnchorPos(null)}
            sx={{ zIndex: 2002 }}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'left',
            }}
            PaperProps={{
              sx: {
                bgcolor: '#ffffff',
                color: '#111827',
                border: '1px solid rgba(0,0,0,0.08)',
              },
            }}
          >
            <MenuItem
              onClick={() => {
                setHeadingMenuAnchorPos(null);
                editor.chain().focus().setParagraph().run();
              }}
            >
              Paragraph
            </MenuItem>
            <MenuItem
              onClick={() => {
                setHeadingMenuAnchorPos(null);
                editor.chain().focus().toggleHeading({ level: 1 }).run();
              }}
            >
              Heading 1
            </MenuItem>
            <MenuItem
              onClick={() => {
                setHeadingMenuAnchorPos(null);
                editor.chain().focus().toggleHeading({ level: 2 }).run();
              }}
            >
              Heading 2
            </MenuItem>
            <MenuItem
              onClick={() => {
                setHeadingMenuAnchorPos(null);
                editor.chain().focus().toggleHeading({ level: 3 }).run();
              }}
            >
              Heading 3
            </MenuItem>
          </Menu>
        </div>

        <div className="toolbar-separator" />

        <div className="toolbar-group">
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={editor.isActive('bulletList') ? 'is-active' : ''}
            title="Bullet List"
          >
            <IconList size={20} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={editor.isActive('orderedList') ? 'is-active' : ''}
            title="Numbered List"
          >
            <IconListNumbers size={20} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={editor.isActive('blockquote') ? 'is-active' : ''}
            title="Blockquote"
          >
            <IconBlockquote size={20} />
          </button>
        </div>

        <div className="toolbar-separator" />

        <div className="toolbar-group">
          <button
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={editor.isActive({ textAlign: 'left' }) ? 'is-active' : ''}
            title="Align Left"
          >
            <IconAlignLeft size={20} />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={editor.isActive({ textAlign: 'center' }) ? 'is-active' : ''}
            title="Align Center"
          >
            <IconAlignCenter size={20} />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={editor.isActive({ textAlign: 'right' }) ? 'is-active' : ''}
            title="Align Right"
          >
            <IconAlignRight size={20} />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            className={editor.isActive({ textAlign: 'justify' }) ? 'is-active' : ''}
            title="Justify"
          >
            <IconAlignJustified size={20} />
          </button>
        </div>

        <div className="toolbar-separator" />

        <div className="toolbar-group">
          <button onClick={openLinkDialog} title="Add Link">
            <IconLink size={20} />
          </button>
          <button
            onClick={openImageDialog}
            title="Add Image"
          >
            <IconPhoto size={20} />
          </button>
          <button
            onClick={openHighlightColorDialog}
            className={editor.isActive('highlight') ? 'is-active' : ''}
            title="Highlight color"
          >
            <IconHighlight size={20} />
          </button>

          <button
            onClick={openTextColorDialog}
            className={editor.getAttributes('textStyle')?.color ? 'is-active' : ''}
            title="Text color"
          >
            <IconLetterA size={20} />
          </button>

          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={editor.isActive('underline') ? 'is-active' : ''}
            title="Underline"
          >
            <IconUnderline size={20} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleSuperscript().run()}
            className={editor.isActive('superscript') ? 'is-active' : ''}
            title="Superscript"
          >
            <IconSuperscript size={20} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleSubscript().run()}
            className={editor.isActive('subscript') ? 'is-active' : ''}
            title="Subscript"
          >
            <IconSubscript size={20} />
          </button>
        </div>

        <div className="toolbar-separator" />

        <div className="toolbar-group">
          <button
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo"
          >
            <IconArrowBackUp size={20} />
          </button>
          <button
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Redo"
          >
            <IconArrowForwardUp size={20} />
          </button>
        </div>

        <div className="toolbar-separator" />

        <div className="toolbar-group">
          <button
            type="button"
            className="add-btn"
            onClick={(e) => {
              setAddMenuAnchorPos({
                top: e.clientY,
                left: e.clientX,
              });
            }}
            title="Add"
          >
            <IconPlus size={20} />
            <span className="add-btn-text">Add</span>
            <IconChevronDown size={18} />
          </button>
          <Menu
            anchorReference="anchorPosition"
            anchorPosition={addMenuAnchorPos}
            open={isAddMenuOpen}
            onClose={() => setAddMenuAnchorPos(null)}
            sx={{ zIndex: 2002 }}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'left',
            }}
            PaperProps={{
              sx: {
                bgcolor: '#ffffff',
                color: '#111827',
                border: '1px solid rgba(0,0,0,0.08)',
              },
            }}
          >
            <MenuItem
              onClick={() => {
                setAddMenuAnchorPos(null);
                openLinkDialog();
              }}
            >
              Link
            </MenuItem>
            <MenuItem
              onClick={() => {
                setAddMenuAnchorPos(null);
                openImageDialog();
              }}
            >
              Image
            </MenuItem>
            <MenuItem
              onClick={() => {
                setAddMenuAnchorPos(null);
                editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
              }}
            >
              Table
            </MenuItem>
            <MenuItem
              onClick={() => {
                setAddMenuAnchorPos(null);
                editor.chain().focus().setHorizontalRule().run();
              }}
            >
              Divider
            </MenuItem>
            <MenuItem
              onClick={() => {
                setAddMenuAnchorPos(null);
                editor.chain().focus().toggleTaskList().run();
              }}
            >
              Task list
            </MenuItem>
          </Menu>
        </div>

      </div>
    );
  };

  const ModeToggle = () => {
    if (!showModeToggle) return null;
    if (isExpanded) return null;

    return (
      <div className="mode-toggle-container">
        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={(e, next) => handleModeChange(next)}
          className="mode-toggle-group"
        >
          <ToggleButton value="preview" className="mode-toggle-item">
            Preview
          </ToggleButton>
          <ToggleButton value="edit" className="mode-toggle-item">
            Edit
          </ToggleButton>
        </ToggleButtonGroup>

        <div className="mode-toggle-actions">
          {showExpandButton && !isExpanded ? (
            <button
              type="button"
              className="icon-btn icon-btn-compact"
              onClick={() => {
                setIsExpanded(true);
              }}
              title="Expand Editor"
            >
              <IconMaximize size={20} />
            </button>
          ) : null}
        </div>
      </div>
    );
  };

  const applyColor = () => {
    if (!editor) return;
    const normalized = normalizeHexColor(colorDraft);
    if (!normalized) return;

    if (colorTargetKind === 'text') {
      editor.chain().focus().setColor(normalized).run();
      setColorDialogOpen(false);
      return;
    }

    if (colorTargetKind === 'highlight') {
      editor.chain().focus().toggleHighlight({ color: normalized }).run();
      setColorDialogOpen(false);
      return;
    }

    if (typeof colorTargetPos === 'number') {
      editor.commands.command(({ tr, dispatch }) => {
        if (!dispatch) return true;
        dispatch(tr.setNodeMarkup(colorTargetPos, undefined, { color: normalized }));
        return true;
      });
    }

    setColorDialogOpen(false);
  };

  const copyHex = async (hex) => {
    if (!hex) return;
    try {
      await navigator.clipboard?.writeText(hex);
      debugLog('Copied hex to clipboard', hex);
      // Show toast notification
      const toast = document.createElement('div');
      toast.className = 'copy-toast';
      toast.textContent = `Copied ${hex}`;
      document.body.appendChild(toast);
      setTimeout(() => {
        toast.classList.add('show');
      }, 10);
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
          document.body.removeChild(toast);
        }, 300);
      }, 2000);
    } catch (e) {
      // noop
    }
  };

  const applyLink = () => {
    if (!editor) return;
    const href = String(linkUrl || '').trim();

    if (!href) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      setLinkDialogOpen(false);
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
    setLinkDialogOpen(false);
  };

  const applyImage = () => {
    if (!editor) return;
    const src = String(imageUrl || '').trim();
    if (!src) return;
    const alt = String(imageAlt || '').trim();
    editor.chain().focus().setImage({ src, alt: alt || null }).run();
    setImageDialogOpen(false);
  };

  const expandedStatus =
    expandedStatusBarProps && typeof expandedStatusBarProps === 'object'
      ? expandedStatusBarProps
      : null;
  const showExpandedStatusBar =
    expandedStatus &&
    expandedStatus.visible !== false &&
    (expandedStatus.alwaysVisible || isExpanded) &&
    (!expandedStatus.showWhenMode || expandedStatus.showWhenMode === mode);

  const EditorSurface = () => (
    <div className="tiptap-editor-shell">
      {showExpandedStatusBar ? (
        <div className="tiptap-expanded-status-bar">
          <div className="status-stack">
            <div
              className={`status-chip ${
                expandedStatus?.isEditingEnabled
                  ? 'status-chip-live'
                  : 'status-chip-idle'
              }`}
            >
              <IconShieldCheck size={16} className="status-icon" />
              <span className="status-dot" />
              <span className="status-text">
                {expandedStatus?.statusMessage ||
                  (expandedStatus?.isEditingEnabled
                    ? 'Editing enabled'
                    : 'Read-only')}
              </span>
            </div>

            {expandedStatus?.extendsLabel && (
              <div className="status-pill">{expandedStatus.extendsLabel}</div>
            )}
            {expandedStatus?.idleLabel && (
              <div className="status-pill">
                <IconClockHour5 size={14} />
                {expandedStatus.idleLabel}
              </div>
            )}
            {expandedStatus?.statusDetail && (
              <div className="status-pill status-pill-muted">
                {expandedStatus.statusDetail}
              </div>
            )}
          </div>

          {(expandedStatus?.onToggleAutoSave ||
            expandedStatus?.onSave ||
            expandedStatus?.onRelease) && (
            <div className="status-actions">
              {expandedStatus?.onToggleAutoSave ? (
                <button
                  type="button"
                  className={`status-auto ${
                    expandedStatus.autoSaveEnabled ? 'active' : ''
                  }`}
                  aria-pressed={Boolean(expandedStatus.autoSaveEnabled)}
                  onClick={() =>
                    expandedStatus.onToggleAutoSave?.(
                      !expandedStatus.autoSaveEnabled
                    )
                  }
                >
                  <span className="status-auto-label">Auto</span>
                  <span className="status-auto-track" aria-hidden="true">
                    <span className="status-auto-thumb" />
                  </span>
                </button>
              ) : null}

              {expandedStatus?.onSave ? (
                <button
                  type="button"
                  className="status-btn"
                  onClick={expandedStatus.onSave}
                  disabled={expandedStatus.saveDisabled}
                >
                  <IconDeviceFloppy size={14} />
                  {expandedStatus.saveLabel || 'Save'}
                </button>
              ) : null}

              {expandedStatus?.onRelease ? (
                <button
                  type="button"
                  className="status-btn secondary"
                  onClick={expandedStatus.onRelease}
                  disabled={expandedStatus.releaseDisabled}
                >
                  <IconLock size={14} />
                  {expandedStatus.releaseLabel || 'Release Lock'}
                </button>
              ) : null}
            </div>
          )}
        </div>
      ) : null}
      {ModeToggle()}
      {MenuBar()}
      {BubbleMenuBar()}
      <div ref={scrollContainerRef} className="tiptap-editor-scroll">
        <EditorContent editor={editor} />
      </div>
    </div>
  );

  const getFilename = () => {
    // Try to extract filename from current URL or use a default
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const match = path.match(/\/([^\/]+)$/);
      if (match && match[1]) {
        return match[1].replace(/%20/g, ' ');
      }
    }
    return 'Untitled';
  };

  return (
    <>
      {isExpanded ? (
        <div
          className="tiptap-expanded-backdrop"
          onMouseDown={() => setIsExpanded(false)}
          aria-hidden="true"
        />
      ) : null}

      <div
        className={`tiptap-markdown-viewer ${className} ${
          isExpanded ? 'tiptap-expanded' : ''
        }`}
        data-theme={theme}
      >
        {isExpanded ? (
          <div className="tiptap-modal-header">
            <div className="tiptap-modal-title">
              <span className="modal-filename">{filename || getFilename()}</span>
              <span className="modal-label">Editor</span>
            </div>
            <div className="tiptap-modal-actions">
              {showModeToggle ? (
                <ToggleButtonGroup
                  value={mode}
                  exclusive
                  size="small"
                  onChange={(e, next) => handleModeChange(next)}
                  className="mode-toggle-group mode-toggle-compact"
                >
                  <ToggleButton value="preview" className="mode-toggle-item">
                    Preview
                  </ToggleButton>
                  <ToggleButton value="edit" className="mode-toggle-item">
                    Edit
                  </ToggleButton>
                </ToggleButtonGroup>
              ) : null}

              {onReleaseLock || onAcquireLock || onRequestEdit ? (
                lockStatus?.can_edit || editable ? (
                  <button
                    type="button"
                    className="lock-btn"
                    onClick={() => onReleaseLock?.()}
                    title="Release lock"
                    aria-label="Release lock"
                  >
                    <IconLockOpen size={16} />
                    Release
                  </button>
                ) : (
                  <button
                    type="button"
                    className="lock-btn"
                    onClick={() => handleModeChange('edit')}
                    disabled={Boolean(isAcquiringLock)}
                    title="Acquire lock"
                    aria-label="Acquire lock"
                  >
                    <IconLock size={16} />
                    {isAcquiringLock ? 'Acquiring…' : 'Acquire'}
                  </button>
                )
              ) : null}

              <button
                type="button"
                className="icon-btn icon-btn-compact"
                onClick={() => setIsExpanded(false)}
                title="Close"
                aria-label="Close expanded editor"
              >
                <IconX size={18} />
              </button>
            </div>
          </div>
        ) : null}

        <div
          className={
            isExpanded
              ? 'tiptap-viewer-body tiptap-expanded-body'
              : 'tiptap-viewer-body'
          }
        >
          {EditorSurface()}
        </div>

      <Dialog open={linkDialogOpen} onClose={() => setLinkDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add link</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="URL"
            type="url"
            fullWidth
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLinkDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={applyLink}>Apply</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={imageDialogOpen} onClose={() => setImageDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add image</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Image URL (or data URI)"
            type="url"
            fullWidth
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Alt text (optional)"
            fullWidth
            value={imageAlt}
            onChange={(e) => setImageAlt(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImageDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={applyImage}>Insert</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={colorDialogOpen} onClose={() => setColorDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Color swatch</DialogTitle>
        <DialogContent>
          {(() => {
            const { r, g, b } = hexToRgb(colorDraft);
            const hex = normalizeHexColor(colorDraft) || '#000000';
            return (
              <div className="color-dialog">
                <div className="color-preview-wrapper">
                  <div className="color-preview color-preview-large" style={{ background: hex }} />
                  <div 
                    className="color-chip-overlay"
                    onClick={() => copyHex(hex)}
                    style={{ cursor: 'pointer' }}
                  >
                    <span style={{ marginRight: '0.5rem' }}>{hex}</span>
                    <IconCopy size={16} />
                  </div>
                </div>

                <div className="color-native-picker">
                  <label className="color-picker-label">Pick color</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      aria-label="Color"
                      type="color"
                      ref={colorInputRef}
                      value={hex}
                      onChange={(e) => setColorDraft(e.target.value)}
                      style={{ 
                        width: 60, 
                        height: 40, 
                        border: 'none', 
                        borderRadius: 4, 
                        cursor: 'pointer',
                        
                      }}
                    />
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => {
                        const input = colorInputRef.current;
                        if (input?.showPicker) {
                          try {
                            input.showPicker();
                          } catch (_) {
                            // Fallback: focus the input
                            input?.focus();
                          }
                        } else {
                          input?.focus();
                        }
                      }}
                      style={{
                        background: 'linear-gradient(to right, #8b5cf6, #3b82f6)',
                        color: 'white',
                        fontWeight: 600,
                        textTransform: 'none',
                        boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)'
                      }}
                    >
                      Open Picker
                    </Button>
                  </div>
                </div>

                <div className="color-sliders-section">
                  <ColorSlider
                    label="R"
                    value={r}
                    onChange={(v) => setColorDraft(rgbToHex(v, g, b))}
                  />
                  <ColorSlider
                    label="G"
                    value={g}
                    onChange={(v) => setColorDraft(rgbToHex(r, v, b))}
                  />
                  <ColorSlider
                    label="B"
                    value={b}
                    onChange={(v) => setColorDraft(rgbToHex(r, g, v))}
                  />
                </div>
              </div>
            );
          })()}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setColorDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={applyColor}
            style={{
              background: 'linear-gradient(to right, #8b5cf6, #3b82f6)',
              color: 'white',
              fontWeight: 600,
              textTransform: 'none',
              boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)'
            }}
          >
            Apply
          </Button>
        </DialogActions>
      </Dialog>

      <style jsx global>{`
        .tiptap-viewer {
          font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
          line-height: 1.7;
          color: var(--tp-text);
        }

        .tiptap-viewer h1 {
          font-size: 2rem;
          font-weight: 600;
          margin-top: 2rem;
          margin-bottom: 1rem;
          color: inherit;
        }

        .tiptap-viewer h2 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-top: 1.75rem;
          margin-bottom: 0.75rem;
          border-bottom: 1px solid var(--tp-border);
          padding-bottom: 0.25rem;
          color: inherit;
        }

        .tiptap-viewer h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 1.5rem;
          margin-bottom: 0.5rem;
          color: inherit;
        }

        .tiptap-viewer p {
          margin-top: 0.8em;
          margin-bottom: 0.8em;
        }

        .tiptap-viewer ul {
          list-style: disc;
          margin-left: 1.5rem;
        }

        .tiptap-viewer ol {
          list-style: decimal;
          margin-left: 1.5rem;
        }

        .tiptap-viewer li {
          margin-top: 0.25rem;
          margin-bottom: 0.25rem;
        }

        .tiptap-viewer blockquote {
          border-left: 4px solid var(--tp-border);
          padding-left: 1rem;
          color: var(--tp-text-muted);
          margin: 1rem 0;
          font-style: italic;
        }

        .tiptap-viewer code {
          background-color: var(--tp-surface-2);
          padding: 0.2em 0.4em;
          border-radius: 4px;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 0.95em;
        }

        .tiptap-viewer pre {
          background: var(--tp-surface-2);
          border-radius: 8px;
          padding: 1rem;
          overflow-x: auto;
          margin: 1rem 0;
        }

        .tiptap-viewer pre code {
          background: transparent;
          padding: 0;
        }

        .tiptap-viewer table {
          border-collapse: collapse;
          width: 100%;
          margin: 1rem 0;
          overflow-x: auto;
          display: block;
        }

        .tiptap-viewer th,
        .tiptap-viewer td {
          border: 1px solid var(--tp-border);
          padding: 0.5rem 0.75rem;
        }

        .tiptap-viewer th {
          background-color: var(--tp-surface-2);
          font-weight: 600;
        }

        .tiptap-viewer hr {
          border: none;
          border-top: 1px solid var(--tp-border);
          margin: 2rem 0;
        }

        .tiptap-viewer img {
          border-radius: 12px;
          margin: 1rem auto;
          max-width: 100%;
          height: auto;
          display: block;
        }

        .tiptap-viewer a {
          color: var(--tp-accent);
          text-decoration: none;
          font-weight: 500;
          cursor: pointer;
        }

        .tiptap-viewer a:hover {
          text-decoration: underline;
        }

        .tiptap-viewer mark {
          background-color: #fef08a;
          padding: 0.1em 0.2em;
          border-radius: 2px;
        }

        .tiptap-viewer ul[data-type="taskList"] {
          list-style: none;
          padding: 0;
        }

        .tiptap-viewer ul[data-type="taskList"] li {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
        }

        .tiptap-viewer ul[data-type="taskList"] li > label {
          flex: 0 0 auto;
          margin-top: 0.3em;
        }

        .tiptap-viewer ul[data-type="taskList"] li > div {
          flex: 1 1 auto;
        }

        .tiptap-viewer input[type="checkbox"] {
          accent-color: #2563eb;
          width: 1rem;
          height: 1rem;
        }

        /* Color Swatch Styles */
        .color-swatch-wrapper {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.25rem 0.5rem;
          background-color: var(--tp-surface-2);
          border: 1px solid var(--tp-border);
          border-radius: 6px;
          margin: 0 0.25rem;
          transition: all 0.2s ease;
        }

        .color-swatch-wrapper:hover {
          background-color: var(--tp-surface-3);
          border-color: var(--tp-border-strong);
        }

        .color-swatch {
          width: 24px;
          height: 24px;
          border-radius: 4px;
          border: 2px solid #ffffff;
          box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s ease;
        }

        .color-swatch-wrapper:hover .color-swatch {
          transform: scale(1.1);
        }

        .color-swatch-text {
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 0.875rem;
          color: var(--tp-text);
          font-weight: 500;
        }

        /* Theme Tokens */
        .tiptap-markdown-viewer {
          --tp-bg: #ffffff;
          --tp-surface-2: #f3f4f6;
          --tp-surface-3: #e5e7eb;
          --tp-border: #e5e7eb;
          --tp-border-strong: #d1d5db;
          --tp-text: #111827;
          --tp-text-muted: #6b7280;
          --tp-toolbar-bg: #f9fafb;
          --tp-toolbar-btn: rgba(0, 0, 0, 0.02);
          --tp-toolbar-btn-hover: rgba(0, 0, 0, 0.06);
          --tp-toolbar-icon: #111827;
          --tp-accent: #2563eb;
          --tp-active-bg: rgba(17, 24, 39, 0.12);
          --tp-active-border: rgba(17, 24, 39, 0.22);
          --tp-active-icon: #111827;
          --tp-popover-bg: #ffffff;
          --lock-bar-bg: #effdf4;
          --lock-bar-border: #c5f2d7;
          --lock-bar-shadow: 0 8px 24px rgba(22, 163, 74, 0.12);
          --lock-chip-bg: rgba(16, 185, 129, 0.18);
          --lock-chip-border: rgba(16, 185, 129, 0.35);
          --lock-chip-text: #047857;
          --lock-idle-bg: rgba(249, 115, 22, 0.1);
          --lock-idle-border: rgba(249, 115, 22, 0.3);
          --lock-idle-text: #b45309;
          --lock-pill-bg: rgba(209, 250, 229, 0.65);
          --lock-pill-border: rgba(16, 185, 129, 0.2);
          --lock-pill-text: #047857;
          --lock-muted-text: #6b7280;
          --lock-auto-border: rgba(16, 185, 129, 0.3);
          --lock-auto-bg: rgba(16, 185, 129, 0.08);
          --lock-auto-text: #047857;
          --lock-button-bg: #ffffff;
          --lock-button-border: #e5e7eb;
          --lock-button-text: #111827;
          --lock-button-hover-bg: #f4f6fb;
          --lock-button-hover-border: #c7d2fe;
          --lock-button-secondary-bg: #f8fafc;
          --lock-button-secondary-border: #d0d5dd;
          --lock-button-secondary-text: #475467;
          --lock-button-secondary-hover-bg: #eef2ff;
          --lock-switch-track: #d9dee5;
          --lock-switch-border: rgba(15, 23, 42, 0.08);
          --lock-switch-checked: #16a34a;
        }

        .tiptap-markdown-viewer[data-theme='dark'] {
          --tp-bg: #0c1118;
          --tp-surface-2: #141b26;
          --tp-surface-3: #1b2431;
          --tp-border: rgba(255, 255, 255, 0.14);
          --tp-border-strong: rgba(255, 255, 255, 0.22);
          --tp-text: #f5f7fb;
          --tp-text-muted: rgba(245, 247, 251, 0.7);
          --tp-toolbar-bg: #0f1620;
          --tp-toolbar-btn: rgba(255, 255, 255, 0.06);
          --tp-toolbar-btn-hover: rgba(255, 255, 255, 0.12);
          --tp-toolbar-icon: #f5f7fb;
          --tp-accent: #7bb2ff;
          --tp-active-bg: rgba(255, 255, 255, 0.16);
          --tp-active-border: rgba(255, 255, 255, 0.26);
          --tp-active-icon: #f5f7fb;
          --tp-popover-bg: #0f1620;
          --lock-bar-bg: rgba(6, 48, 33, 0.95);
          --lock-bar-border: rgba(74, 222, 128, 0.4);
          --lock-bar-shadow: 0 12px 30px rgba(4, 120, 87, 0.35);
          --lock-chip-bg: rgba(34, 197, 94, 0.2);
          --lock-chip-border: rgba(74, 222, 128, 0.45);
          --lock-chip-text: #bbf7d0;
          --lock-idle-bg: rgba(234, 179, 8, 0.15);
          --lock-idle-border: rgba(250, 204, 21, 0.45);
          --lock-idle-text: #fde68a;
          --lock-pill-bg: rgba(34, 197, 94, 0.12);
          --lock-pill-border: rgba(34, 197, 94, 0.35);
          --lock-pill-text: #bbf7d0;
          --lock-muted-text: rgba(226, 232, 240, 0.8);
          --lock-auto-border: rgba(34, 197, 94, 0.45);
          --lock-auto-bg: rgba(6, 78, 59, 0.55);
          --lock-auto-text: #bbf7d0;
          --lock-button-bg: rgba(15, 23, 42, 0.4);
          --lock-button-border: rgba(148, 163, 184, 0.4);
          --lock-button-text: #e2fbe8;
          --lock-button-hover-bg: rgba(34, 197, 94, 0.15);
          --lock-button-hover-border: rgba(34, 197, 94, 0.4);
          --lock-button-secondary-bg: rgba(15, 23, 42, 0.65);
          --lock-button-secondary-border: rgba(148, 163, 184, 0.45);
          --lock-button-secondary-text: #c7f9d4;
          --lock-button-secondary-hover-bg: rgba(15, 23, 42, 0.8);
          --lock-switch-track: rgba(255, 255, 255, 0.2);
          --lock-switch-border: rgba(34, 197, 94, 0.4);
          --lock-switch-checked: #1cd180;
        }

        /* Force dark mode styles with higher specificity */
        .tiptap-markdown-viewer[data-theme='dark'] .tiptap-toolbar {
          background: #0f1620 !important;
          border-color: rgba(255, 255, 255, 0.12) !important;
        }

        .tiptap-markdown-viewer[data-theme='dark'] .tiptap-toolbar button {
          background: rgba(255, 255, 255, 0.06) !important;
          color: #f5f7fb !important;
        }

        .tiptap-markdown-viewer[data-theme='dark'] .tiptap-toolbar button:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.12) !important;
        }

        .tiptap-markdown-viewer[data-theme='dark'] .icon-btn {
          background: rgba(255, 255, 255, 0.06) !important;
          border-color: rgba(255, 255, 255, 0.12) !important;
          color: #f5f7fb !important;
        }

        .tiptap-markdown-viewer[data-theme='dark'] .icon-btn:hover {
          background: rgba(255, 255, 255, 0.12) !important;
        }

        .tiptap-markdown-viewer[data-theme='dark'] .mode-toggle-group {
          background: rgba(255, 255, 255, 0.08) !important;
          border-color: rgba(255, 255, 255, 0.14) !important;
        }

        .tiptap-markdown-viewer[data-theme='dark'] .mode-toggle-group .MuiToggleButton-root {
          color: #f5f7fb !important;
          background: transparent !important;
          border: 0 !important;
        }

        .tiptap-markdown-viewer[data-theme='dark'] .mode-toggle-group .Mui-selected {
          background: rgba(255, 255, 255, 0.16) !important;
          color: #f5f7fb !important;
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.18);
        }

        .tiptap-markdown-viewer[data-theme='dark'] .tiptap-editor-scroll {
          background: #0c1118 !important;
          border-color: rgba(255, 255, 255, 0.14) !important;
        }

        .tiptap-markdown-viewer[data-theme='dark'] .ProseMirror {
          background: #0c1118 !important;
          color: #f5f7fb !important;
        }

        .tiptap-markdown-viewer[data-theme='dark'] .tiptap-modal {
          background: #0c1118 !important;
          color: #f5f7fb !important;
        }

        .tiptap-markdown-viewer[data-theme='dark'] .tiptap-modal-header {
          background: #0f1620 !important;
          border-color: rgba(255, 255, 255, 0.14) !important;
        }

        /* Toolbar Styles */
        .tiptap-markdown-viewer {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          height: 100%;
          min-height: 0;
          overflow: hidden;
        }

        .tiptap-expanded-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.45);
          z-index: 1200;
        }

        .tiptap-markdown-viewer.tiptap-expanded {
          position: fixed;
          inset: 2.5vh 2.5vw;
          width: 95vw;
          height: 95vh;
          border-radius: 14px;
          overflow: hidden;
          z-index: 1201;
          background: var(--tp-bg);
          box-shadow: 0 20px 45px rgba(0, 0, 0, 0.35);
          gap: 0;
        }

        .tiptap-viewer-body {
          flex: 1;
          min-height: 0;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .tiptap-expanded-body {
          padding: 12px 16px 16px;
        }

        /* Expanded Status Bar Styles */
        .tiptap-expanded-status-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.65rem;
          padding: 0.45rem 1rem;
          background: #effdf4;
          border: 1px solid #c5f2d7;
          border-radius: 999px;
          margin-bottom: 0.75rem;
          flex-shrink: 0;
          box-shadow: 0 8px 24px rgba(22, 163, 74, 0.12);
        }

        .status-stack {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .status-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.3rem 0.9rem;
          border-radius: 999px;
          font-size: 0.8rem;
          font-weight: 600;
          line-height: 1;
          border: 1px solid rgba(16, 185, 129, 0.35);
          background: rgba(16, 185, 129, 0.18);
          color: #047857;
        }

        .status-chip-idle {
          background: rgba(249, 115, 22, 0.1);
          border-color: rgba(249, 115, 22, 0.3);
          color: #b45309;
        }

        .status-icon {
          color: inherit;
        }

        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 999px;
          background: currentColor;
        }

        .status-text {
          font-family: 'Inter', ui-sans-serif, system-ui, -apple-system;
        }

        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          padding: 0.25rem 0.8rem;
          border-radius: 999px;
          font-size: 0.72rem;
          font-weight: 600;
          background: rgba(209, 250, 229, 0.65);
          color: #047857;
          border: 1px solid rgba(16, 185, 129, 0.2);
          line-height: 1;
        }

        .status-pill svg {
          color: inherit;
        }

        .status-pill-muted {
          background: transparent;
          color: #6b7280;
          border-color: transparent;
        }

        .status-actions {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .status-auto {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.18rem 0.65rem 0.18rem 0.75rem;
          border-radius: 999px;
          border: 1px solid var(--lock-auto-border);
          background: var(--lock-auto-bg);
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--lock-auto-text);
          transition: background 0.2s ease, border-color 0.2s ease,
            color 0.2s ease;
        }

        .status-auto:focus-visible {
          outline: 2px solid rgba(59, 130, 246, 0.35);
          outline-offset: 2px;
        }

        .status-auto-track {
          position: relative;
          width: 36px;
          height: 18px;
          border-radius: 999px;
          background: var(--lock-switch-track);
          border: 1px solid var(--lock-switch-border);
          transition: background 0.2s ease, border-color 0.2s ease;
        }

        .status-auto-thumb {
          position: absolute;
          top: 1px;
          left: 1px;
          width: 14px;
          height: 14px;
          border-radius: 999px;
          background: #fff;
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.25);
          transition: transform 0.2s ease;
        }

        .status-auto.active {
          border-color: var(--lock-switch-border);
          color: var(--lock-chip-text);
          background: rgba(34, 197, 94, 0.08);
        }

        .status-auto.active .status-auto-track {
          background: var(--lock-switch-checked);
          border-color: var(--lock-switch-border);
        }

        .status-auto.active .status-auto-thumb {
          transform: translateX(16px);
        }

        .status-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          border-radius: 999px;
          padding: 0.28rem 0.85rem;
          font-size: 0.78rem;
          font-weight: 600;
          border: 1px solid #e5e7eb;
          background: #ffffff;
          color: #111827;
          transition: all 0.15s ease;
        }

        .status-btn:hover:not(:disabled) {
          background: #f4f6fb;
          border-color: #c7d2fe;
        }

        .status-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .status-btn.secondary {
          background: #f8fafc;
          color: #475467;
          border-color: #d0d5dd;
        }

        .status-btn.secondary:hover:not(:disabled) {
          background: #eef2ff;
          color: #111827;
        }

        .tiptap-editor-shell {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          flex: 1 1 0;
          min-height: 0;
          overflow: hidden;
        }

        .tiptap-editor-scroll {
          flex: 1 1 0;
          min-height: 0;
          overflow: auto;
          max-height: 100%;
          border: 1px solid var(--tp-border);
          border-radius: 0 0 8px 8px;
          background: var(--tp-bg);
        }

        .tiptap-editor-scroll .ProseMirror {
          height: auto;
        }

        .tiptap-toolbar {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          padding: 0.75rem;
          background: var(--tp-toolbar-bg);
          border: 1px solid var(--tp-border);
          border-radius: 8px 8px 0 0;
          margin-bottom: 1px;
          align-items: center;
        }

        .toolbar-group {
          display: flex;
          gap: 0.25rem;
          align-items: center;
        }

        .toolbar-separator {
          width: 1px;
          height: 24px;
          background: var(--tp-border);
        }

        .tiptap-toolbar button {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.5rem;
          background: var(--tp-toolbar-btn);
          border: 1px solid transparent;
          border-radius: 6px;
          cursor: pointer;
          color: var(--tp-toolbar-icon);
          transition: all 0.2s ease;
        }

        .tiptap-toolbar button:hover:not(:disabled) {
          background: var(--tp-toolbar-btn-hover);
          border-color: var(--tp-border);
          color: var(--tp-toolbar-icon);
        }

        .tiptap-toolbar button.is-active {
          background: var(--tp-active-bg);
          border-color: var(--tp-active-border);
          color: var(--tp-active-icon);
        }

        .tiptap-toolbar button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .tiptap-markdown-viewer .ProseMirror {
          padding: 1.5rem;
          min-height: 200px;
          background: var(--tp-bg);
          color: var(--tp-text);
          border: none;
          border-radius: 0;
        }

        .tiptap-markdown-viewer .ProseMirror p {
          margin: 0;
        }

        .tiptap-markdown-viewer .ProseMirror p:not(:last-child) {
          margin-bottom: 1em;
        }

        .tiptap-paragraph {
          margin: 0;
        }

        .tiptap-paragraph:not(:last-child) {
          margin-bottom: 1em;
        }

        .tiptap-markdown-viewer .ProseMirror:focus {
          outline: none;
          border-color: rgba(96, 165, 250, 0.6);
          box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.12);
        }

        /* Mode Toggle Styles */
        .mode-toggle-container {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 0.2rem;
          gap: 0.4rem;
          align-items: center;
        }

        .mode-toggle-group {
          background: var(--tp-surface-2) !important;
          border: 1px solid var(--tp-border) !important;
          border-radius: 999px;
          padding: 1px;
          position: relative;
        }

        .mode-toggle-group .mode-toggle-item {
          border-radius: 999px !important;
          border: 0 !important;
          text-transform: none;
          font-weight: 600;
          padding: 4px 12px;
          color: var(--tp-text) !important;
          font-size: 0.85rem;
        }

        .mode-toggle-group .Mui-selected {
          background: rgba(96, 165, 250, 0.28) !important;
          color: var(--tp-text) !important;
          box-shadow: inset 0 0 0 1px rgba(96, 165, 250, 0.35);
        }

        .mode-toggle-group .MuiToggleButton-root:not(.Mui-selected) {
          color: var(--tp-text) !important;
          background: transparent !important;
        }

        .mode-toggle-actions {
          display: flex;
          gap: 0.5rem;
        }

        .tiptap-modal-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .tiptap-modal-actions .mode-toggle-group {
          height: 32px;
          display: flex;
          align-items: center;
        }

        .mode-toggle-compact {
          padding: 1px;
        }

        .tiptap-modal-actions .mode-toggle-group .MuiToggleButton-root {
          min-height: 30px;
          line-height: 1;
        }

        .icon-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--tp-border);
          background: var(--tp-surface-2);
          color: var(--tp-toolbar-icon);
          border-radius: 8px;
          cursor: pointer;
          padding: 0;
        }

        .icon-btn-compact {
          width: 32px;
          height: 32px;
        }

        .lock-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 32px;
          padding: 0 10px;
          border: 1px solid var(--tp-border);
          background: var(--tp-surface-2);
          color: var(--tp-toolbar-icon);
          border-radius: 999px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 700;
          line-height: 1;
          white-space: nowrap;
        }

        .lock-btn:hover:not(:disabled) {
          background: var(--tp-surface-3);
        }

        .lock-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .icon-btn:hover {
          background: var(--tp-surface-3);
        }

        .add-btn {
          padding: 0.5rem 0.75rem !important;
          gap: 0.5rem;
        }

        .add-btn-text {
          font-size: 0.875rem;
          font-weight: 600;
        }

        .tiptap-modal {
          height: 100%;
          background: var(--tp-bg);
          color: var(--tp-text);
          display: flex;
          flex-direction: column;
        }

        .tiptap-modal-header {
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          border-bottom: 1px solid var(--tp-border);
          background: var(--tp-toolbar-bg);
        }

        .tiptap-modal-title {
          font-weight: 700;
          color: var(--tp-toolbar-icon);
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .modal-filename {
          font-weight: 600;
          color: var(--tp-accent);
        }

        .modal-label {
          font-weight: 400;
          color: var(--tp-text-muted);
          font-size: 14px;
        }

        .tiptap-modal-body {
          padding: 16px;
          flex: 1;
          min-height: 0;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        /* Color Dialog Styles */
        .color-dialog {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          padding: 0.5rem 0;
        }

        .color-preview {
          width: 100%;
          height: 120px;
          border-radius: 12px;
          border: 1px solid var(--tp-border);
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .color-preview-large {
          width: 100%;
          height: 160px;
          border-radius: 16px;
          border: 1px solid var(--tp-border);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
        }

        .color-preview-wrapper {
          position: relative;
          width: 100%;
        }

        .color-chip-overlay {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(8px);
          color: var(--tp-text);
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 0.875rem;
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          transition: all 0.2s ease;
          user-select: none;
          display: flex;
          align-items: center;
          border: 1px solid var(--tp-border);
        }

        .color-chip-overlay:hover {
          background: rgba(255, 255, 255, 1);
          transform: translate(-50%, -50%) scale(1.05);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          border-color: var(--tp-border-strong);
        }

        .color-chip-overlay svg {
          opacity: 0.7;
          transition: opacity 0.2s ease;
        }

        .color-chip-overlay:hover svg {
          opacity: 1;
        }

        /* Copy Toast */
        .copy-toast {
          position: fixed;
          bottom: 2rem;
          left: 50%;
          transform: translateX(-50%) translateY(100px);
          background: var(--tp-surface-2);
          color: var(--tp-text);
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          font-size: 0.875rem;
          font-weight: 500;
          opacity: 0;
          transition: all 0.3s ease;
          z-index: 9999;
        }

        .copy-toast.show {
          transform: translateX(-50%) translateY(0);
          opacity: 1;
        }

        .color-native-picker {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .color-picker-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--tp-text);
        }

        .color-hex-field {
          margin-bottom: 1rem;
        }

        .color-sliders-section {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .color-slider-modern {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .color-slider-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .color-slider-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--tp-text);
        }

        .color-slider-value {
          font-size: 0.875rem;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          color: var(--tp-text-muted);
          background: var(--tp-surface-2);
          padding: 0.125rem 0.5rem;
          border-radius: 4px;
        }

        .color-slider-input {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 8px;
          border-radius: 4px;
          outline: none;
          transition: all 0.2s ease;
        }

        .color-slider-input::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: 2px solid var(--tp-border);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          transition: all 0.2s ease;
        }

        .color-slider-input::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: 2px solid var(--tp-border);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          transition: all 0.2s ease;
        }

        .color-slider-input:hover::-webkit-slider-thumb {
          transform: scale(1.1);
        }

        .color-slider-input:hover::-moz-range-thumb {
          transform: scale(1.1);
        }

        .color-slider-input:focus {
          box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.2);
        }

        .color-native {
          display: flex;
          justify-content: center;
        }

        /* Bubble Menu Styles */
        .tiptap-bubble-menu {
          z-index: 2001;
        }

        .bubble-menu-content {
          display: flex;
          gap: 0.2rem;
          padding: 0.5rem;
          background: var(--tp-popover-bg);
          border: 1px solid var(--tp-border);
          border-radius: 8px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2);
        }

        .bubble-menu-content button {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.5rem;
          background: transparent;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          color: var(--tp-toolbar-icon) !important;
          transition: all 0.2s ease;
        }

        .bubble-menu-content button:hover:not(:disabled) {
          background: var(--tp-toolbar-btn-hover);
        }

        .bubble-menu-content button.is-active {
          background: var(--tp-active-bg);
          color: var(--tp-active-icon) !important;
          box-shadow: inset 0 0 0 1px var(--tp-active-border);
        }
      `}</style>
      </div>
    </>
  );
};

export default TiptapMarkdownViewer;
