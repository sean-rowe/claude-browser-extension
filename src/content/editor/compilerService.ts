import { LoggerService } from '../../shared/services/loggerService';
import { MessageService } from '../events/messageService';

/**
 * Represents a compiler result
 */
interface CompilerResult {
    output: string | any;
    error?: string;
    executionTime?: number;
}

/**
 * Service for compiling and running code
 */
export class CompilerService {
    private static instance: CompilerService;
    private readonly logger = LoggerService.getInstance();
    private readonly messageService = MessageService.getInstance();

    private constructor() {
        // Register message handler for compiler requests
        this.messageService.registerHandler('compileAndRun', this.handleCompileAndRun.bind(this));
    }

    /**
     * Get the singleton instance of the compiler service
     */
    public static getInstance(): CompilerService {
        if (!CompilerService.instance) {
            CompilerService.instance = new CompilerService();
        }
        return CompilerService.instance;
    }

    /**
     * Handle compile and run message requests
     */
    private async handleCompileAndRun(message: any): Promise<CompilerResult> {
        const { code, language } = message;

        if (!code || !language) {
            return { output: '', error: 'Missing code or language' };
        }

        return this.compileAndRun(code, language);
    }

    /**
     * Compile and run code using the appropriate engine
     */
    public async compileAndRun(code: string, language: string): Promise<CompilerResult> {
        this.logger.debug(`CompilerService: Compiling ${language} code`);

        try {
            // Safety checks
            if (!code.trim()) {
                return { output: '', error: 'No code provided' };
            }

            // Choose compiler based on language
            switch (language.toLowerCase()) {
                case 'javascript':
                case 'js':
                    return this.runJavaScript(code);

                case 'typescript':
                case 'ts':
                    return await this.runTypeScript(code);

                case 'html':
                    return this.runHtml(code);

                default:
                    // For other languages, send to background script for remote compilation
                    return this.remoteCompile(code, language);
            }
        } catch (error) {
            this.logger.error('CompilerService: Compilation error', error);
            return {
                output: '',
                error: error instanceof Error ? error.message : 'Unknown error during compilation'
            };
        }
    }

    /**
     * Run JavaScript code in a sandboxed environment
     */
    private runJavaScript(code: string): CompilerResult {
        try {
            const startTime = performance.now();

            // Create a sandboxed environment
            const sandbox = this.createSandbox();

            // Add timeout protection
            const timeoutCode = `
        let __timeout_id;
        const __executeWithTimeout = () => {
          return new Promise((resolve, reject) => {
            __timeout_id = setTimeout(() => {
              reject(new Error('Execution timed out (5000ms)'));
            }, 5000);
            
            try {
              const result = (function() { ${code} })();
              clearTimeout(__timeout_id);
              resolve(result);
            } catch (error) {
              clearTimeout(__timeout_id);
              reject(error);
            }
          });
        };
        
        __executeWithTimeout();
      `;

            // Execute in the sandbox and capture console output
            const result = sandbox.eval(timeoutCode);
            const executionTime = performance.now() - startTime;

            return {
                output: sandbox.getConsoleOutput(),
                executionTime
            };
        } catch (error) {
            return {
                output: '',
                error: error instanceof Error ? error.message : 'Unknown error during execution'
            };
        }
    }

    /**
     * Run TypeScript code by transpiling then executing as JavaScript
     */
    private async runTypeScript(code: string): Promise<CompilerResult> {
        try {
            // Load TypeScript compiler from CDN if needed
            if (!(window as any).ts) {
                await this.loadTypescriptCompiler();
            }

            const ts = (window as any).ts;

            // Transpile TypeScript to JavaScript
            const transpileOutput = ts.transpileModule(code, {
                compilerOptions: {
                    module: ts.ModuleKind.ESNext,
                    target: ts.ScriptTarget.ES2020,
                    strict: false,
                    esModuleInterop: true
                }
            });

            const jsCode = transpileOutput.outputText;

            // Execute the JavaScript code
            return this.runJavaScript(jsCode);
        } catch (error) {
            return {
                output: '',
                error: error instanceof Error ? error.message : 'TypeScript compilation error'
            };
        }
    }

