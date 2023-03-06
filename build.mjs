import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['index.ts'],
  bundle: true,
  outfile: 'out.cjs',
  platform: 'node',
  target: 'node18',
})

/*This is going to throw a warning 
   "import.meta" is not available with the "cjs" output format and will be empty [empty-import-meta]
  No worries, it's not going to cause any problems
*/