const PREFIX = '[GnomeMagicLamp]';

export const logger = {
  log: (isEnabled, message) => {
    if (!isEnabled) return;
    console.log(`${PREFIX} ${message}`);
  },

  debug: (isEnabled, message) => {
    if (!isEnabled) return;
    console.debug(`${PREFIX} ${message}`);
  },

  info: (isEnabled, message) => {
    if (!isEnabled) return;
    console.info(`${PREFIX} ${message}`);
  },

  warn: (isEnabled, message) => {
    if (!isEnabled) return;
    console.warn(`${PREFIX} ${message}`);
  },

  error: (isEnabled, message, exception = null) => {
    if (!isEnabled) return;
    console.error(`${PREFIX} ${message}:\n${exception}`);
  },
};
