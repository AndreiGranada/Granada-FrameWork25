module.exports = function (api) {
    api.cache(true);
    return {
        presets: ['babel-preset-expo'],
        plugins: [
            // Permite parsing de import.meta em dependências que publicam ESM puro
            '@babel/plugin-syntax-import-meta',
            // Reescreve import.meta para evitar SyntaxError em ambiente web não-module
            './babel-plugin-rewrite-import-meta.js',
            [
                'module-resolver',
                {
                    alias: {
                        '@': './',
                    },
                },
            ],
            // IMPORTANT: must be the last plugin
            'react-native-worklets/plugin',
        ],
    };
};
