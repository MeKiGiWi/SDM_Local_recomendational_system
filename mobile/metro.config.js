const { getDefaultConfig } = require('expo/metro-config')

const config = getDefaultConfig(__dirname)

config.resolver.assetExts = [...config.resolver.assetExts, 'cbm']

module.exports = config
