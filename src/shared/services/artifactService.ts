import {ArtifactFile, ArtifactState} from '../../shared/models/artifact';
import {LoggerService} from '../../shared/services/loggerService';
import {StorageService} from '../../shared/services/storageService';
import {FilenameHelper} from '../../shared/utils/filenameHelper';

/**
 * Service for processing and managing artifacts
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
        artifacts: ArtifactState[],
        stitchArtifacts: boolean = false,
        flatStructure: boolean = false
    ): Promise<ArtifactFile[]> {
        try {
            // Get settings
            const settings = await this.storageService.getSettings();

            // Stitch artifacts if requested
            // This would combine multiple related artifacts into one (e.g., code blocks across messages)
            let processedArtifacts = artifacts;
            if (stitchArtifacts) {
                // Implementation in shared/utils/artifactExtractor.ts
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
                    path = FilenameHelper.getFolderPath(artifact, 'Claude Artifacts');
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
     * Store an artifact for later use
     */
    public async storeArtifact(artifact: ArtifactState): Promise<void> {
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
     * Retrieve all stored artifacts
     */
    public async getStoredArtifacts(): Promise<Record<string, ArtifactState>> {
        try {
            const allData = await this.storageService.getAll();
            const artifacts: Record<string, ArtifactState> = {};

            // Filter out only artifact entries
            Object.entries(allData).forEach(([key, value]) => {
                if (key.startsWith('artifact-') && value) {
                    artifacts[key] = new ArtifactState(value);
                }
            });

            return artifacts;
        } catch (error) {
            this.logger.error('ArtifactService: Error retrieving stored artifacts', error);
            throw error;
        }
    }
}
