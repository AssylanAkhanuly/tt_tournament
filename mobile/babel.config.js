module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // reanimated 4 использует react-native-worklets — плагин обязателен и должен
    // идти последним; без него жесты/анимации сетки не работают.
    plugins: ['react-native-worklets/plugin'],
  };
};
