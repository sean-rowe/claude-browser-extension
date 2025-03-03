import { ArtifactFile } from '../models/artifact';
import { LoggerService } from '../services/loggerService';

/**
 * Helper for creating ZIP archives of artifacts
 */
export class ZipCreator {
    private static readonly logger = LoggerService.getInstance();

    /**
     * Create a ZIP file from a list of artifact files
     */
    public static async createZip(files: ArtifactFile[]): Promise<Blob> {
        try {
            // Ensure JSZip is loaded
            const JSZip = await this.loadJSZip();

            // Create a new ZIP archive
            const zip = new JSZip();

            // Add files to the ZIP
            for (const file of files) {
                const path = file.path ? `${file.path}/${file.filename}` : file.filename;

                // Add content to ZIP (Blob or string)
                if (file.content instanceof Blob) {
                    zip.file(path, file.content);
                } else {
                    zip.file(path, file.content);
                }
            }

            // Generate ZIP file
            const zipBlob = await zip.generateAsync({
                type: 'blob',
                compression: 'DEFLATE',
                compressionOptions: {
                    level: 9
                }
            });

            return zipBlob;
        } catch (error) {
            this.logger.error('ZipCreator: Error creating ZIP file', error);
            throw error;
        }
    }

    /**
     * Load JSZip library from CDN if not already loaded
     */
    private static async loadJSZip(): Promise<typeof JSZip> {
        // Check if JSZip is already loaded
        if ((window as any).JSZip) {
            return (window as any).JSZip;
        }

        // Load JSZip from CDN
        this.logger.debug('ZipCreator: Loading JSZip from CDN');

        return new Promise<typeof JSZip>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
            script.onload = () => {
                this.logger.debug('ZipCreator: JSZip loaded successfully');
                resolve((window as any).JSZip);
            };
            script.onerror = () => {
                const error = new Error('Failed to load JSZip library');
                this.logger.error('ZipCreator: JSZip load error', error);
                reject(error);
            };
            document.head.appendChild(script);
        });
    }
}
