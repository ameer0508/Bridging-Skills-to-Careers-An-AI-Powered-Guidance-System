import path from 'node:path';

/**
 * File names from multipart uploads. Multer decodes the multipart `filename` as Latin-1, so a
 * name typed in Devanagari or with accents arrives as mojibake ("à¤°à¤¿..."). Browsers send it as
 * UTF-8, so the bytes are re-read as UTF-8 when they form valid UTF-8; otherwise the name is kept.
 * A plain ASCII name is identical either way.
 */
export function decodeUploadName(name: string): string {
  // Already decoded (a character Latin-1 cannot hold): decoding again would corrupt it
  if ([...name].some(c => c.charCodeAt(0) > 0xff)) return name;
  const bytes = Buffer.from(name, 'latin1');
  const utf8 = bytes.toString('utf8');
  return !utf8.includes('\uFFFD') && Buffer.from(utf8, 'utf8').equals(bytes) ? utf8 : name;
}

/**
 * The name to store and show: decoded, the base name only (a client-supplied path such as
 * "../../x.pdf" or "C:\\x.pdf" is reduced to "x.pdf"), without control characters, at most 120
 * characters. It is only ever displayed or put in an encoded header, never used as a path.
 */
export function displayFileName(name: string): string {
  const decoded = decodeUploadName(name || '');
  const base = path.posix.basename(decoded.replace(/\\/g, '/'));
  return base
    .split('')
    .filter(c => c.charCodeAt(0) >= 0x20 && c.charCodeAt(0) !== 0x7f)
    .join('')
    .trim()
    .slice(0, 120);
}
