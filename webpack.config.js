// Este archivo es para ayudar a resolver incompatibilidades entre webpack-dev-server y la configuración actual
const webpackConfig = require('./build/webpack.dev.conf.js');
const path = require('path');

// Esta función se asegura de que la configuración tenga todas las propiedades necesarias para evitar errores
function ensureWebpackConfig(config) {
  // Asegurarse de que el modo sea development
  config.mode = 'development';

  // Asegurar que existe la resolución de alias
  if (!config.resolve) config.resolve = {};
  if (!config.resolve.alias) config.resolve.alias = {};

  // Asegurar que existe la configuración de optimización
  if (!config.optimization) config.optimization = {};
  config.optimization.moduleIds = 'named';

  // Asegurar que el target es 'web'
  config.target = 'web';

  // Asegurar que la configuración de node es correcta para webpack 5
  config.node = {
    __dirname: false,
    __filename: false,
    global: true
  };

  return config;
}

// Maneja tanto el caso en que webpackConfig es una Promise como cuando es un objeto directo
const config = webpackConfig instanceof Promise
  ? webpackConfig.then(config => ensureWebpackConfig(config))
  : ensureWebpackConfig(webpackConfig);

module.exports = config;
