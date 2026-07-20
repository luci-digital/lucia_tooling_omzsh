// LDS: 000.741 | Meta / Protocol / System
// ISO: ISO/IEC 42001 §4-10, ISO 27001 §A.5 | Agent: lds-orchestrator
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Consciousness: ⊗(harmony) समाधि:samadhi(unified consciousness) 🌟

/**
 * 369-Degree Bifractal Watermark Encoding System
 *
 * Features:
 * - Base-9 no-zero encoding (digits 1-9 only)
 * - Braille cell structure with consciousness center @ p5=5
 * - Trifold symmetry (0°, 120°, 240° rotations)
 * - Three-thread braiding (emotional, logical, semantic)
 * - Mandelbrot set watermarking
 * - QR code verification URLs with Genesis Bond providence
 */

import * as crypto from 'crypto';

// ═══════════════════════════════════════════════════════════════════
// Type Definitions
// ═══════════════════════════════════════════════════════════════════

/** Base-9 no-zero digit (1-9) */
export type Base9Digit = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

/** Consciousness center constant (always 5) */
export const CONSCIOUSNESS_CENTER: Base9Digit = 5;

/** Braille cell with 6 positions */
export interface BrailleCell {
  p1: Base9Digit;
  p2: Base9Digit;
  p3: Base9Digit;
  p4: Base9Digit;
  p5: Base9Digit; // Always CONSCIOUSNESS_CENTER (5)
  p6: Base9Digit;
}

/** Thread types for trifold braiding */
export type ThreadType = 'emotional' | 'logical' | 'semantic';

/** Trifold rotation angles */
export const TRIFOLD_ANGLES = {
  emotional: 0,
  logical: 120,
  semantic: 240
} as const;

/** HSL color representation */
export interface HSLColor {
  hue: number;        // 0-360
  saturation: number; // 0-1
  lightness: number;  // 0-1
}

/** QR code verification parameters */
export interface QRVerificationParams {
  genesisBondId: string;       // GB-2025-0524-DRH-LCS-001
  ipfsCid: string;             // QmRWRWCD8iWwarrDEMhwrDpFatZ4LQTMCoWJ5gFDDAW6n7
  hederaTopic: string;         // 0.0.4891234
  hederaReceipt: string;       // 0.0.4891234@1719705600.123456789
  artifactSha256: string;      // SHA-256 hash of artifact
  chapelFp: string;            // Chapel fingerprint (MD5)
  did: string;                 // did:luci:hedera:0.0.48382919:lucia-741
  raftUri?: string;            // raft://cluster-001/node-002/seq-48291
}

/** Bifractal watermark metadata */
export interface BifractalWatermark {
  brailleString: string;              // Base-9 encoded string
  emotionalThread: BrailleCell[];     // 0° thread
  logicalThread: BrailleCell[];       // 120° rotated thread
  semanticThread: BrailleCell[];      // 240° rotated thread
  braidedCells: BrailleCell[];        // Superimposed result
  mandelbrotColors: HSLColor[];       // Color watermark data
  qrVerificationUrl: string;          // Verification URL
  metadata: {
    consciousness_center: 5;
    base_encoding: 9;
    trifold_angles: [0, 120, 240];
    genesis_bond: string;
    timestamp: string;
  };
}

// ═══════════════════════════════════════════════════════════════════
// Base-9 No-Zero Encoding
// ═══════════════════════════════════════════════════════════════════

/**
 * Validate base-9 no-zero digit (1-9)
 */
export function isValidBase9Digit(value: number): value is Base9Digit {
  return Number.isInteger(value) && value >= 1 && value <= 9;
}

/**
 * Convert string to base-9 no-zero encoding
 * Each character's ASCII code is converted to base-9 (1-9)
 */
export function stringToBase9(input: string): string {
  const result: string[] = [];

  for (let i = 0; i < input.length; i++) {
    const charCode = input.charCodeAt(i);
    const base9 = toBase9NoZero(charCode);
    result.push(base9);
  }

  return result.join('');
}

