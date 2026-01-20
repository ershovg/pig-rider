#!/usr/bin/env node

import sharp from 'sharp';
import { readdir, stat } from 'fs/promises';
import { join, extname, basename } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const INPUT_DIR = join(__dirname, '../public/assets/sprites');
const OUTPUT_DIR = INPUT_DIR;

const AVIF_OPTIONS = {
  quality: 80,
  effort: 9,
};

async function convertToAVIF(inputPath, outputPath) {
  try {
    const startTime = Date.now();
    const inputStats = await stat(inputPath);
    const inputSize = inputStats.size;

    await sharp(inputPath)
      .avif(AVIF_OPTIONS)
      .toFile(outputPath);

    const outputStats = await stat(outputPath);
    const outputSize = outputStats.size;
    const compression = ((1 - outputSize / inputSize) * 100).toFixed(1);
    const duration = Date.now() - startTime;

    console.log(`${basename(inputPath)}`);
    console.log(`   ${(inputSize / 1024).toFixed(1)} KB → ${(outputSize / 1024).toFixed(1)} KB (-${compression}%) [${duration}ms]`);

    return { inputSize, outputSize, compression };
  } catch (error) {
    console.error(`Failed to convert ${basename(inputPath)}:`, error.message);
    return null;
  }
}

async function processDirectory() {
  console.log('Image optimization');
  console.log('Input directory:', INPUT_DIR);
  console.log('Output format: AVIF (quality 80, effort 9)');

  const files = await readdir(INPUT_DIR);
  const pngFiles = files.filter(file => extname(file).toLowerCase() === '.png');

  if (pngFiles.length === 0) {
    console.log('No PNG files found');
    return;
  }

  console.log(`Found ${pngFiles.length} PNG files to convert`);

  let totalInputSize = 0;
  let totalOutputSize = 0;
  let successCount = 0;

  for (const file of pngFiles) {
    const inputPath = join(INPUT_DIR, file);
    const outputPath = join(OUTPUT_DIR, file.replace('.png', '.avif'));

    const result = await convertToAVIF(inputPath, outputPath);

    if (result) {
      totalInputSize += result.inputSize;
      totalOutputSize += result.outputSize;
      successCount++;
    }

  }

  const totalCompression = ((1 - totalOutputSize / totalInputSize) * 100).toFixed(1);

  console.log('Summary:');
  console.log(`Converted: ${successCount}/${pngFiles.length} files`);
  console.log(`Total size: ${(totalInputSize / 1024).toFixed(1)} KB → ${(totalOutputSize / 1024).toFixed(1)} KB`);
  console.log(`Saved: ${((totalInputSize - totalOutputSize) / 1024).toFixed(1)} KB (-${totalCompression}%)`);
}

processDirectory().catch(console.error);
