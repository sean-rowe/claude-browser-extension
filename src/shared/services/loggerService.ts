/**
 * Logger service for consistent logging throughout the extension
 */
export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
    NONE = 4
}

/**
 * Service for logging messages at different levels with consistent formatting
 */
export class LoggerService {
    private static instance: LoggerService;
    private logLevel: LogLevel = LogLevel.INFO;
    private readonly prefix = '[Claude Artifacts]';
    private readonly isProduction = process.env.NODE_ENV === 'production';

    private constructor() {
        // Private constructor for singleton
        if (this.isProduction) {
            this.logLevel = LogLevel.WARN;
        }
    }

    /**
     * Get the singleton instance of the logger
     */
    public static getInstance(): LoggerService {
        if (!LoggerService.instance) {
            LoggerService.instance = new LoggerService();
        }
        return LoggerService.instance;
    }

    /**
     * Set the minimum log level to display
     */
    public setLogLevel(level: LogLevel): void {
        this.logLevel = level;
    }

    /**
     * Log a debug message
     */
    public debug(message: string, ...args: any[]): void {
        if (this.logLevel <= LogLevel.DEBUG) {
            console.debug(`${this.prefix} ${message}`, ...args);
        }
    }

    /**
     * Log an info message
     */
    public info(message: string, ...args: any[]): void {
        if (this.logLevel <= LogLevel.INFO) {
            console.info(`${this.prefix} ${message}`, ...args);
        }
    }

    /**
     * Log a warning message
     */
    public warn(message: string, ...args: any[]): void {
        if (this.logLevel <= LogLevel.WARN) {
            console.warn(`${this.prefix} ${message}`, ...args);
        }
    }

    /**
     * Log an error message
     */
    public error(message: string, ...args: any[]): void {
        if (this.logLevel <= LogLevel.ERROR) {
            console.error(`${this.prefix} ${message}`, ...args);
        }
    }

    /**
     * Create a group in the console for related logs
     */
    public group(label: string): void {
        if (this.logLevel < LogLevel.NONE) {
            console.group(`${this.prefix} ${label}`);
        }
    }

    /**
     * End a console group
     */
    public groupEnd(): void {
        if (this.logLevel < LogLevel.NONE) {
            console.groupEnd();
        }
    }

    /**
     * Measure performance between points
     */
    public time(label: string): void {
        if (this.logLevel <= LogLevel.DEBUG) {
            console.time(`${this.prefix} ${label}`);
        }
    }

    /**
     * End performance measurement
     */
    public timeEnd(label: string): void {
        if (this.logLevel <= LogLevel.DEBUG) {
            console.timeEnd(`${this.prefix} ${label}`);
        }
    }
}
