// Builds a small, valid, text-based PDF from lines of ASCII text. Used to give the real AI
// service a real document to parse without committing a binary fixture.

const escapePdfText = (text) => text.replace(/[\\()]/g, (ch) => `\\${ch}`);

/**
 * @param {string[]} lines one line of text each; printable ASCII only
 * @returns {Buffer} a one-page PDF (Helvetica 11pt, US Letter)
 */
export function makeTextPdf(lines) {
  for (const line of lines) {
    if (/[^\x20-\x7e]/.test(line)) throw new Error(`makeTextPdf supports printable ASCII only: ${JSON.stringify(line)}`);
  }
  const content = ['BT', '/F1 11 Tf', '14 TL', '72 740 Td', ...lines.flatMap((line) => [`(${escapePdfText(line)}) Tj`, 'T*']), 'ET'].join('\n');

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    `<< /Length ${Buffer.byteLength(content, 'latin1')} >>\nstream\n${content}\nendstream`,
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [];
  objects.forEach((body, index) => {
    offsets.push(Buffer.byteLength(pdf, 'latin1'));
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xrefAt = Buffer.byteLength(pdf, 'latin1');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('');
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF\n`;
  return Buffer.from(pdf, 'latin1');
}
