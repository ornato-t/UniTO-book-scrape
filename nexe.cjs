const { compile } = require('nexe')
const { unlink } = require('fs')

compile({
  input: './out.cjs',
  build: true, //required to use patches
  patches: [
    async (compiler, next) => {
      await compiler.setFileContentsAsync(
        'lib/new-native-module.js',
        'module.exports = 42'
      )
      return next()
    }
  ],
  output: './dist/UniTO-book-scrape'
}).then(() => {
  console.log('success, cleaning up...')
  unlink('out.cjs', (err) => {
    if (err) throw err
    console.log('done')
  })
  console.log
})