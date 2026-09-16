'use strict'
const path = require('path')
const utils = require('./utils')
const { buildInfo } = require('./buildInfo')
const webpack = require('webpack')
const config = require('../config')
const merge = require('webpack-merge')
const baseWebpackConfig = require('./webpack.base.conf')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const OptimizeCSSPlugin = require('optimize-css-assets-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')
const { GenerateSW } = require('workbox-webpack-plugin')

const env = require('../config/prod.env')

const webpackConfig = merge(baseWebpackConfig, {
  mode: 'production',
  module: {
    rules: utils.styleLoaders({
      sourceMap: config.build.productionSourceMap,
      extract: true,
      usePostCSS: true
    })
  },
  devtool: config.build.productionSourceMap ? config.build.devtool : false,
  output: {
    path: config.build.assetsRoot,
    filename: utils.assetsPath('js/[name].[chunkhash].js'),
    chunkFilename: utils.assetsPath('js/[id].[chunkhash].js')
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
      minSize: 20000,
      maxSize: 0,
      minChunks: 1,
      maxAsyncRequests: 30,
      maxInitialRequests: 30,
      automaticNameDelimiter: '~',
      name: true,
      cacheGroups: {
        docx: {
          name: 'chunk-docx',
          test: /[\\/]node_modules[\\/]docx[\\/]/,
          priority: 20,
          chunks: 'all'
        },
        bootstrap: {
          name: 'chunk-bootstrap',
          test: /[\\/]node_modules[\\/](bootstrap|bootstrap-vue)[\\/]/,
          priority: 20,
          chunks: 'all'
        },
        fortawesome: {
          name: 'chunk-fortawesome',
          test: /[\\/]node_modules[\\/]@fortawesome[\\/]/,
          priority: 20,
          chunks: 'all'
        },
        vendors: {
          name: 'chunk-vendors',
          test: /[\\/]node_modules[\\/]/,
          priority: -10,
          chunks: 'initial'
        },
        common: {
          name: 'chunk-common',
          minChunks: 2,
          priority: -20,
          chunks: 'all',
          reuseExistingChunk: true
        }
      }
    },
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            warnings: false
          }
        },
        sourceMap: config.build.productionSourceMap,
        parallel: true
      }),
      new OptimizeCSSPlugin({
        cssProcessorOptions: config.build.productionSourceMap
          ? { safe: true, map: { inline: false } }
          : { safe: true }
      })
    ]
  },
  plugins: [
    // http://vuejs.github.io/vue-loader/en/workflow/production.html
    new webpack.DefinePlugin({
      'process.env': env
    }),
    // extract css into its own file
    new MiniCssExtractPlugin({
      filename: utils.assetsPath('css/[name].[contenthash].css'),
      chunkFilename: utils.assetsPath('css/[id].[contenthash].css')
    }),
    // generate dist index.html with correct asset hash for caching.
    // you can customize output by editing /index.html
    // see https://github.com/ampedandwired/html-webpack-plugin
    new HtmlWebpackPlugin({
      filename: config.build.index,
      template: 'index.html',
      inject: true,
      // El sello va en el HTML y no en el bundle a propósito: la pregunta «¿qué código está
      // sirviendo este host?» se contesta con un GET a la raíz, sin descargar 550 KB de JS ni
      // saber cómo se llama el chunk de esta compilación.
      buildInfo: buildInfo(),
      minify: {
        removeComments: true,
        collapseWhitespace: true,
        removeAttributeQuotes: true
      },
      chunksSortMode: 'auto'
    }),
    // keep module.id stable when vendor modules does not change
    new webpack.HashedModuleIdsPlugin(),
    // enable scope hoisting
    new webpack.optimize.ModuleConcatenationPlugin(),

    // copy custom static assets
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, '../static'),
          to: config.build.assetsSubDirectory,
          globOptions: {
            ignore: ['.*']
          }
        }
      ]
    }),

    // PWA Service Worker - Workbox
    new GenerateSW({
      clientsClaim: true,
      skipWaiting: true,
      swDest: 'service-worker.js',
      // Fallback para navegación (SPA)
      navigateFallback: 'index.html',
      // Cache de assets estáticos generados por webpack
      include: [/\.html$/, /\.js$/, /\.css$/, /\.woff2?$/, /\.png$/, /\.jpg$/, /\.svg$/],
      // No precachear archivos muy grandes
      maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
      // Runtime caching para API y recursos externos
      runtimeCaching: [
        {
          // Cache de imágenes
          urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'images-cache',
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 30 * 24 * 60 * 60 // 30 días
            }
          }
        },
        {
          // Cache de fuentes
          urlPattern: /\.(?:woff|woff2|ttf|eot)$/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'fonts-cache',
            expiration: {
              maxEntries: 30,
              maxAgeSeconds: 365 * 24 * 60 * 60 // 1 año
            }
          }
        }
      ]
    })
  ]
})

if (config.build.productionGzip) {
  const CompressionWebpackPlugin = require('compression-webpack-plugin')

  webpackConfig.plugins.push(
    new CompressionWebpackPlugin({
      filename: '[path][base].gz[query]',
      algorithm: 'gzip',
      test: new RegExp(
        '\\.(' +
        config.build.productionGzipExtensions.join('|') +
        ')$'
      ),
      threshold: 10240,
      minRatio: 0.8
    })
  )
}

if (config.build.bundleAnalyzerReport) {
  const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
  webpackConfig.plugins.push(new BundleAnalyzerPlugin())
}

if (process.env.SENTRY_AUTH_TOKEN) {
  const SentryWebpackPlugin = require('@sentry/webpack-plugin')
  webpackConfig.plugins.push(
    new SentryWebpackPlugin({
      authToken: process.env.SENTRY_AUTH_TOKEN,
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      include: './dist',
      ignore: ['node_modules'],
      release: process.env.SENTRY_RELEASE || require('../package.json').version,
      deleteAfterUpload: true,
    })
  )
}

module.exports = webpackConfig
