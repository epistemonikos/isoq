/*
 * Este es un archivo personalizado para solucionar el problema de
 * 'Cannot assign to read only property 'exports' of object '#<Object>'
 * Basado en el cliente original de webpack-dev-server pero con una solución para la compatibilidad de módulos
 */
'use strict';

const { WebSocketClient } = require('./WebSocketClient');

// Define la clase BaseClient
class BaseClient {
  constructor(url) {
    this.url = url;
    this.ws = new WebSocketClient(url);
  }

  onOpen(f) {
    this.ws.onopen = f;
  }

  onClose(f) {
    this.ws.onclose = f;
  }

  onMessage(f) {
    this.ws.onmessage = (event) => {
      f(event.data);
    };
  }

  onError(f) {
    this.ws.onerror = f;
  }

  send(data) {
    this.ws.send(data);
  }

  close() {
    this.ws.close();
  }

  static getClientPath(options) {
    throw new Error('Client path implementation required');
  }
}

// Solución universal para compatibilidad de módulos
// Esta forma de exportación es compatible con CommonJS, AMD y window global
if (typeof module !== 'undefined') {
  module.exports = BaseClient;
} else if (typeof define === 'function' && define.amd) {
  define([], function () { return BaseClient; });
} else {
  window.BaseClient = BaseClient;
}
