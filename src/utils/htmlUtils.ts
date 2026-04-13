/**
 * Escapes HTML special characters to prevent XSS when inserting user-supplied
 * strings into HTML templates or rendering them via dangerouslySetInnerHTML.
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
