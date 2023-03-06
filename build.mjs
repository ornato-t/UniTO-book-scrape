import * as esbuild from 'esbuild'
import { compile } from 'nexe'
import { unlink } from 'fs'

/*This is going to throw a warning 
   "import.meta" is not available with the "cjs" output format and will be empty [empty-import-meta]
  No worries, it's not going to cause any problems
*/

//Bundle in one file with ESBuild (import dependencies, translate to CommonJS)
await esbuild.build({
    entryPoints: ['index.ts'],
    bundle: true,
    outfile: 'out.cjs',
    platform: 'node',
    target: 'node18',
})

//Serialize with nexe, compile CommonJS to binary
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
})