    /**
     * Load TypeScript compiler from CDN
     */
    private async loadTypescriptCompiler(): Promise<void> {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/typescript@5.0.4/lib/typescript.min.js';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load TypeScript compiler'));
            document.head.appendChild(script);
        });
    }

    /**
     * Run HTML code by creating a sandboxed iframe
     */
    private runHtml(code: string): CompilerResult {
        try {
            // Create a hidden iframe for rendering HTML
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            document.body.appendChild(iframe);

            // Set content to the iframe
            const doc = iframe.contentDocument || iframe.contentWindow?.document;
            if (!doc) {
                throw new Error('Failed to access iframe document');
            }

            doc.open();
            doc.write(code);
            doc.close();

            // Capture console logs from the iframe
            const consoleOutput: string[] = [];
            const originalConsole = iframe.contentWindow?.console;
            if (iframe.contentWindow) {
                iframe.contentWindow.console = {
                    ...originalConsole,
                    log: (...args: any[]) => {
                        originalConsole?.log(...args);
                        consoleOutput.push(args.map(arg => String(arg)).join(' '));
                    },
                    error: (...args: any[]) => {
                        originalConsole?.error(...args);
                        consoleOutput.push(`ERROR: ${args.map(arg => String(arg)).join(' ')}`);
                    },
                    warn: (...args: any[]) => {
                        originalConsole?.warn(...args);
                        consoleOutput.push(`WARNING: ${args.map(arg => String(arg)).join(' ')}`);
                    }
                } as Console;
            }

            // Return the rendered HTML and console output
            setTimeout(() => {
                document.body.removeChild(iframe);
            }, 1000);

            return {
                output: {
                    html: doc.documentElement.outerHTML,
                    consoleOutput: consoleOutput.join('\n')
                }
            };
        } catch (error) {
            return {
                output: '',
                error: error instanceof Error ? error.message : 'HTML rendering error'
            };
        }
    }

    /**
     * Remote compile code for languages that can't be run in browser
     */
    private async remoteCompile(code: string, language: string): Promise<CompilerResult> {
        try {
            // Send to background script for remote compilation
            const response = await this.messageService.sendMessage({
                action: 'remoteCompile',
                code,
                language
            });

            if (response.success) {
                return response.data;
            } else {
                return {
                    output: '',
                    error: response.error || `Remote compilation not available for ${language}`
                };
            }
        } catch (error) {
            return {
                output: '',
                error: error instanceof Error ?
                    error.message :
                    `Remote compilation failed for ${language}`
            };
        }
    }

    /**
     * Create a sandboxed environment for executing JavaScript
     */
    private createSandbox() {
        const consoleOutput: string[] = [];

        // Create sandbox object with limited access to globals
        const sandbox = {
            console: {
                log: (...args: any[]) => {
                    consoleOutput.push(args.map(arg => this.stringifyValue(arg)).join(' '));
                },
                error: (...args: any[]) => {
                    consoleOutput.push(`ERROR: ${args.map(arg => this.stringifyValue(arg)).join(' ')}`);
                },
                warn: (...args: any[]) => {
                    consoleOutput.push(`WARNING: ${args.map(arg => this.stringifyValue(arg)).join(' ')}`);
                },
                info: (...args: any[]) => {
                    consoleOutput.push(`INFO: ${args.map(arg => this.stringifyValue(arg)).join(' ')}`);
                }
            },
            setTimeout: setTimeout.bind(window),
            clearTimeout: clearTimeout.bind(window),
            setInterval: setInterval.bind(window),
            clearInterval: clearInterval.bind(window),
            Math: Math,
            Date: Date,
            JSON: JSON,
            Object: Object,
            Array: Array,
            String: String,
            Number: Number,
            Boolean: Boolean,
            RegExp: RegExp,
            Error: Error,
            Map: Map,
            Set: Set,
            Promise: Promise,
            eval: function(code: string) {
                const fn = new Function('sandbox', `with(sandbox) { return ${code} }`);
                return fn(sandbox);
            },
            getConsoleOutput: () => consoleOutput.join('\n')
        };

        return sandbox;
    }

    /**
     * Helper to stringify complex values for console output
     */
    private stringifyValue(value: any): string {
        if (value === null) return 'null';
        if (value === undefined) return 'undefined';

        if (typeof value === 'object') {
            try {
                return JSON.stringify(value);
            } catch (e) {
                return '[Object]';
            }
        }

        return String(value);
    }
}
