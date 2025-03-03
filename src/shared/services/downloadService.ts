import {ArtifactFile} from '../../shared/models/artifact';
import {LoggerService} from '../../shared/services/loggerService';
import {ZipCreator} from '../../shared/utils/zipCreator';

/**
 * Service for downloading artifacts
 */
export class DownloadService {
    private static instance: DownloadService;
    private readonly logger = LoggerService.getInstance();

    private constructor() {
        // Private constructor for singleton
    }

    /**
     * Get the singleton instance of the download service
     */
    public static getInstance(): DownloadService {
        if (!DownloadService.instance) {
            DownloadService.instance = new DownloadService();
        }
        return DownloadService.instance;
    }

    /**
     * Initialize the download service
     */
    public init(): void {
        this.logger.debug('DownloadService: Initialized');
    }

    /**
     * Download artifacts as a ZIP file
     */
    public async downloadArtifactsAsZip(files: ArtifactFile[]): Promise<string> {
        try {
            if (files.length === 0) {
                throw new Error('No artifacts to download');
            }

            // Create ZIP file
            const zipBlob = await ZipCreator.createZip(files);

            // Create a download URL
            const url = URL.createObjectURL(zipBlob);

            // Generate filename
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            const filename = `claude-artifacts-${timestamp}.zip`;

            // Trigger download
            await this.downloadFile(url, filename);

            // Clean up the URL after a minute
            setTimeout(() => URL.revokeObjectURL(url), 60000);

            return filename;
        } catch (error) {
            this.logger.error('DownloadService: Error downloading artifacts as ZIP', error);
            throw error;
        }
    }

    /**
     * Download a single artifact file
     */
    public async downloadSingleArtifact(file: ArtifactFile): Promise<string> {
        try {
            // Create a Blob from the content
            const blob = typeof file.content === 'string'
                ? new Blob([file.content], { type: 'text/plain' })
                : file.content;

            // Create a download URL
            const url = URL.createObjectURL(blob);

            // Trigger download
            await this.downloadFile(url, file.filename);

            // Clean up the URL after a minute
            setTimeout(() => URL.revokeObjectURL(url), 60000);

            return file.filename;
        } catch (error) {
            this.logger.error('DownloadService: Error downloading single artifact', error);
            throw error;
        }
    }

    /**
     * Helper to trigger a file download
     */
    private async downloadFile(url: string, filename: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            chrome.downloads.download({
                url,
                filename,
                saveAs: false
            }, (downloadId) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve();
                }
            });
        });
    }
}
