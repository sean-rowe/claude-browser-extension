import {ArtifactFile} from '../models/artifact';
import {LoggerService} from '../services/loggerService';
import JSZip from 'jszip';

/**
 * Utility class for creating ZIP files from artifacts
 */
export class ZipCreator {
    private static readonly logger = LoggerService.getInstance();

    /**
     * Create a ZIP file from a list of artifact files
     */
    public static async createZip(files: ArtifactFile[]): Promise<Blob> {
        try {
            const zip = new JSZip();

            // Add each file to the ZIP
            for (const file of files) {
                // Determine the file path
                const filePath = file.path
                    ? `${file.path}/${file.filename}`
                    : file.filename;

                // Add file to ZIP
                zip.file(filePath, file.content);
            }

            // Generate the ZIP file
            const blob = await zip.generateAsync({
                type: 'blob',
                compression: 'DEFLATE',
                compressionOptions: { level: 6 }
            });

            this.logger.info(`ZipCreator: Created ZIP with ${files.length} files`);
            return blob;
        } catch (error) {
            this.logger.error('ZipCreator: Error creating ZIP', error);
            throw error;
        }
    }

    /**
     * Create a ZIP file with a single artifact
     */
    public static async createSingleFileZip(file: ArtifactFile): Promise<Blob> {
        return this.createZip([file]);
    }
}
