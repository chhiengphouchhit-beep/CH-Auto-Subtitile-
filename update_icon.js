const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const srcImage = 'C:\\Users\\ASUS\\.gemini\\antigravity\\brain\\529652c8-83f3-4194-8e65-20ca2ac90ef5\\khmer_caption_studio_ka_chhit_icon_1787885254269.jpg';
const destPng = 'D:\\khmer-caption-studio\\app_icon.png';
const faviconPng = 'D:\\khmer-caption-studio\\public\\favicon.png';

try {
  fs.copyFileSync(srcImage, destPng);
  fs.copyFileSync(srcImage, faviconPng);
  console.log('Copied app_icon.png & favicon.png successfully!');

  // Run create_ico.ps1
  execSync('powershell -ExecutionPolicy Bypass -File D:\\khmer-caption-studio\\create_ico.ps1', { stdio: 'inherit' });
  console.log('Updated app_icon.ico successfully!');
} catch (e) {
  console.error('Error updating icon:', e);
}
