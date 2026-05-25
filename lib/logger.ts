type Level = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  ts:      string;
  level:   Level;
  ns:      string;
  msg:     string;
  data?:   unknown;
}

function write(level: Level, ns: string, msg: string, data?: unknown) {
  const entry: LogEntry = {
    ts:    new Date().toISOString(),
    level,
    ns,
    msg,
    ...(data !== undefined ? { data } : {}),
  };

  const line = JSON.stringify(entry);
  if (level === 'error') {
    console.error(line);
  } else if (level === 'warn') {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export function createLogger(ns: string) {
  return {
    info:  (msg: string, data?: unknown) => write('info',  ns, msg, data),
    warn:  (msg: string, data?: unknown) => write('warn',  ns, msg, data),
    error: (msg: string, data?: unknown) => write('error', ns, msg, data),
    debug: (msg: string, data?: unknown) => {
      if (process.env.NODE_ENV !== 'production') write('debug', ns, msg, data);
    },
  };
}
