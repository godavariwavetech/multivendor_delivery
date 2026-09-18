module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        alias: {
          '@': './src',
          '@app': './src/app',
          '@navigation': './src/navigation',
          '@theme': './src/theme',
          '@components': './src/components',
          '@features': './src/features',
          '@domain': './src/domain',
          '@data': './src/data',
          '@api': './src/api',
          '@hooks': './src/hooks',
          '@utils': './src/utils',
          '@config': './src/config',
          '@assets': './src/assets',
        },
      },
    ],
    // react-native-reanimated/plugin must stay last
    'react-native-reanimated/plugin',
  ],
};
