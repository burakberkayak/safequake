module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // react-native-reanimated/plugin listede HER ZAMAN en sonda olmalı.
      'react-native-reanimated/plugin',
    ],
  };
};
