#!/usr/bin/env node

/**
 * Icon Generator for Pipey
 * 
 * Generates all required icon sizes for:
 * - PWA
 * - iOS App
 * - Android App
 * 
 * Requires: sharp (npm install sharp)
 * Usage: node scripts/generate-icons.js <source-image>
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ICONS_DIR = path.join(__dirname, '../public/icons');

const PWA_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const IOS_SIZES = [20, 29, 40, 58, 60, 76, 80, 87, 120, 152, 167, 180, 1024];
const ANDROID_SIZES = [36, 48, 72, 96, 144, 192];

async function generateIcons(sourcePath) {
  if (!sourcePath) {
    console.log('Usage: node generate-icons.js <source-image.png>');
    console.log('Source image should be at least 1024x1024 pixels');
    process.exit(1);
  }

  if (!fs.existsSync(sourcePath)) {
    console.error(`Error: Source file not found: ${sourcePath}`);
    process.exit(1);
  }

  // Create icons directory
  if (!fs.existsSync(ICONS_DIR)) {
    fs.mkdirSync(ICONS_DIR, { recursive: true });
  }

  const image = sharp(sourcePath);
  const metadata = await image.metadata();

  console.log(`Source: ${sourcePath} (${metadata.width}x${metadata.height})`);
  console.log('Generating icons...\n');

  // PWA Icons
  console.log('PWA Icons:');
  for (const size of PWA_SIZES) {
    const filename = `icon-${size}x${size}.png`;
    await sharp(sourcePath)
      .resize(size, size)
      .png()
      .toFile(path.join(ICONS_DIR, filename));
    console.log(`  ✓ ${filename}`);
  }

  // Apple Touch Icon
  await sharp(sourcePath)
    .resize(180, 180)
    .png()
    .toFile(path.join(ICONS_DIR, 'apple-touch-icon.png'));
  console.log('  ✓ apple-touch-icon.png');

  // Favicon
  await sharp(sourcePath)
    .resize(32, 32)
    .png()
    .toFile(path.join(ICONS_DIR, 'icon-32x32.png'));
  console.log('  ✓ icon-32x32.png (favicon)');

  // Badge (for notifications)
  await sharp(sourcePath)
    .resize(72, 72)
    .png()
    .toFile(path.join(ICONS_DIR, 'badge-72x72.png'));
  console.log('  ✓ badge-72x72.png');

  console.log('\n✅ All icons generated in public/icons/');
  console.log('\nNext steps:');
  console.log('1. Copy iOS icons to ios/App/App/Assets.xcassets/AppIcon.appiconset/');
  console.log('2. Copy Android icons to android/app/src/main/res/mipmap-*/');
}

// Run
const sourceImage = process.argv[2];
generateIcons(sourceImage).catch(console.error);