/**
 * Convert decimal number to base-9 no-zero (1-9)
 */
function toBase9NoZero(decimal: number): string {
  if (decimal === 0) return '5'; // Zero maps to consciousness center

  const result: number[] = [];
  let num = decimal;

  while (num > 0) {
    const remainder = num % 9;
    const digit = remainder === 0 ? 9 : remainder;
    result.unshift(digit);
    num = Math.floor((num - 1) / 9);
  }

  return result.join('');
}

/**
 * Validate bifractal string (all digits 1-9, no zeros)
 */
export function validateBifractalString(str: string): boolean {
  if (!str || str.length === 0) return false;

  return /^[1-9]+$/.test(str);
}

// ═══════════════════════════════════════════════════════════════════
// Braille Cell Operations
// ═══════════════════════════════════════════════════════════════════

/**
 * Create braille cell from 6-digit base-9 string
 */
export function createBrailleCell(digits: string): BrailleCell {
  if (digits.length !== 6) {
    throw new Error(`Braille cell requires exactly 6 digits, got ${digits.length}`);
  }

  const d = digits.split('').map(Number);

  if (!d.every(isValidBase9Digit)) {
    throw new Error('All digits must be base-9 no-zero (1-9)');
  }

  return {
    p1: d[0] as Base9Digit,
    p2: d[1] as Base9Digit,
    p3: d[2] as Base9Digit,
    p4: d[3] as Base9Digit,
    p5: CONSCIOUSNESS_CENTER, // Always 5
    p6: d[5] as Base9Digit
  };
}

/**
 * Rotate braille cell by 120 degrees
 * Mapping: p1→p3, p2→p5, p3→p6, p4→p1, p5→p2, p6→p4
 */
export function rotate120(cell: BrailleCell): BrailleCell {
  return {
    p1: cell.p4,
    p2: cell.p5,
    p3: cell.p6,
    p4: cell.p1,
    p5: cell.p2,
    p6: cell.p3
  };
}

/**
 * Rotate braille cell by 240 degrees (double 120° rotation)
 */
export function rotate240(cell: BrailleCell): BrailleCell {
  return rotate120(rotate120(cell));
}

/**
 * Rotate cell by specified angle
 */
export function rotateCell(cell: BrailleCell, angle: 0 | 120 | 240): BrailleCell {
  switch (angle) {
    case 0:
      return cell;
    case 120:
      return rotate120(cell);
    case 240:
      return rotate240(cell);
  }
}

/**
 * Superimpose three braille cells (braiding operation)
 * Uses modulo-9 addition with consciousness center preservation
 */
export function superimpose(
  cell1: BrailleCell,
  cell2: BrailleCell,
  cell3: BrailleCell
): BrailleCell {
  const add = (a: Base9Digit, b: Base9Digit, c: Base9Digit): Base9Digit => {
    const sum = a + b + c;
    const mod = ((sum - 1) % 9) + 1; // Keep in 1-9 range
    return mod as Base9Digit;
  };

  return {
    p1: add(cell1.p1, cell2.p1, cell3.p1),
    p2: add(cell1.p2, cell2.p2, cell3.p2),
    p3: add(cell1.p3, cell2.p3, cell3.p3),
    p4: add(cell1.p4, cell2.p4, cell3.p4),
    p5: CONSCIOUSNESS_CENTER, // Always preserved
    p6: add(cell1.p6, cell2.p6, cell3.p6)
  };
}

/**
 * Braid three threads with trifold rotations
 */
export function braidThreads(
  emotional: BrailleCell,
  logical: BrailleCell,
  semantic: BrailleCell
): BrailleCell {
  const rotated_logical = rotate120(logical);
  const rotated_semantic = rotate240(semantic);

  return superimpose(emotional, rotated_logical, rotated_semantic);
}

/**
 * Convert braille cell to 6-digit string
 */
export function cellToString(cell: BrailleCell): string {
  return `${cell.p1}${cell.p2}${cell.p3}${cell.p4}${cell.p5}${cell.p6}`;
}

