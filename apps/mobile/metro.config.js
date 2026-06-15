const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname
const monorepoRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

// 1. Monitorar as pastas do monorepo
config.watchFolders = [monorepoRoot]

// 2. Garantir que o Metro encontre os pacotes tanto na raiz quanto no app
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
]

// 3. Forçar o uso do Expo Router e extensões modernas
config.resolver.sourceExts.push('mjs')

module.exports = config
