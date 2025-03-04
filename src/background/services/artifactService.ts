import {Artifact, ArtifactFile} from '@/shared/models/artifact.ts';
import {LoggerService} from '@/shared/services/loggerService.ts';
import {StorageService} from '@/shared/services/storageService.ts';
import {FilenameHelper} from '@/shared/utils/filenameHelper.ts';

/**
 * Service for managing artifacts
 */
export class ArtifactService {
    private static instance: ArtifactService;
    private readonly logger = LoggerService.getInstance();
    private readonly storageService = StorageService.getInstance();

    private constructor() {
        // Private constructor for singleton
    }

    /**
     * Get the singleton instance of the artifact service
     */
    public static getInstance(): ArtifactService {
        if (!ArtifactService.instance) {
            ArtifactService.instance = new ArtifactService();
        }
        return ArtifactService.instance;
    }

    /**
     * Initialize the artifact service
     */
    public init(): void {
        this.logger.debug('ArtifactService: Initialized');
    }

    /**
     * Process artifacts for download
     */
    public async processArtifacts(
        artifacts: Artifact[],
        stitchArtifacts: boolean,
        flatStructure: boolean
    ): Promise<ArtifactFile[]> {
        try {
            // Get settings
            const settings = await this.storageService.getSettings();

            // Stitch artifacts if requested
            let processedArtifacts = artifacts;
            if (stitchArtifacts) {
                // Implementation in artifactExtractor.ts
                // processedArtifacts = ArtifactExtractor.stitchArtifacts(artifacts);
            }

            // Convert artifacts to files
            const files: ArtifactFile[] = [];

            for (const artifact of processedArtifacts) {
                // Generate filename
                const filename = FilenameHelper.getFilename(
                    artifact,
                    settings.includeTimestampInFilename,
                    settings.replaceInvalidChars,
                    settings.maxFilenameLength
                );

                // Generate path for structured storage
                let path = '';
                if (!flatStructure) {
                    path = FilenameHelper.getFolderPath(artifact, 'Claude Conversation');
                }

                // Create file entry
                files.push({
                    filename,
                    content: artifact.content,
                    path,
                    artifact
                });
            }

            return files;
        } catch (error) {
            this.logger.error('ArtifactService: Error processing artifacts', error);
            throw error;
        }
    }

    /**
     * Store an artifact for potential stitching later
     */
    public async storeArtifact(artifact: Artifact): Promise<void> {
        try {
            // Generate a storage key based on title and type
            const key = `artifact-${artifact.title}-${artifact.type}`;

            // Store in local storage
            await this.storageService.saveArtifact(key, artifact);
        } catch (error) {
            this.logger.error('ArtifactService: Error storing artifact', error);
            throw error;
        }
    }

    /**
     * Retrieve stored artifacts
     */
    public async getStoredArtifacts(): Promise<Record<string, Artifact>> {
        try {
            // Implementation would depend on how artifacts are stored
            return {};
        } catch (error) {
            this.logger.error('ArtifactService: Error retrieving stored artifacts', error);
            throw error;
        }
    }
}
