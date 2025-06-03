// Solución para compatibilidad entre ESM y CommonJS
const aliases = {
  'sockjs-client': require.resolve('sockjs-client/dist/sockjs.js')
};

module.exports = aliases;
