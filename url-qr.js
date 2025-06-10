import QRCode from 'qrcode';

// Get the URL of the current app
const currentUrl = process.env.REPL_SLUG ? 
  `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co` : 
  'https://f687e0af-8a85-452c-998d-fcf012f2440c-00-qm9vd9fy3b2t.riker.replit.dev';

// Get just the hostname part for the Expo URL
const hostname = new URL(currentUrl).hostname;

// Create proper Expo deep link format 
// Using exp+fixer-app:// scheme format for best compatibility
const expoUrl = `exp+fixer-app://expo-development-client/?url=${encodeURIComponent(`${currentUrl}`)}`;

// Alternative URLs to try if the main one doesn't work
const expoAltUrl = `exp://${hostname}`;
const expoRawUrl = currentUrl.replace('https://', 'exp://');

// Generate the QR code
const generateQR = async () => {
  try {
    // Generate QR code
    const code = await QRCode.toString(expoUrl, { type: 'terminal', small: true });
    
    // Print instructions
    console.log('\n\x1b[32m=================================\x1b[0m');
    console.log('\x1b[32m       🔧 Fixer App 🔧       \x1b[0m');
    console.log('\x1b[32m=================================\x1b[0m\n');
    console.log('Scan this QR code with the Expo Go app on your phone:\n');
    console.log(code);
    console.log('\nOr try one of these URLs in Expo Go:');
    console.log('1. Primary URL (recommended):');
    console.log('\x1b[33m' + expoUrl + '\x1b[0m\n');
    console.log('2. Alternative format:');
    console.log('\x1b[33m' + expoAltUrl + '\x1b[0m\n');
    console.log('3. Basic format:');
    console.log('\x1b[33m' + expoRawUrl + '\x1b[0m\n');
    console.log('Current web URL:');
    console.log('\x1b[36m' + currentUrl + '\x1b[0m\n');
    console.log('Make sure you have Expo Go installed:');
    console.log('- Android: https://play.google.com/store/apps/details?id=host.exp.exponent');
    console.log('- iOS: https://apps.apple.com/app/expo-go/id982107779\n');
    console.log('\x1b[32mTroubleshooting Tips:\x1b[0m');
    console.log('- Make sure your phone and computer are on the same network');
    console.log('- Try all three URL formats shown above');
    console.log('- If using iOS, make sure to open the link in Expo Go\n');
    
  } catch (err) {
    console.error('Error generating QR code:', err);
  }
};

generateQR();