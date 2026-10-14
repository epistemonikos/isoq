'use strict'
const merge = require('webpack-merge')
const prodEnv = require('./prod.env')
const { desdeEntorno } = require('./entorno')

module.exports = merge(prodEnv, {
  NODE_ENV: '"test"',
  ENABLE_REGISTRATION: desdeEntorno('ENABLE_REGISTRATION', 'false')
})
