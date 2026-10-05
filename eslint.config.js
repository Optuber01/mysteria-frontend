import pluginVue from 'eslint-plugin-vue'
import vueTsEslintConfig from '@vue/eslint-config-typescript'
import pluginVitest from '@vitest/eslint-plugin'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'

export default [
    {
        name: 'app/files-to-lint',
        files: ['**/*.{ts,mts,tsx,vue}'],
    },

    {
        name: 'app/files-to-ignore',
        ignores: ['**/dist/**', '**/dist-ssr/**', '**/coverage/**', '**/.vercel/**'],
    },

    ...pluginVue.configs['flat/essential'],
    ...vueTsEslintConfig(),

    {
        // one file per Pathway, named by its id (sun.vue, tyrant.vue), loaded by SceneSignature
        name: 'app/pathway-signatures',
        files: ['src/components/home-arcana/signatures/*.vue'],
        rules: {'vue/multi-word-component-names': 'off'},
    },

    {
        ...pluginVitest.configs.recommended,
        files: ['src/**/__tests__/*'],
    },
    skipFormatting,
]
