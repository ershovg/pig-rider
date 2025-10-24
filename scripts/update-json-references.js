#!/usr/bin/env node

/**
 * Update JSON Sprite Sheet References
 * Заменяет .png → .avif в meta.image для всех JSON спрайтшитов
 */

import { readdir, readFile, writeFile } from 'fs/promises';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SPRITES_DIR = join(__dirname, '../public/assets/sprites');

async function updateJsonReferences() {
  console.log('🔧 Updating JSON sprite sheet references');
  console.log('📁 Directory:', SPRITES_DIR);
  console.log('');

  const files = await readdir(SPRITES_DIR);
  const jsonFiles = files.filter(file => extname(file).toLowerCase() === '.json');

  if (jsonFiles.length === 0) {
    console.log('⚠️  No JSON files found');
    return;
  }

  let updatedCount = 0;

  for (const file of jsonFiles) {
    const filePath = join(SPRITES_DIR, file);

    try {
      const content = await readFile(filePath, 'utf-8');
      const data = JSON.parse(content);

      if (data.meta && data.meta.image && data.meta.image.endsWith('.png')) {
        const oldImage = data.meta.image;
        const newImage = oldImage.replace('.png', '.avif');

        data.meta.image = newImage;

        await writeFile(filePath, JSON.stringify(data, null, '\t'), 'utf-8');

        console.log(`✅ ${file}`);
        console.log(`   ${oldImage} → ${newImage}`);
        updatedCount++;
      } else {
        console.log(`⏭️  ${file} (no PNG reference or already updated)`);
      }
    } catch (error) {
      console.error(`❌ Failed to process ${file}:`, error.message);
    }
  }

  console.log('');
  console.log('═══════════════════════════════════════');
  console.log(`✅ Updated ${updatedCount} JSON file(s)`);
  console.log('═══════════════════════════════════════');
}

updateJsonReferences().catch(console.error);
