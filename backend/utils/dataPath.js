const fs = require('fs')
const path = require('path')

const DEFAULT_DATA_DIR = path.join(__dirname, '../data')
const ACTIVE_DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : DEFAULT_DATA_DIR

function ensureDataDir() {
  fs.mkdirSync(ACTIVE_DATA_DIR, { recursive: true })
}

function dataPath(filename) {
  ensureDataDir()
  const target = path.join(ACTIVE_DATA_DIR, filename)
  const seed = path.join(DEFAULT_DATA_DIR, filename)

  if (target !== seed && !fs.existsSync(target) && fs.existsSync(seed)) {
    fs.copyFileSync(seed, target)
  }

  return target
}

module.exports = { dataPath, ACTIVE_DATA_DIR }
