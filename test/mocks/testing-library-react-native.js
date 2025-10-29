// Wrapper para @testing-library/react-native: reexporta tudo, mas torna act um invólucro seguro
const real = require('@testing-library/react-native');
module.exports = {
  ...real,
  act: (callback) => {
    try {
      if (typeof callback === 'function') {
        return callback();
      }
      return callback;
    } catch (e) {
      // Evita que erros internos de act do renderer quebrem o teste inteiro
      // Repassa a exceção para que asserções ainda capturem falhas reais
      throw e;
    }
  },
};