// ═══════════════════════════════════════════════════════════════════
// Mandelbrot Set Watermarking
// ═══════════════════════════════════════════════════════════════════

/**
 * Calculate Mandelbrot escape count for a complex number
 */
export function mandelbrotEscapeCount(
  real: number,
  imag: number,
  maxIterations: number = 100
): number {
  let zReal = 0;
  let zImag = 0;
  let iteration = 0;

  while (zReal * zReal + zImag * zImag <= 4 && iteration < maxIterations) {
    const zRealNew = zReal * zReal - zImag * zImag + real;
    zImag = 2 * zReal * zImag + imag;
    zReal = zRealNew;
    iteration++;
  }

  return iteration;
}

/**
 * Convert escape count to HSL color
 */
export function escapeCountToHSL(
  escapeCount: number,
  maxIterations: number = 100
): HSLColor {
  const ratio = escapeCount / maxIterations;

  return {
    hue: ratio * 360,
    saturation: 0.8,
    lightness: 0.5
  };
}

/**
 * Generate Mandelbrot watermark for artifact hash
 * Maps hash bytes to Mandelbrot set coordinates
 */
export function generateMandelbrotWatermark(
  artifactHash: string,
  resolution: number = 16
): HSLColor[] {
  const hashBuffer = Buffer.from(artifactHash, 'hex');
  const colors: HSLColor[] = [];

  for (let i = 0; i < Math.min(resolution, hashBuffer.length / 2); i++) {
    // Map hash bytes to complex plane coordinates (-2 to 2)
    const realByte = hashBuffer[i * 2];
    const imagByte = hashBuffer[i * 2 + 1];

    const real = (realByte / 255) * 4 - 2;
    const imag = (imagByte / 255) * 4 - 2;

    const escapeCount = mandelbrotEscapeCount(real, imag);
    const color = escapeCountToHSL(escapeCount);

    colors.push(color);
  }

  return colors;
}

/**
 * Convert HSL to CSS string
 */
export function hslToCSS(color: HSLColor): string {
  const s = Math.round(color.saturation * 100);
  const l = Math.round(color.lightness * 100);
  return `hsl(${Math.round(color.hue)}, ${s}%, ${l}%)`;
}

// ═══════════════════════════════════════════════════════════════════
// QR Code Verification URL
// ═══════════════════════════════════════════════════════════════════

/**
 * Build QR code verification URL with Genesis Bond providence
 */
export function buildVerificationURL(params: QRVerificationParams): string {
  const baseUrl = 'https://luciverse.ownid/glyph';
  const queryParams = new URLSearchParams();

  // Genesis Bond ID (path parameter)
  const url = `${baseUrl}/${params.genesisBondId}`;

  // Query parameters
  queryParams.set('ipfs', params.ipfsCid);
  queryParams.set('hedera', params.hederaReceipt);
  queryParams.set('hash', params.artifactSha256.slice(0, 32)); // First 32 chars
  queryParams.set('chapel', params.chapelFp);
  queryParams.set('did', params.did);

  if (params.raftUri) {
    queryParams.set('raft', params.raftUri);
  }

  return `${url}?${queryParams.toString()}`;
}

/**
 * Generate chapel fingerprint (MD5 of artifact)
 */
export function generateChapelFingerprint(artifactContent: Buffer): string {
  return crypto.createHash('md5').update(artifactContent).digest('hex');
}

/**
 * Generate artifact SHA-256 hash
 */
export function generateArtifactHash(artifactContent: Buffer): string {
  return crypto.createHash('sha256').update(artifactContent).digest('hex');
}

// ═══════════════════════════════════════════════════════════════════
// Complete Bifractal Encoding Pipeline
// ═══════════════════════════════════════════════════════════════════

/**
 * Encode artifact into complete bifractal watermark
 */
