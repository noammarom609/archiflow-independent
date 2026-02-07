import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignRight,
  AlignCenter,
  AlignLeft,
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Link,
  Unlink,
  Undo,
  Redo,
  Type,
  Palette,
  Highlighter,
  Minus,
  Plus,
  Check,
  X,
  Copy,
  Download,
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useLanguage } from '@/components/providers/LanguageProvider';

const FONT_SIZES = [12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64];
const COLORS = [
  '#000000', '#374151', '#6B7280', '#9CA3AF',
  '#EF4444', '#F97316', '#F59E0B', '#EAB308',
  '#22C55E', '#14B8A6', '#06B6D4', '#3B82F6',
  '#6366F1', '#8B5CF6', '#A855F7', '#EC4899',
];

const HIGHLIGHT_COLORS = [
  'transparent', '#FEF3C7', '#FEE2E2', '#DBEAFE',
  '#D1FAE5', '#E0E7FF', '#FCE7F3', '#F3E8FF',
];

export default function RichTextEditor({ content, onChange, onSave, onCancel }) {
  const { t } = useLanguage();
  const editorRef = useRef(null);
  const [fontSize, setFontSize] = useState(16);
  const [textColor, setTextColor] = useState('#000000');
  const [highlightColor, setHighlightColor] = useState('transparent');

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleFontSize = (size) => {
    setFontSize(size);
    // Use CSS font-size via span
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      execCommand('fontSize', '7'); // Temporary
      // Replace with actual size
      const fontElements = editorRef.current?.querySelectorAll('font[size="7"]');
      fontElements?.forEach(el => {
        el.removeAttribute('size');
        el.style.fontSize = `${size}px`;
      });
    }
  };

  const handleTextColor = (color) => {
    setTextColor(color);
    execCommand('foreColor', color);
  };

  const handleHighlight = (color) => {
    setHighlightColor(color);
    if (color === 'transparent') {
      execCommand('removeFormat');
    } else {
      execCommand('hiliteColor', color);
    }
  };

  const handleInsertLink = () => {
    const url = prompt('הזן כתובת URL:');
    if (url) {
      execCommand('createLink', url);
    }
  };

  const handleRemoveLink = () => {
    execCommand('unlink');
  };

  const handleInput = () => {
    if (onChange && editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleSave = () => {
    if (onSave && editorRef.current) {
      onSave(editorRef.current.innerHTML);
    }
  };

  const copyToClipboard = () => {
    if (editorRef.current) {
      navigator.clipboard.writeText(editorRef.current.innerText);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <h3 className="font-medium flex items-center gap-2">
          <Type className="w-5 h-5" />
          עורך טקסט
        </h3>
        <div className="flex items-center gap-2">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              <X className="w-4 h-4 ml-1" />
              ביטול
            </Button>
          )}
          {onSave && (
            <Button onClick={handleSave}>
              <Check className="w-4 h-4 ml-1" />
              שמור
            </Button>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-muted/30">
        {/* Undo/Redo */}
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCommand('undo')} aria-label={t('a11y.undo')} title={t('a11y.undo')}>
          <Undo className="w-4 h-4" aria-hidden />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCommand('redo')} aria-label={t('a11y.redo')} title={t('a11y.redo')}>
          <Redo className="w-4 h-4" aria-hidden />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Font Size */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-1">
              <Type className="w-4 h-4" />
              {fontSize}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start">
            <div className="grid grid-cols-4 gap-1">
              {FONT_SIZES.map(size => (
                <Button
                  key={size}
                  variant={fontSize === size ? 'default' : 'ghost'}
                  size="sm"
                  className="h-8"
                  onClick={() => handleFontSize(size)}
                >
                  {size}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Text Formatting */}
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCommand('bold')} aria-label={t('a11y.bold')}>
          <Bold className="w-4 h-4" aria-hidden />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCommand('italic')} aria-label={t('a11y.italic')} title={t('a11y.italic')}>
          <Italic className="w-4 h-4" aria-hidden />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCommand('underline')} aria-label={t('a11y.underline')} title={t('a11y.underline')}>
          <Underline className="w-4 h-4" aria-hidden />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCommand('strikeThrough')} aria-label={t('a11y.strikethrough')} title={t('a11y.strikethrough')}>
          <Strikethrough className="w-4 h-4" aria-hidden />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Text Color */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 relative" aria-label={t('a11y.textColor')} title={t('a11y.textColor')}>
              <Palette className="w-4 h-4" aria-hidden />
              <div 
                className="absolute bottom-1 left-1 right-1 h-1 rounded"
                style={{ backgroundColor: textColor }}
              />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start">
            <div className="grid grid-cols-4 gap-1">
              {COLORS.map(color => (
                <button
                  key={color}
                  className="w-6 h-6 rounded border border-border hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  onClick={() => handleTextColor(color)}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Highlight */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 relative" aria-label={t('a11y.highlight')} title={t('a11y.highlight')}>
              <Highlighter className="w-4 h-4" aria-hidden />
              <div 
                className="absolute bottom-1 left-1 right-1 h-1 rounded border"
                style={{ backgroundColor: highlightColor === 'transparent' ? 'white' : highlightColor }}
              />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start">
            <div className="grid grid-cols-4 gap-1">
              {HIGHLIGHT_COLORS.map(color => (
                <button
                  key={color}
                  className="w-6 h-6 rounded border border-border hover:scale-110 transition-transform"
                  style={{ backgroundColor: color === 'transparent' ? 'white' : color }}
                  onClick={() => handleHighlight(color)}
                >
                  {color === 'transparent' && <X className="w-4 h-4 text-gray-400" />}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Alignment */}
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCommand('justifyRight')} aria-label={t('a11y.align')} title={t('a11y.align')}>
          <AlignRight className="w-4 h-4" aria-hidden />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCommand('justifyCenter')} aria-label={t('a11y.align')} title={t('a11y.align')}>
          <AlignCenter className="w-4 h-4" aria-hidden />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCommand('justifyLeft')} aria-label={t('a11y.align')} title={t('a11y.align')}>
          <AlignLeft className="w-4 h-4" aria-hidden />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCommand('justifyFull')} aria-label={t('a11y.align')} title={t('a11y.align')}>
          <AlignJustify className="w-4 h-4" aria-hidden />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Headings */}
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCommand('formatBlock', 'h1')} aria-label={t('a11y.heading1')} title={t('a11y.heading1')}>
          <Heading1 className="w-4 h-4" aria-hidden />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCommand('formatBlock', 'h2')} aria-label={t('a11y.heading2')} title={t('a11y.heading2')}>
          <Heading2 className="w-4 h-4" aria-hidden />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCommand('formatBlock', 'h3')} aria-label={t('a11y.heading3')} title={t('a11y.heading3')}>
          <Heading3 className="w-4 h-4" aria-hidden />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Lists */}
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCommand('insertUnorderedList')} aria-label={t('a11y.bulletList')}>
          <List className="w-4 h-4" aria-hidden />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCommand('insertOrderedList')} aria-label={t('a11y.numberedList')} title={t('a11y.numberedList')}>
          <ListOrdered className="w-4 h-4" aria-hidden />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCommand('formatBlock', 'blockquote')} aria-label={t('a11y.quote')} title={t('a11y.quote')}>
          <Quote className="w-4 h-4" aria-hidden />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Links */}
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleInsertLink} aria-label={t('a11y.insertLink')} title={t('a11y.insertLink')}>
          <Link className="w-4 h-4" aria-hidden />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleRemoveLink} aria-label={t('a11y.removeLink')} title={t('a11y.removeLink')}>
          <Unlink className="w-4 h-4" aria-hidden />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Copy */}
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copyToClipboard} aria-label={t('a11y.copy')} title={t('a11y.copy')}>
          <Copy className="w-4 h-4" aria-hidden />
        </Button>
      </div>

      {/* Editor Area */}
      <div className="flex-1 overflow-auto p-4">
        <div
          ref={editorRef}
          contentEditable
          className="min-h-[400px] p-4 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 prose prose-lg max-w-none"
          style={{ direction: 'rtl', textAlign: 'right' }}
          onInput={handleInput}
          dangerouslySetInnerHTML={{ __html: content || '' }}
        />
      </div>

      {/* Footer */}
      <div className="p-3 border-t bg-muted/30 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {editorRef.current?.innerText?.length || 0} תווים
        </span>
        <span>
          עורך טקסט עשיר - ArchiFlow
        </span>
      </div>
    </div>
  );
}