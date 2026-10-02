'use strict'
const utils = require('./utils')
const { buildInfo } = require('./buildInfo')
const webpack = require('webpack')
const config = require('../config')
const merge = require('webpack-merge')
const path = require('path')
const baseWebpackConfig = require('./webpack.base.conf')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const portfinder = require('portfinder')

const HOST = process.env.HOST
const PORT = process.env.PORT && Number(process.env.PORT)

const devWebpackConfig = merge(baseWebpackConfig, {
  mode: 'development',
  module: {
    rules: utils.styleLoaders({ sourceMap: config.dev.cssSourceMap, usePostCSS: true })
  },
  // Usar source-map más ligero para desarrollo
  devtool: 'eval-cheap-module-source-map',
  target: 'web',

  // Optimizaciones para el servidor de desarrollo (webpack-dev-server v4)
  devServer: {
    historyApiFallback: {
      rewrites: [
        { from: /.*/, to: path.posix.join(config.dev.assetsPublicPath, 'index.html') },
      ],
    },
    hot: true,
    compress: true,
    host: HOST || config.dev.host,
    port: PORT || config.dev.port,
    open: config.dev.autoOpenBrowser,
    proxy: config.dev.proxyTable,
    client: {
      overlay: {
        warnings: false,
        errors: true
      },
      logging: 'warn',
      webSocketURL: 'ws://episte.lo:8090/ws'
    },
    webSocketServer: 'ws'
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': require('../config/dev.env')
    }),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: 'index.html',
      inject: true,
      // El template es el mismo de prod y test, y lee `buildInfo` sin condicionales: si acá
      // no se pasara, `npm run dev` reventaría al compilar el HTML. En dev el dato no sirve
      // para nada —el commit es el del working copy, que cambia mientras se trabaja— pero la
      // alternativa era un `<% if %>` en el template, que es justo donde un error se
      // descubre tarde.
      buildInfo: buildInfo(),
      minify: {
        removeComments: true,
        collapseWhitespace: false,
        removeAttributeQuotes: false
      }
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, '../static'),
          to: config.dev.assetsSubDirectory,
          globOptions: {
            ignore: ['.*']
          }
        }
      ]
    })
  ],
  optimization: {
    removeAvailableModules: false,
    removeEmptyChunks: false,
    splitChunks: false,
    runtimeChunk: false,
    moduleIds: 'named',
    chunkIds: 'named'
  },
  node: {
    __dirname: false,
    __filename: false,
    global: true
  },
  // Optimizaciones específicas para Sass
  resolve: {
    ...baseWebpackConfig.resolve,
    alias: {
      ...baseWebpackConfig.resolve.alias,
      'bootstrap-vue$': 'bootstrap-vue/dist/bootstrap-vue.esm.js'
    }
  }
})

module.exports = new Promise((resolve, reject) => {
  portfinder.basePort = process.env.PORT || config.dev.port
  portfinder.getPort((err, port) => {
    if (err) {
      reject(err)
    } else {
      process.env.PORT = port
      devWebpackConfig.devServer.port = port
      resolve(devWebpackConfig)
    }
  })
})