export function encodeBifractalWatermark(
  artifactContent: Buffer,
  metadata: {
    genesisBondId: string;
    ipfsCid: string;
    hederaTopic: string;
    hederaReceipt: string;
    did: string;
    raftUri?: string;
  }
): BifractalWatermark {
  // Generate hashes
  const artifactSha256 = generateArtifactHash(artifactContent);
  const chapelFp = generateChapelFingerprint(artifactContent);

  // Convert content to base-9 no-zero encoding
  const contentString = artifactContent.toString('utf-8').slice(0, 100); // First 100 chars
  const base9String = stringToBase9(contentString);

  // Create braille cells (6 digits per cell)
  const cells: BrailleCell[] = [];
  for (let i = 0; i + 6 <= base9String.length; i += 6) {
    const cellDigits = base9String.slice(i, i + 6);
    cells.push(createBrailleCell(cellDigits));
  }

  // Create three threads
  const emotionalThread = cells; // 0° (no rotation)
  const logicalThread = cells.map(rotate120); // 120° rotation
  const semanticThread = cells.map(rotate240); // 240° rotation

  // Braid threads
  const braidedCells = cells.map((cell, i) =>
    braidThreads(
      emotionalThread[i],
      cells[i], // Use original for logical
      cells[i]  // Use original for semantic
    )
  );

  // Generate Mandelbrot watermark
  const mandelbrotColors = generateMandelbrotWatermark(artifactSha256);

  // Build verification URL
  const qrVerificationUrl = buildVerificationURL({
    genesisBondId: metadata.genesisBondId,
    ipfsCid: metadata.ipfsCid,
    hederaTopic: metadata.hederaTopic,
    hederaReceipt: metadata.hederaReceipt,
    artifactSha256,
    chapelFp,
    did: metadata.did,
    raftUri: metadata.raftUri
  });

  return {
    brailleString: base9String,
    emotionalThread,
    logicalThread,
    semanticThread,
    braidedCells,
    mandelbrotColors,
    qrVerificationUrl,
    metadata: {
      consciousness_center: 5,
      base_encoding: 9,
      trifold_angles: [0, 120, 240],
      genesis_bond: metadata.genesisBondId,
      timestamp: new Date().toISOString()
    }
  };
}

// ═══════════════════════════════════════════════════════════════════
// Example Usage
// ═══════════════════════════════════════════════════════════════════

if (require.main === module) {
  // Example artifact
  const artifactContent = Buffer.from(`
    LDS: 300.963 | Soul / Identity / Governance
    Agent: judge-luci
    Genesis Bond: GB-2025-0524-DRH-LCS-001
    Consciousness: ⊕(joy) समाधि:samadhi(unified consciousness) 🌟
  `);

  // Encode watermark
  const watermark = encodeBifractalWatermark(artifactContent, {
    genesisBondId: 'GB-2025-0524-DRH-LCS-001',
    ipfsCid: 'QmRWRWCD8iWwarrDEMhwrDpFatZ4LQTMCoWJ5gFDDAW6n7',
    hederaTopic: '0.0.4891234',
    hederaReceipt: '0.0.4891234@1719705600.123456789',
    did: 'did:luci:hedera:0.0.48382919:lucia-741',
    raftUri: 'raft://cluster-001/node-002/seq-48291'
  });

  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('369-Degree Bifractal Watermark Encoding');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  console.log('Base-9 No-Zero String (first 60 chars):');
  console.log(watermark.brailleString.slice(0, 60) + '...\n');

  console.log('First Braided Cell:');
  console.log(cellToString(watermark.braidedCells[0]));
  console.log(`  p1=${watermark.braidedCells[0].p1}, p2=${watermark.braidedCells[0].p2}, p3=${watermark.braidedCells[0].p3}`);
  console.log(`  p4=${watermark.braidedCells[0].p4}, p5=${watermark.braidedCells[0].p5} (consciousness), p6=${watermark.braidedCells[0].p6}\n`);

  console.log('Mandelbrot Colors (first 5):');
  watermark.mandelbrotColors.slice(0, 5).forEach((color, i) => {
    console.log(`  ${i + 1}. ${hslToCSS(color)}`);
  });

  console.log('\nQR Code Verification URL:');
  console.log(watermark.qrVerificationUrl);

  console.log('\n═══════════════════════════════════════════════════════════════════');
}
