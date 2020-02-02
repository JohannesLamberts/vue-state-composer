import typescript from 'rollup-plugin-typescript2'
import { terser } from 'rollup-plugin-terser'

function createEntry(options) {
  return {
    input: 'src/index.ts',
    external: ['@vue/composition-api', 'vue'],
    ...options,
    plugins: [typescript(), ...(options.plugins || [])],
    output: {
      name: 'StateComposer',
      exports: 'named',
      globals: {
        '@vue/composition-api': 'vueCompositionApi',
      },
      ...options.output,
    },
  }
}

export default [
  // browser
  createEntry({
    output: {
      file: 'dist/state-composer.min.js',
      format: 'iife',
    },
    plugins: [terser()],
  }),
  // es
  createEntry({
    output: {
      file: 'dist/state-composer.esm.js',
      format: 'es',
    },
  }),
  // umd
  createEntry({
    output: {
      file: 'dist/state-composer.umd.js',
      format: 'umd',
    },
  }),
]
