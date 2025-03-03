import { Artifact } from '../models/artifact';
import { LoggerService } from '../services/loggerService';

/**
 * Helper for generating filenames for artifacts
 */
export class FilenameHelper {
    private static readonly logger = LoggerService.getInstance();

    /**
     * Map artifact types to appropriate file extensions
     */
    private static readonly extensionMap: Record<string, string> = {
        code: '', // determined by language
        markdown: '.md',
        html: '.html',
        svg: '.svg',
        mermaid: '.mmd',
        react: '.jsx',
        unknown: '.txt'
    };

    /**
     * Map language to file extensions
     */
    private static readonly languageExtensionMap: Record<string, string> = {
        javascript: '.js',
        typescript: '.ts',
        python: '.py',
        java: '.java',
        csharp: '.cs',
        cpp: '.cpp',
        c: '.c',
        ruby: '.rb',
        go: '.go',
        php: '.php',
        sql: '.sql',
        rust: '.rs',
        swift: '.swift',
        kotlin: '.kt',
        scala: '.scala',
        dart: '.dart',
        json: '.json',
        yaml: '.yaml',
        xml: '.xml',
        css: '.css',
        scss: '.scss',
        less: '.less',
        bash: '.sh',
        powershell: '.ps1',
        plaintext: '.txt'
    };

    /**
     * Get a safe filename for an artifact
     */
    public static getFilename(
        artifact: Artifact,
        includeTimestamp: boolean = true,
        replaceInvalidChars: boolean = true,
        maxLength: number = 255
    ): string {
        try {
            // Start with artifact title
            let filename = artifact.title || 'untitled';

            // Add timestamp if requested
            if (includeTimestamp && artifact.timestamp) {
                const date = new Date(artifact.timestamp);
                const timestamp = date.toISOString().replace(/[:.]/g, '-').slice(0, 19);
                filename = `${filename}_${timestamp}`;
            }

            // Make filename safe
            if (replaceInvalidChars) {
                filename = this.sanitizeFilename(filename, true);
            } else {
                filename = this.sanitizeFilename(filename, false);
            }

            // Add appropriate extension
            const extension = this.getExtension(artifact);

            // Ensure filename is not too long
            const maxBaseLength = maxLength - extension.length;
            if (filename.length > maxBaseLength) {
                filename = filename.slice(0, maxBaseLength);
            }

            return `${filename}${extension}`;
        } catch (error) {
            this.logger.error('FilenameHelper: Error generating filename', error);
            return `artifact-${Date.now()}.txt`;
        }
    }

    /**
     * Get file extension for an artifact
     */
    private static getExtension(artifact: Artifact): string {
        if (artifact.type === 'code' && artifact.language) {
            return this.languageExtensionMap[artifact.language.toLowerCase()] || '.txt';
        }

        return this.extensionMap[artifact.type] || '.txt';
    }

    /**
     * Sanitize a filename to be safe for file systems
     */
    private static sanitizeFilename(name: string, replaceChars: boolean = true): string {
        // Remove or replace unsafe characters
        if (replaceChars) {
            // Replace unsafe characters with underscores
            return name
                .replace(/[<>:"/\\|?*]/g, '_') // Replace Windows unsafe chars
                .replace(/\s+/g, '_')          // Replace spaces with underscores
                .replace(/\.\./g, '_')         // Replace .. to prevent directory traversal
                .replace(/^[.-]+/, '')         // Remove leading dots and dashes
                .replace(/[.-]+$/, '');        // Remove trailing dots and dashes
        } else {
            // Remove unsafe characters
            return name
                .replace(/[<>:"/\\|?*]/g, '')  // Remove Windows unsafe chars
                .replace(/\s+/g, '_')          // Replace spaces with underscores
                .replace(/\.\./g, '_')         // Replace .. to prevent directory traversal
                .replace(/^[.-]+/, '')         // Remove leading dots and dashes
                .replace(/[.-]+$/, '');        // Remove trailing dots and dashes
        }
    }

    /**
     * Generate folder path for an artifact in structured storage
     */
    public static getFolderPath(artifact: Artifact, conversationTitle?: string): string {
        try {
            // Get date from artifact timestamp or current time
            const date = artifact.timestamp ? new Date(artifact.timestamp) : new Date();

            // Format year and month
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, '0');

            // Base path using date
            let path = `${year}/${month}`;

            // Add conversation title if available
            if (conversationTitle) {
                const safeFolderName = this.sanitizeFilename(conversationTitle);
                path = `${path}/${safeFolderName}`;
            }

            return path;
        } catch (error) {
            this.logger.error('FilenameHelper: Error generating folder path', error);
            return 'artifacts';
        }
    }
}
