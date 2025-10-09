// Babel plugin simples para reescrever "import.meta" para um objeto literal seguro
// que funciona mesmo quando o bundle final não é tratado como módulo.
// Estratégia: substitui MetaProperty (import.meta) por expressão ({ url: (typeof document!=="undefined" ? window.location.href : "") })
// Assim expressões como import.meta.url continuam funcionando.
module.exports = function rewriteImportMeta() {
    return {
        name: 'rewrite-import-meta',
        visitor: {
            MetaProperty(path) {
                const node = path.node;
                if (node.meta && node.meta.name === 'import' && node.property && node.property.name === 'meta') {
                    path.replaceWithSourceString('({ url: (typeof document!=="undefined" ? window.location.href : "") })');
                }
            }
        }
    };
};
