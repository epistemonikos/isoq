'use strict'
const merge = require('webpack-merge')
const prodEnv = require('./prod.env')
const { fromEnv } = require('./env')

module.exports = merge(prodEnv, {
  NODE_ENV: '"test"',
  ENABLE_REGISTRATION: fromEnv('ENABLE_REGISTRATION', 'false')
})
