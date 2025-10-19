const LOG_LEVELS = {
    SUCCESS: 'success',
    ERROR: 'error',
    WARN: 'warn',
    INFO: 'info',
  };
  
  const BASE_LOG_DIR = require('path').join(__dirname, '../../logs');
  
  module.exports = { LOG_LEVELS, BASE_LOG_DIR };
  