import { Artifact, ArtifactType } from '../models/artifact';
import { LoggerService } from '../services/loggerService';

/**
 * Utility for extracting artifacts from Claude responses
 */
export class ArtifactExtractor {
    private static readonly logger = LoggerService.getInstance();

    /**
     * Extract artifacts from HTML DOM
     */
    public static extractArtifactsFromDOM(containerSelector: string = '.conversation-container'): Artifact[] {
        try {
            const container = document.querySelector(containerSelector);
            if (!container) {
                this.logger.warn('ArtifactExtractor: Container not found');
                return [];
            }

            const artifacts: Artifact[] = [];

            // Find all artifact containers
            const artifactContainers = container.querySelectorAll('.antml-artifact-container');

            artifactContainers.forEach((container: Element, index: number) => {
                try {
                    const artifact = this.extractArtifactFromContainer(container as HTMLElement);
                    if (artifact) {
                        artifacts.push(artifact);
                    }
                } catch (error) {
                    this.logger.error(`ArtifactExtractor: Error extracting artifact at index ${index}`, error);
                }
            });

            return artifacts;
        } catch (error) {
            this.logger.error('ArtifactExtractor: Error extracting artifacts from DOM', error);
            return [];
        }
    }

    /**
     * Extract an artifact from a container element
     */
    private static extractArtifactFromContainer(container: HTMLElement): Artifact | null {
        if (!container) return null;

        try {
            // Extract title
            const titleElement = container.querySelector('.antml-artifact-title');
            const title = titleElement?.textContent?.trim() || 'Untitled Artifact';

            // Generate ID
            const id = `artifact-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

            // Determine type and extract content
            let type = ArtifactType.UNKNOWN;
            let content = '';
            let language: string | undefined;

            // Check for code artifact
            const codeElement = container.querySelector('pre code');
            if (codeElement) {
                type = ArtifactType.CODE;
                content = codeElement.textContent || '';

                // Try to get language from class
                const classNames = Array.from(codeElement.classList);
                const langClass = classNames.find(cls => cls.startsWith('language-'));
                if (langClass) {
                    language = langClass.replace('language-', '');
                }
            }
            // Check for SVG
            else if (container.querySelector('svg')) {
                type = ArtifactType.SVG;
                const svgElement = container.querySelector('svg');
                content = svgElement?.outerHTML || '';
            }
            // Check for Mermaid
            else if (container.classList.contains('mermaid-artifact')) {
                type = ArtifactType.MERMAID;
                content = container.textContent || '';
            }
            // Check for React
            else if (container.classList.contains('react-artifact')) {
                type = ArtifactType.REACT;
                content = container.textContent || '';
            }
            // Check for HTML
            else if (container.classList.contains('html-artifact')) {
                type = ArtifactType.HTML;
                content = container.querySelector('div')?.innerHTML || '';
            }
            // Default to Markdown for text
            else {
                type = ArtifactType.MARKDOWN;
                content = container.textContent || '';
            }

            return {
                id,
                title,
                content,
                type,
                language,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            this.logger.error('ArtifactExtractor: Error extracting artifact from container', error);
            return null;
        }
    }

    /**
     * Stitch together artifacts with the same title and type
     */
    public static stitchArtifacts(artifacts: Artifact[]): Artifact[] {
        if (!artifacts || artifacts.length <= 1) return artifacts;

        try {
            const stitchedArtifacts: Artifact[] = [];
            const artifactGroups = new Map<string, Artifact[]>();

            // Group artifacts by title and type
            artifacts.forEach(artifact => {
                const key = `${artifact.title}-${artifact.type}${artifact.language ? `-${artifact.language}` : ''}`;

                if (!artifactGroups.has(key)) {
                    artifactGroups.set(key, []);
                }

                artifactGroups.get(key)?.push(artifact);
            });

            // Process each group
            artifactGroups.forEach((group, key) => {
                if (group.length === 1) {
                    // Single artifact, no stitching needed
                    stitchedArtifacts.push(group[0]);
                } else {
                    // Multiple artifacts with same title, stitch them
                    this.logger.info(`ArtifactExtractor: Stitching ${group.length} artifacts for key: ${key}`);

                    // Sort by timestamp if available
                    group.sort((a, b) => {
                        if (a.timestamp && b.timestamp) {
                            return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
                        }
                        return 0;
                    });

                    // Combine content
                    const stitched: Artifact = {
                        ...group[0],
                        content: group.map(a => a.content).join('\n'),
                        partOfSeries: true,
                        seriesPosition: 1,
                        seriesTotal: group.length
                    };

                    stitchedArtifacts.push(stitched);
                }
            });

            return stitchedArtifacts;
        } catch (error) {
            this.logger.error('ArtifactExtractor: Error stitching artifacts', error);
            return artifacts;
        }
    }
}
