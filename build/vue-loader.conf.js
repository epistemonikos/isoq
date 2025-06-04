'use strict'
const utils = require('./utils')
const config = require('../config')
const isProduction = process.env.NODE_ENV === 'production'
const sourceMapEnabled = isProduction
  ? config.build.productionSourceMap
  : config.dev.cssSourceMap

module.exports = {
  cssSourceMap: sourceMapEnabled,
  cacheBusting: config.dev.cacheBusting,
  transformAssetUrls: {
    video: ['src', 'poster'],
    source: 'src',
    img: 'src',
    image: 'xlink:href',
    'b-avatar': 'src',
    'b-img': 'src',
    'b-img-lazy': ['src', 'blank-src'],
    'b-card': 'img-src',
    'b-card-img': 'img-src',
    'b-carousel-slide': 'img-src',
    'b-embed': 'src',
    'b-jumbotron': 'header-src',
    'b-figure': 'src'
  }
}
