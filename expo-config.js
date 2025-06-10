// Load environment variables if needed
const path = require('path');
try {
  require('dotenv').config({ path: path.resolve(__dirname, '.env') });
} catch (e) {
  // Continue even if dotenv fails
}

// Get Stripe public key from environment
const stripePublicKey = process.env.VITE_STRIPE_PUBLIC_KEY || '';
console.log('Stripe public key available:', !!stripePublicKey);

module.exports = {
  name: 'Fixer',
  slug: 'fixer',
  owner: 'azimoto9',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './attached_assets/ChatGPT_Image_May_7__2025__01_30_03_AM-removebg-preview.png',
  splash: {
    image: './attached_assets/ChatGPT_Image_May_7__2025__01_31_24_AM-removebg-preview.png',
    resizeMode: 'contain',
    backgroundColor: '#000000'
  },
  assetBundlePatterns: [
    '**/*'
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.fixer'
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './attached_assets/ChatGPT_Image_May_7__2025__01_30_03_AM-removebg-preview.png',
      backgroundColor: '#000000'
    },
    package: 'com.fixer',
    permissions: [
      'ACCESS_COARSE_LOCATION',
      'ACCESS_FINE_LOCATION'
    ]
  },
  web: {
    favicon: './attached_assets/ChatGPT_Image_May_7__2025__01_30_03_AM-removebg-preview.png'
  },
  scheme: 'fixerapp',
  extra: {
    eas: {
      projectId: 'c2dd5237-478c-4d38-b4c7-74054caed1f2'
    },
    stripePublicKey: stripePublicKey
  },
  plugins: [
    [
      'expo-build-properties',
      {
        android: {
          compileSdkVersion: 33,
          targetSdkVersion: 33,
          buildToolsVersion: '33.0.0'
        },
        ios: {
          deploymentTarget: '13.0'
        }
      }
    ]
  ]
}