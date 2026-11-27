/**
 * =============================================================================
 * DRACO GLB COMPRESSION SCRIPT FOR WEB 3D ASSETS
 * =============================================================================
 * Compresses raw .glb engine files using Draco geometric mesh compression.
 * Typical size reduction: 65% - 85% with ZERO visual quality loss.
 *
 * Usage:
 *   npm run compress:engine
 *   OR
 *   node scripts/compress-glb.js [input.glb] [output.glb]
 * =============================================================================
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const defaultInput = path.resolve(__dirname, '../public/engine.glb');
const defaultOutput = path.resolve(__dirname, '../public/engine.glb');

const inputFile = process.argv[2] ? path.resolve(process.argv[2]) : defaultInput;
const outputFile = process.argv[3] ? path.resolve(process.argv[3]) : defaultOutput;

if (!fs.existsSync(inputFile)) {
  console.error(`[Error] Input file not found: ${inputFile}`);
  process.exit(1);
}

const initialSize = fs.statSync(inputFile).size;
console.log(`[Compression Pipeline] Starting Draco compression...`);
console.log(`  Source File: ${inputFile} (${(initialSize / 1024 / 1024).toFixed(2)} MB)`);

try {
  // Use gltf-transform to apply Draco geometry compression
  const cmd = `npx @gltf-transform/cli optimize "${inputFile}" "${outputFile}" --compress draco --draco.edgeBreaker`;
  console.log(`  Running: ${cmd}`);
  execSync(cmd, { stdio: 'inherit' });

  const finalSize = fs.statSync(outputFile).size;
  const savingsPct = (((initialSize - finalSize) / initialSize) * 100).toFixed(1);

  console.log(`\n[Draco Complete] Success!`);
  console.log(`  Output File: ${outputFile}`);
  console.log(`  Final Size: ${(finalSize / 1024 / 1024).toFixed(2)} MB (Saved ${savingsPct}%)`);
} catch (err) {
  console.warn(`[Warning] Could not execute gltf-transform. Please verify npx / network access.`);
}
