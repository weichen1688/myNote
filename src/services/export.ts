import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { Memo } from '../types';
import { escapeHtml } from '../utils/htmlUtils';

export const exportService = {
  async exportToPDF(element: HTMLElement, memo: Memo): Promise<void> {
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - 2 * margin;

      // Add title
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text(memo.title, margin, margin + 10);

      // Add metadata
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100);
      const createdDate = new Date(memo.createdAt).toLocaleDateString();
      const updatedDate = new Date(memo.updatedAt).toLocaleDateString();
      pdf.text(`Created: ${createdDate}  |  Updated: ${updatedDate}`, margin, margin + 17);

      if (memo.tags.length > 0) {
        pdf.text(`Tags: ${memo.tags.join(', ')}`, margin, margin + 23);
      }

      pdf.setDrawColor(200);
      pdf.line(margin, margin + 27, pageWidth - margin, margin + 27);

      // Add content image
      const imgY = margin + 30;
      const imgHeight = (canvas.height * contentWidth) / canvas.width;
      const availableHeight = pageHeight - imgY - margin;

      if (imgHeight <= availableHeight) {
        pdf.addImage(imgData, 'PNG', margin, imgY, contentWidth, imgHeight);
      } else {
        // Multi-page support
        let remainingHeight = imgHeight;
        let sourceY = 0;

        while (remainingHeight > 0) {
          const sliceHeight = Math.min(availableHeight, remainingHeight);
          const sliceCanvas = document.createElement('canvas');
          sliceCanvas.width = canvas.width;
          sliceCanvas.height = (sliceHeight / contentWidth) * canvas.width;
          const ctx = sliceCanvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(canvas, 0, sourceY * (canvas.height / imgHeight), canvas.width, sliceCanvas.height, 0, 0, canvas.width, sliceCanvas.height);
            const sliceData = sliceCanvas.toDataURL('image/png');
            pdf.addImage(sliceData, 'PNG', margin, sourceY === 0 ? imgY : margin, contentWidth, sliceHeight);
          }
          remainingHeight -= sliceHeight;
          sourceY += sliceHeight;
          if (remainingHeight > 0) {
            pdf.addPage();
          }
        }
      }

      pdf.save(`${memo.title.replace(/[^a-z0-9]/gi, '_')}.pdf`);
    } catch (error) {
      console.error('PDF export error:', error);
      throw error;
    }
  },

  printMemo(element: HTMLElement, memo: Memo): void {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.alert('Please allow pop-ups to use the print feature.');
      return;
    }

    const styles = Array.from(document.styleSheets)
      .map((sheet) => {
        try {
          return Array.from(sheet.cssRules)
            .map((rule) => rule.cssText)
            .join('\n');
        } catch {
          return '';
        }
      })
      .join('\n');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${escapeHtml(memo.title)}</title>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.21/dist/katex.min.css">
          <style>
            ${styles}
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 20px; color: #1a1a1a; }
            @media print { body { padding: 0; } }
            .print-header { border-bottom: 1px solid #e5e7eb; padding-bottom: 12px; margin-bottom: 20px; }
            .print-title { font-size: 24px; font-weight: bold; }
            .print-meta { font-size: 12px; color: #6b7280; margin-top: 6px; }
          </style>
        </head>
        <body>
          <div class="print-header">
            <div class="print-title">${escapeHtml(memo.title)}</div>
            <div class="print-meta">
              Created: ${escapeHtml(new Date(memo.createdAt).toLocaleString())}
              ${memo.tags.length > 0 ? ` | Tags: ${escapeHtml(memo.tags.join(', '))}` : ''}
            </div>
          </div>
          ${element.innerHTML}
          <script>window.onload = () => { window.print(); window.close(); }<\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
  },

  exportToMarkdown(memo: Memo): void {
    // Use DOM-based conversion to safely handle HTML entities and avoid injection
    const tmp = document.createElement('div');
    tmp.innerHTML = memo.content;

    const convertNode = (node: Node): string => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent ?? '';
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return '';

      const el = node as Element;
      const tag = el.tagName.toLowerCase();
      const children = Array.from(el.childNodes).map(convertNode).join('');

      switch (tag) {
        case 'h1': return `# ${children}\n\n`;
        case 'h2': return `## ${children}\n\n`;
        case 'h3': return `### ${children}\n\n`;
        case 'h4': case 'h5': case 'h6': return `#### ${children}\n\n`;
        case 'strong': case 'b': return `**${children}**`;
        case 'em': case 'i': return `*${children}*`;
        case 'u': return `_${children}_`;
        case 's': case 'del': return `~~${children}~~`;
        case 'code': return `\`${children}\``;
        case 'pre': return `\`\`\`\n${children}\n\`\`\`\n\n`;
        case 'blockquote': return children.split('\n').map((l) => `> ${l}`).join('\n') + '\n\n';
        case 'li': return `- ${children}\n`;
        case 'ul': case 'ol': return `${children}\n`;
        case 'p': return `${children}\n\n`;
        case 'br': return '\n';
        case 'hr': return '\n---\n\n';
        case 'a': return `[${children}](${el.getAttribute('href') ?? ''})`;
        case 'img': return `![${el.getAttribute('alt') ?? ''}](${el.getAttribute('src') ?? ''})`;
        case 'table': return `${children}\n`;
        case 'tr': return `|${children}\n`;
        case 'th': case 'td': return ` ${children} |`;
        default: return children;
      }
    };

    const content = Array.from(tmp.childNodes).map(convertNode).join('').trim();
    const markdown = `# ${memo.title}\n\n${content}`;
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${memo.title.replace(/[^a-z0-9]/gi, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  },
};
