
export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogContext {
    videoId?: string;
    jobId?: string;
    workerId?: string;
    tags?: string[];
    [key: string]: any;
}

export class Logger {
    private context: LogContext;

    constructor(context: LogContext = {}) {
        this.context = context;
    }

    private log(level: LogLevel, message: string, meta: LogContext = {}) {
        const timestamp = new Date().toISOString();
        const mergedContext = { ...this.context, ...meta };

        // Merge tags
        const tags = [...(this.context.tags || []), ...(meta.tags || [])];
        if (tags.length > 0) {
            mergedContext.tags = [...new Set(tags)]; // Unique tags
        }

        const logEntry = {
            timestamp,
            level,
            message,
            ...mergedContext
        };

        console.log(JSON.stringify(logEntry));
    }

    info(message: string, meta: LogContext = {}) {
        this.log('info', message, meta);
    }

    warn(message: string, meta: LogContext = {}) {
        this.log('warn', message, meta);
    }

    error(message: string, meta: LogContext = {}) {
        this.log('error', message, meta);
    }

    debug(message: string, meta: LogContext = {}) {
        this.log('debug', message, meta);
    }

    // Create a child logger with inherited context
    child(context: LogContext): Logger {
        return new Logger({ ...this.context, ...context });
    }
}

export const logger = new Logger();
