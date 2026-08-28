const { execSync } = require('child_process');
const path = require('path');
const os = require('os');

const desktopPath = path.join(os.homedir(), 'Desktop', 'Khmer Caption Studio.lnk');
const targetBat = path.join(__dirname, 'Start_Khmer_Caption_Studio.bat');
const iconPath = path.join(__dirname, 'app_icon.ico');

const psCmd = `$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('${desktopPath.replace(/'/g, "''")}'); $s.TargetPath = '${targetBat.replace(/'/g, "''")}'; $s.WorkingDirectory = '${__dirname.replace(/'/g, "''")}'; $s.IconLocation = '${iconPath.replace(/'/g, "''")}'; $s.Description = 'Khmer Caption Studio by CHHIT'; $s.Save()`;

try {
  execSync(`powershell -ExecutionPolicy Bypass -Command "${psCmd}"`, { stdio: 'inherit' });
  console.log('Desktop shortcut successfully updated with new icon!');
} catch (e) {
  console.error('Error updating shortcut:', e);
}
