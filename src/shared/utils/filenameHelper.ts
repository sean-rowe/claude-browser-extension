import {Artifact, ArtifactType} from '../models/artifact';
import {LoggerService} from '../services/loggerService';

/**
 * Utility class for generating filenames for artifacts
 */
export class FilenameHelper {
    private static readonly logger = LoggerService.getInstance();
    private static readonly MAX_FILENAME_LENGTH = 255;
    private static readonly INVALID_CHARS_REGEX = /[<>:"/\\|?*\x00-\x1F]/g;
    private static readonly EXTENSION_MAP: Record<ArtifactType, string> = {
        [ArtifactType.CODE]: 'txt', // Will be overridden based on language
        [ArtifactType.SVG]: 'svg',
        [ArtifactType.MARKDOWN]: 'md',
        [ArtifactType.MERMAID]: 'mmd',
        [ArtifactType.HTML]: 'html',
        [ArtifactType.REACT]: 'jsx',
        [ArtifactType.UNKNOWN]: 'txt'
    };

    private static readonly LANGUAGE_EXTENSION_MAP: Record<string, string> = {
        'javascript': 'js',
        'typescript': 'ts',
        'js': 'js',
        'ts': 'ts',
        'jsx': 'jsx',
        'tsx': 'tsx',
        'html': 'html',
        'css': 'css',
        'python': 'py',
        'java': 'java',
        'c': 'c',
        'cpp': 'cpp',
        'csharp': 'cs',
        'go': 'go',
        'rust': 'rs',
        'ruby': 'rb',
        'php': 'php',
        'swift': 'swift',
        'kotlin': 'kt',
        'json': 'json',
        'xml': 'xml',
        'yaml': 'yaml',
        'markdown': 'md',
        'sql': 'sql',
        'shell': 'sh',
        'bash': 'sh',
        'powershell': 'ps1',
        'dockerfile': 'dockerfile',
        'plaintext': 'txt'
    };

    /**
     * Generate a filename for an artifact
     */
    public static getFilename(
        artifact: Artifact,
        includeTimestamp: boolean = true,
        sanitize: boolean = true,
        maxLength: number = 255
    ): string {
        try {
            // Start with the title
            let filename = artifact.title || 'Untitled';

            // Add timestamp if requested
            if (includeTimestamp) {
                const timestamp = artifact.timestamp instanceof Date
                    ? artifact.timestamp
                    : new Date(artifact.timestamp);

                const formattedDate = timestamp
                    .toISOString()
                    .replace(/[:.]/g, '-')
                    .slice(0, 19);

                filename = `${filename}_${formattedDate}`;
            }

            // Sanitize if requested
            if (sanitize) {
                filename = this.sanitizeFilename(filename);
            }

            // Get appropriate extension
            const extension = this.getExtension(artifact);

            // Ensure filename is not too long (accounting for extension)
            const maxBaseLength = Math.min(maxLength, this.MAX_FILENAME_LENGTH) - extension.length - 1;
            if (filename.length > maxBaseLength) {
                filename = filename.substring(0, maxBaseLength);
            }

            // Combine filename and extension
            return `${filename}.${extension}`;
        } catch (error) {
            this.logger.error('FilenameHelper: Error generating filename', error);

            // Fallback to a generic name
            return `artifact_${Date.now()}.txt`;
        }
    }

    /**
     * Generate a folder path for an artifact
     */
    public static getFolderPath(artifact: Artifact, basePath: string = ''): string {
        try {
            // Generate folder structure based on type and timestamp
            const timestamp = artifact.timestamp instanceof Date
                ? artifact.timestamp
                : new Date(artifact.timestamp);

            const datePart = timestamp.toISOString().split('T')[0]; // YYYY-MM-DD

            // Create path segments
            const segments = [
                basePath,
                this.getTypeFolder(artifact.type),
                datePart
            ].filter(Boolean); // Remove empty segments

            return segments.join('/');
        } catch (error) {
            this.logger.error('FilenameHelper: Error generating folder path', error);

            // Fallback to a simple folder
            return basePath ? basePath : 'artifacts';
        }
    }

    /**
     * Sanitize a filename to remove invalid characters
     */
    private static sanitizeFilename(filename: string): string {
        // Replace invalid characters with underscores
        let sanitized = filename.replace(this.INVALID_CHARS_REGEX, '_');

        // Replace multiple spaces/underscores with a single underscore
        sanitized = sanitized.replace(/[\\s_]+/g, '_');

        // Trim leading/trailing spaces and underscores
        sanitized = sanitized.trim().replace(/^_+|_+$/g, '');

        // Ensure we have something
        if (!sanitized) {
            sanitized = 'artifact';
        }

        return sanitized;
    }

    /**
     * Get the appropriate file extension for an artifact
     */
    private static getExtension(artifact: Artifact): string {
        // For code artifacts, use language-specific extension if available
        if (artifact.type === ArtifactType.CODE && artifact.language) {
            const language = artifact.language.toLowerCase();
            if (this.LANGUAGE_EXTENSION_MAP[language]) {
                return this.LANGUAGE_EXTENSION_MAP[language];
            }
        }

        // Fall back to default extension for the artifact type
        return this.EXTENSION_MAP[artifact.type] || 'txt';
    }

    /**
     * Get a folder name based on artifact type
     */
    private static getTypeFolder(type: ArtifactType): string {
        switch (type) {
            case ArtifactType.CODE:
                return 'code';
            case ArtifactType.SVG:
                return 'images';
            case ArtifactType.MARKDOWN:
                return 'documents';
            case ArtifactType.MERMAID:
                return 'diagrams';
            case ArtifactType.HTML:
                return 'web';
            case ArtifactType.REACT:
                return 'components';
            default:
                return 'other';
        }
    }
}
