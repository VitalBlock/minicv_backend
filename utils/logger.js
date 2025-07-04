// Implementación simple de logger
const logger = {
  error: (message, error) => {
    console.error(`[ERROR] ${message}:`, error);
  },
  info: (message) => {
    console.log(`[INFO] ${message}`);
  },
  warn: (message) => {
    console.warn(`[WARN] ${message}`);
  }
};

module.exports = logger;