import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  Unlink,
  Undo,
  Redo,
  RemoveFormatting,
  Maximize2,
  Minimize2,
  Code2,
  Eye,
  Minus
} from 'lucide-react';
import { sanitizeHtml } from '../../utils/sanitizeHtml';

export interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  label = 'Product Description',
  placeholder = 'Enter complete product details, features, specifications, warranty information, package contents, and other relevant information.',
  className = '',
  minHeight = '280px'
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSourceMode, setIsSourceMode] = useState(false);
  const [rawSource, setRawSource] = useState(value || '');
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const savedSelectionRef = useRef<Range | null>(null);

  // Synchronize incoming value changes (e.g., when editing different products)
  useEffect(() => {
    if (editorRef.current && !isSourceMode) {
      const currentHtml = editorRef.current.innerHTML;
      const targetHtml = value || '';
      // Only update if fundamentally different to prevent resetting cursor while typing
      if (currentHtml !== targetHtml && document.activeElement !== editorRef.current) {
        editorRef.current.innerHTML = targetHtml;
      }
    }
    setRawSource(value || '');
  }, [value, isSourceMode]);

  // Handle ESC key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Save selection before opening link modal
  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedSelectionRef.current = sel.getRangeAt(0).cloneRange();
      const text = sel.toString();
      setLinkText(text);
    } else {
      savedSelectionRef.current = null;
      setLinkText('');
    }
  };

  const restoreSelection = () => {
    if (savedSelectionRef.current) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(savedSelectionRef.current);
      }
    }
  };

  const notifyChange = useCallback(() => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      const clean = (html === '<p><br></p>' || html === '<br>' || html.trim() === '') ? '' : html;
      onChange(clean);
      setRawSource(clean);
    }
  }, [onChange]);

  const exec = (command: string, arg: string | undefined = undefined) => {
    if (isSourceMode) return;
    editorRef.current?.focus();
    document.execCommand(command, false, arg);
    notifyChange();
  };

  const handleFormatBlock = (tag: string) => {
    if (isSourceMode) return;
    editorRef.current?.focus();
    document.execCommand('formatBlock', false, tag);
    notifyChange();
  };

  const handleOpenLinkModal = () => {
    if (isSourceMode) return;
    saveSelection();
    setLinkUrl('');
    setShowLinkDialog(true);
  };

  const handleApplyLink = (e: React.FormEvent) => {
    e.preventDefault();
    setShowLinkDialog(false);
    let url = linkUrl.trim();
    if (!url) return;

    // Default to https if no protocol provided
    if (!/^https?:\/\//i.test(url) && !url.startsWith('mailto:')) {
      url = `https://${url}`;
    }

    restoreSelection();
    editorRef.current?.focus();

    if (linkText.trim() && savedSelectionRef.current && savedSelectionRef.current.collapsed) {
      // If no text was selected, insert linked text
      const anchor = `<a href="${url}" target="_blank" rel="noopener noreferrer">${linkText.trim()}</a>`;
      document.execCommand('insertHTML', false, anchor);
    } else {
      document.execCommand('createLink', false, url);
    }
    notifyChange();
  };

  const handleRemoveLink = () => {
    if (isSourceMode) return;
    exec('unlink');
  };

  const handleToggleSource = () => {
    if (isSourceMode) {
      // Switching from raw HTML to visual mode
      const sanitized = sanitizeHtml(rawSource);
      if (editorRef.current) {
        editorRef.current.innerHTML = sanitized;
      }
      onChange(sanitized);
      setIsSourceMode(false);
    } else {
      // Switching from visual to raw HTML mode
      const currentHtml = editorRef.current ? editorRef.current.innerHTML : value;
      setRawSource(currentHtml);
      setIsSourceMode(true);
    }
  };

  const handleRawSourceChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setRawSource(val);
    onChange(val);
  };

  // Word & character stats
  const textContent = isSourceMode 
    ? rawSource.replace(/<[^>]*>/g, '') 
    : (editorRef.current?.innerText || '');
  const charCount = textContent.length;
  const wordCount = textContent.trim() ? textContent.trim().split(/\s+/).length : 0;

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* Label and Mode Badges */}
      <div className="flex items-center justify-between">
        <label className="block text-slate-300 font-semibold text-xs tracking-wide">
          {label}
        </label>
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <span className="font-mono">{wordCount} words</span>
          <span className="text-slate-600">|</span>
          <span className="font-mono">{charCount} chars</span>
        </div>
      </div>

      {/* Editor Container */}
      <div
        className={`bg-slate-950 border border-slate-700 rounded-xl transition-all flex flex-col ${
          isFullscreen
            ? 'fixed inset-0 z-50 p-4 sm:p-6 bg-slate-950 shadow-2xl rounded-none border-0'
            : 'focus-within:border-cyan-500/80 focus-within:ring-1 focus-within:ring-cyan-500/20'
        }`}
      >
        {/* Toolbar Header */}
        <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-900/90 border-b border-slate-800 rounded-t-xl shrink-0">
          
          {/* Headings */}
          <div className="flex items-center border-r border-slate-800 pr-1 mr-1 gap-0.5">
            <button
              type="button"
              onClick={() => handleFormatBlock('p')}
              disabled={isSourceMode}
              title="Normal Paragraph"
              className="px-2 py-1 text-xs font-semibold rounded text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 transition-colors"
            >
              P
            </button>
            <button
              type="button"
              onClick={() => handleFormatBlock('h2')}
              disabled={isSourceMode}
              title="Heading 2 (Section)"
              className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 transition-colors"
            >
              <Heading1 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleFormatBlock('h3')}
              disabled={isSourceMode}
              title="Heading 3 (Subsection)"
              className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 transition-colors"
            >
              <Heading2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleFormatBlock('h4')}
              disabled={isSourceMode}
              title="Heading 4 (Minor title)"
              className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 transition-colors"
            >
              <Heading3 className="w-4 h-4" />
            </button>
          </div>

          {/* Inline Text Styles */}
          <div className="flex items-center border-r border-slate-800 pr-1 mr-1 gap-0.5">
            <button
              type="button"
              onClick={() => exec('bold')}
              disabled={isSourceMode}
              title="Bold (Ctrl+B)"
              className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 transition-colors"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => exec('italic')}
              disabled={isSourceMode}
              title="Italic (Ctrl+I)"
              className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 transition-colors"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => exec('underline')}
              disabled={isSourceMode}
              title="Underline (Ctrl+U)"
              className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 transition-colors"
            >
              <Underline className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => exec('strikeThrough')}
              disabled={isSourceMode}
              title="Strikethrough"
              className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 transition-colors"
            >
              <Strikethrough className="w-4 h-4" />
            </button>
          </div>

          {/* Lists & Quotes */}
          <div className="flex items-center border-r border-slate-800 pr-1 mr-1 gap-0.5">
            <button
              type="button"
              onClick={() => exec('insertUnorderedList')}
              disabled={isSourceMode}
              title="Bullet List"
              className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 transition-colors"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => exec('insertOrderedList')}
              disabled={isSourceMode}
              title="Numbered List"
              className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 transition-colors"
            >
              <ListOrdered className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleFormatBlock('blockquote')}
              disabled={isSourceMode}
              title="Blockquote / Feature Highlight"
              className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 transition-colors"
            >
              <Quote className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => exec('insertHorizontalRule')}
              disabled={isSourceMode}
              title="Horizontal Divider"
              className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
          </div>

          {/* Links */}
          <div className="flex items-center border-r border-slate-800 pr-1 mr-1 gap-0.5">
            <button
              type="button"
              onClick={handleOpenLinkModal}
              disabled={isSourceMode}
              title="Insert Link"
              className="p-1.5 rounded text-slate-300 hover:text-cyan-400 hover:bg-slate-800 disabled:opacity-40 transition-colors"
            >
              <LinkIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleRemoveLink}
              disabled={isSourceMode}
              title="Remove Link"
              className="p-1.5 rounded text-slate-300 hover:text-rose-400 hover:bg-slate-800 disabled:opacity-40 transition-colors"
            >
              <Unlink className="w-4 h-4" />
            </button>
          </div>

          {/* History & Formatting */}
          <div className="flex items-center border-r border-slate-800 pr-1 mr-1 gap-0.5">
            <button
              type="button"
              onClick={() => exec('undo')}
              disabled={isSourceMode}
              title="Undo"
              className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-40 transition-colors"
            >
              <Undo className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => exec('redo')}
              disabled={isSourceMode}
              title="Redo"
              className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-40 transition-colors"
            >
              <Redo className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => exec('removeFormat')}
              disabled={isSourceMode}
              title="Clear Formatting"
              className="p-1.5 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 disabled:opacity-40 transition-colors"
            >
              <RemoveFormatting className="w-4 h-4" />
            </button>
          </div>

          {/* Right Mode Actions: Source Code view & Fullscreen */}
          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={handleToggleSource}
              title={isSourceMode ? 'Switch to Visual Rich Text Editor' : 'Switch to Raw HTML Code View'}
              className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
                isSourceMode
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              {isSourceMode ? <Eye className="w-3.5 h-3.5" /> : <Code2 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isSourceMode ? 'Visual' : 'HTML'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'Exit Fullscreen Mode (Esc)' : 'Expand to Fullscreen Editing Area'}
              className="p-1.5 rounded text-slate-300 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>

        </div>

        {/* Editor Body */}
        <div className={`relative flex-1 overflow-y-auto p-4 ${isFullscreen ? 'h-full' : ''}`}>
          {isSourceMode ? (
            <textarea
              value={rawSource}
              onChange={handleRawSourceChange}
              placeholder={placeholder}
              style={{ minHeight: isFullscreen ? '75vh' : minHeight }}
              className="w-full h-full bg-slate-950 font-mono text-xs text-cyan-300 border-none outline-none resize-y p-1 leading-relaxed"
            />
          ) : (
            <div
              ref={editorRef}
              contentEditable
              onInput={notifyChange}
              onBlur={notifyChange}
              data-placeholder={placeholder}
              style={{ minHeight: isFullscreen ? '75vh' : minHeight }}
              className="rich-text-content w-full h-full outline-none text-slate-100 text-xs sm:text-sm leading-relaxed cursor-text empty:before:content-[attr(data-placeholder)] empty:before:text-slate-600 empty:before:pointer-events-none"
            />
          )}
        </div>

        {/* Fullscreen bottom action bar */}
        {isFullscreen && (
          <div className="flex items-center justify-between p-3 border-t border-slate-800 bg-slate-900/90 text-xs text-slate-400">
            <span>Press <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-white font-mono text-[10px]">Esc</kbd> or click the icon to exit fullscreen.</span>
            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg transition-colors cursor-pointer"
            >
              Done Editing
            </button>
          </div>
        )}
      </div>

      {/* Link Dialog Modal */}
      {showLinkDialog && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-cyan-400" />
              <span>Insert Web Link</span>
            </h3>
            
            <form onSubmit={handleApplyLink} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Destination URL *</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com/spec-sheet"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Link Display Text (optional)</label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="e.g. Official Manufacturer Datasheet"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLinkDialog(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg cursor-pointer"
                >
                  Insert Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
