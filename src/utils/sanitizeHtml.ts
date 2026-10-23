import DOMPurify from 'dompurify';

/**
 * Server-safe fallback regex sanitizer when running in Node.js environment
 */
function serverSanitize(html: string): string {
  let clean = html;

  // 1. Strip script tags and contents
  clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  // 2. Strip style tags and contents
  clean = clean.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  // 3. Strip iframe, object, embed, applet, form, input, button, textarea
  clean = clean.replace(/<\/?(iframe|object|embed|applet|form|input|button|textarea|meta|link|base)\b[^>]*>/gi, '');
  // 4. Strip inline event handlers (e.g. onload, onerror, onclick, onmouseover, etc.)
  clean = clean.replace(/\s+on\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '');
  // 5. Strip javascript: and vbscript: URIs
  clean = clean.replace(/href\s*=\s*(?:'javascript:[^']*'|"javascript:[^"]*"|javascript:[^\s>]+)/gi, 'href="#"');
  clean = clean.replace(/href\s*=\s*(?:'vbscript:[^']*'|"vbscript:[^"]*"|vbscript:[^\s>]+)/gi, 'href="#"');
  clean = clean.replace(/href\s*=\s*(?:'data:[^']*'|"data:[^"]*"|data:[^\s>]+)/gi, 'href="#"');

  return clean;
}

/**
 * Sanitizes rich-text HTML for safe rendering in Borkot Tech storefront and admin pages.
 * Enforces strict XSS prevention while allowing all product formatting:
 * headings, bold, italic, lists, paragraphs, tables, blockquotes, code, and links.
 */
export function sanitizeHtml(rawHtml: string): string {
  if (!rawHtml || typeof rawHtml !== 'string') {
    return '';
  }

  // If in browser environment with DOMPurify
  if (typeof window !== 'undefined' && typeof DOMPurify?.sanitize === 'function') {
    try {
      const sanitized = DOMPurify.sanitize(rawHtml, {
        ALLOWED_TAGS: [
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          'p', 'br', 'hr',
          'strong', 'b', 'em', 'i', 'u', 's', 'strike',
          'ul', 'ol', 'li',
          'blockquote', 'pre', 'code',
          'a', 'span', 'div',
          'table', 'thead', 'tbody', 'tr', 'th', 'td'
        ],
        ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'title'],
        ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
        FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
        FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'style']
      });

      if (typeof document !== 'undefined') {
        const doc = new DOMParser().parseFromString(sanitized, 'text/html');
        const links = doc.querySelectorAll('a');
        links.forEach((link) => {
          link.setAttribute('target', '_blank');
          link.setAttribute('rel', 'noopener noreferrer nofollow');
        });
        return doc.body.innerHTML;
      }
      return sanitized;
    } catch {
      return serverSanitize(rawHtml);
    }
  }

  // Fallback for Node.js / SSR server execution
  return serverSanitize(rawHtml);
}
