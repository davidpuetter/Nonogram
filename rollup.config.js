import typescript from '@rollup/plugin-typescript'
import bundleWorker from 'rollup-plugin-bundle-worker'
import nodeResolve from '@rollup/plugin-node-resolve'

export default {
  input: 'src/index.ts',
  output: {
    file: 'docs/nonogram.js',
    format: 'es',
	name: 'nonogram',
	globals: {
	  'web-worker': 'Worker'
	}
  },
  plugins: [
	nodeResolve(),
    typescript(),
    bundleWorker(),
  ],
}
