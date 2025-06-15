/**
 * Utilidad simple para logging
 * En producción, podrías usar una biblioteca más completa como Winston
 */
const logger = {
    info: (message, data = {}) => {
        console.log(`[INFO] ${message}`, data);
    },
    
    error: (message, error = {}) => {
        console.error(`[ERROR] ${message}`, error);
        
        // Si es un objeto de error, mostrar el stack trace
        if (error instanceof Error) {
            console.error(error.stack);
        }
    },
    
    warn: (message, data = {}) => {
        console.warn(`[WARN] ${message}`, data);
    }
};

module.exports = logger;