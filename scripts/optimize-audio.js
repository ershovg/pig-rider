#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';
import { readdir, stat } from 'fs/promises';
import { join, extname, basename, dirname as pathDirname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const INPUT_DIR = join(__dirname, '../public/assets/sounds');

const FFMPEG_PATH = process.env.HOME + '/.local/bin/ffmpeg';

async function getAllFiles(dir) {
  const files = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await getAllFiles(fullPath));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

async function convertToMP3(inputPath, outputPath) {
  try {
    const startTime = Date.now();
    const inputStats = await stat(inputPath);
    const inputSize = inputStats.size;

    await execAsync(`"${FFMPEG_PATH}" -i "${inputPath}" -codec:a libmp3lame -q:a 2 "${outputPath}" -y`);

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

async function convertToOGG(inputPath, outputPath) {
  try {
    const startTime = Date.now();

    await execAsync(`"${FFMPEG_PATH}" -i "${inputPath}" -codec:a libvorbis -q:a 4 "${outputPath}" -y`);

    const outputStats = await stat(outputPath);
    const outputSize = outputStats.size;
    const duration = Date.now() - startTime;

    console.log(`   OGG: ${(outputSize / 1024).toFixed(1)} KB [${duration}ms]`);
  } catch (error) {
    console.error(`   OGG conversion failed: ${error.message}`);
  }
}

async function processDirectory() {
  console.log('Audio optimization');
  console.log('Input directory:', INPUT_DIR);
  console.log('Output formats: MP3 (quality 2) + OGG (quality 4)');

  const allFiles = await getAllFiles(INPUT_DIR);
  const audioFiles = allFiles.filter(file => {
    const ext = extname(file).toLowerCase();
    return ['.wav', '.m4a', '.aac', '.flac'].includes(ext);
  });

  if (audioFiles.length === 0) {
    console.log('No audio files found (WAV, M4A, AAC, FLAC, MP3)');
    return;
  }

  console.log(`Found ${audioFiles.length} audio files to convert`);

  let totalInputSize = 0;
  let totalOutputSize = 0;
  let successCount = 0;

  for (const inputPath of audioFiles) {
    const dir = pathDirname(inputPath);
    const fileName = basename(inputPath);
    const baseName = fileName.replace(extname(fileName), '');
    const mp3Path = join(dir, `${baseName}.mp3`);
    const oggPath = join(dir, `${baseName}.ogg`);

    const result = await convertToMP3(inputPath, mp3Path);

    if (result) {
      await convertToOGG(inputPath, oggPath);

      totalInputSize += result.inputSize;
      totalOutputSize += result.outputSize;
      successCount++;
    }

  }

  const totalCompression = ((1 - totalOutputSize / totalInputSize) * 100).toFixed(1);

  console.log('Summary:');
  console.log(`Converted: ${successCount}/${audioFiles.length} files`);
  console.log(`Total size: ${(totalInputSize / 1024).toFixed(1)} KB → ${(totalOutputSize / 1024).toFixed(1)} KB`);
  console.log(`Saved: ${((totalInputSize - totalOutputSize) / 1024).toFixed(1)} KB (-${totalCompression}%)`);
}

processDirectory().catch(console.error);
