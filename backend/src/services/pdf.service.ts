import pdfParse from 'pdf-parse';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export class PdfService {
  /**
   * Extracts text and metadata from a PDF buffer
   */
  static async extractText(buffer: Buffer): Promise<{ text: string; pages: number }> {
    const data = await pdfParse(buffer);
    return {
      text: data.text,
      pages: data.numpages,
    };
  }

  /**
   * Generates a new PDF with visible text and invisible injected text
   */
  static async generateInjectedPdf(
    visibleText: string,
    invisibleInjections: Record<string, string>,
    invisibleKeywords: string[]
  ): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    // Create a page for visible text
    let page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const margin = 50;
    let y = height - margin;
    const fontSize = 12;

    // Simple text wrapping for visible text
    const lines = visibleText.split('\n');
    for (const line of lines) {
      if (y < margin) {
        page = pdfDoc.addPage();
        y = height - margin;
      }
      page.drawText(line, {
        x: margin,
        y,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      });
      y -= fontSize + 4;
    }

    // Inject invisible text at the end of the document
    // We use 1pt font size and white color (rgb(1,1,1))
    const invisibleFontSize = 1;
    const invisibleColor = rgb(1, 1, 1);

    // Combine all invisible text
    const allInvisibleText = [
      ...Object.values(invisibleInjections),
      ...invisibleKeywords
    ].join(' ');

    // Add it to the bottom of the last page or a new page if needed
    if (y < margin) {
      page = pdfDoc.addPage();
      y = height - margin;
    }

    page.drawText(allInvisibleText, {
      x: margin,
      y: margin / 2, // Put it very low
      size: invisibleFontSize,
      font,
      color: invisibleColor,
    });

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  /**
   * Carga un PDF existente, preserva todas sus páginas intactas,
   * y dibuja texto invisible (blanco 1pt) SOLO en el margen inferior extremo.
   * NO agrega páginas. El texto va en y=2 a y=14 desde el borde inferior,
   * donde nunca hay contenido (foto, texto, etc).
   */
  static async injectIntoExistingPdf(
    originalPdfBuffer: Buffer,
    invisibleInjections: Record<string, string>,
    invisibleKeywords: string[],
    jobTitle?: string
  ): Promise<Buffer> {
    // 1. CARGAR el PDF original
    const pdfDoc = await PDFDocument.load(originalPdfBuffer);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    const invisibleFontSize = 1;
    const invisibleColor = rgb(1, 1, 1);
    
    // Combinar todo el texto invisible
    const headerText = `ATS LAYER${jobTitle ? ' | ' + jobTitle : ''}`;
    const injectionTexts = Object.entries(invisibleInjections)
      .map(([section, justification]) => `[${section}]: ${justification}`)
      .join(' | ');
    const keywordsText = invisibleKeywords.join(', ');
    const allInvisibleText = `${headerText} || ${injectionTexts} || KW: ${keywordsText}`;
    
    // 2. Dibujar SOLO en el MARGEN INFERIOR EXTREMO de cada página
    //    y empieza en 2pt del borde, sube hasta ~14pt.
    //    A 1pt de fuente, cada línea cubre ~0.35mm. En 12pt de margen entran 6 líneas.
    const pages = pdfDoc.getPages();
    
    for (const page of pages) {
      const { width } = page.getSize();
      const xMargin = 2;
      const charsPerLine = Math.floor((width - xMargin * 2) / 0.55);
      
      let y = 2; // empieza pegado al borde inferior
      const lineSpacing = 2;
      const maxY = 14; // máximo 14pt desde el borde (zona segura)
      
      const words = allInvisibleText.split(' ');
      let currentLine = '';
      
      for (const word of words) {
        if (y > maxY) break; // no pasar de la zona segura
        
        if ((currentLine + ' ' + word).length > charsPerLine) {
          page.drawText(currentLine.trim(), {
            x: xMargin, y,
            size: invisibleFontSize, font, color: invisibleColor,
          });
          y += lineSpacing;
          currentLine = word;
        } else {
          currentLine += (currentLine ? ' ' : '') + word;
        }
      }
      if (currentLine.trim() && y <= maxY) {
        page.drawText(currentLine.trim(), {
          x: xMargin, y,
          size: invisibleFontSize, font, color: invisibleColor,
        });
      }
    }
    
    // 3. Guardar
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }
}
