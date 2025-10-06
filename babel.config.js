module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          extensions: ['.tsx', '.ts', '.js', '.json'],
          alias: {
            '@components': './src/components',
            '@screens': './src/screens',
            '@navigation': './src/navigation',
            '@store': './src/store',
            '@services': './src/services',
            '@types': './src/types',
            '@utils': './src/utils',
            '@hooks': './src/hooks'
          }
        }
      ],
      'react-native-reanimated/plugin'
    ]
  };
};
