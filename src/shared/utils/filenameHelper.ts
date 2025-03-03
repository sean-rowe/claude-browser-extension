import {Artifact, ArtifactState, ArtifactType} from '../models/artifact';
import {LoggerService} from '../services/loggerService';

/**
 * Utility class for extracting artifacts from Claude responses
 */
export class ArtifactExtractor {
    private static readonly logger = LoggerService.getInstance();

    /**
     * Extract artifacts from the DOM
     */
    public static extractArtifactsFromDOM(containerSelector: string = '.conversation-container'): ArtifactState[] {
        try {
            const container = document.querySelector(containerSelector);
            if (!container) {
                this.logger.warn(`ArtifactExtractor: Container not found with selector ${containerSelector}`);
                return [];
            }

            // Find all artifact containers
            const artifactContainers = container.querySelectorAll('.antml-artifact-container');
            if (!artifactContainers.length) {
                this.logger.debug('ArtifactExtractor: No artifacts found');
                return [];
            }

            const artifacts: ArtifactState[] = [];

            // Process each artifact
            artifactContainers.forEach((artifactContainer, index) => {
                try {
                    const artifact = this.extractArtifactFromContainer(artifactContainer as HTMLElement, index);
                    if (artifact) {
                        artifacts.push(artifact);
                    }
                } catch (error) {
                    this.logger.error('ArtifactExtractor: Error extracting artifact', error);
                }
            });

            this.logger.info(`ArtifactExtractor: Extracted ${artifacts.length} artifacts`);
            return artifacts;
        } catch (error) {
            this.logger.error('ArtifactExtractor: Error extracting artifacts from DOM', error);
            return [];
        }
    }

    /**
     * Extract an artifact from a container element
     */
    private static extractArtifactFromContainer(container: HTMLElement, index: number): ArtifactState | null {
        try {
            // Extract title
            const titleElement = container.querySelector('.antml-artifact-title');
            const title = titleElement?.textContent?.trim() || `Artifact ${index + 1}`;

            // Determine artifact type and content
            const { type, content, language } = this.determineTypeAndContent(container);

            // Create artifact
            const artifact: Artifact = {
                id: `artifact-${Date.now()}-${index}`,
                title,
                type,
                content,
                language,
                timestamp: new Date(),
                // Can extract more metadata like message ID or conversation ID if needed
            };

            return new ArtifactState(artifact);
        } catch (error) {
            this.logger.error('ArtifactExtractor: Error extracting artifact from container', error);
            return null;
        }
    }

    /**
     * Determine the type and content of an artifact
     */
    private static determineTypeAndContent(container: HTMLElement): { type: ArtifactType; content: string; language?: string } {
        // Check if it's a code artifact
        const codeElement = container.querySelector('pre code');
        if (codeElement) {
            // Determine language from class
            const classes = Array.from(codeElement.classList);
            const langClass = classes.find(cls => cls.startsWith('language-'));
            const language = langClass ? langClass.replace('language-', '') : undefined;

            return {
                type: ArtifactType.CODE,
                content: codeElement.textContent || '',
                language
            };
        }

        // Check if it's an SVG
        const svgElement = container.querySelector('svg');
        if (svgElement) {
            return {
                type: ArtifactType.SVG,
                content: svgElement.outerHTML
            };
        }

        // Check if it's an HTML element
        const htmlElement = container.querySelector('[data-type="html"]');
        if (htmlElement) {
            return {
                type: ArtifactType.HTML,
                content: htmlElement.innerHTML
            };
        }

        // Check if it's a React component
        const reactElement = container.querySelector('[data-type="react"]');
        if (reactElement) {
            return {
                type: ArtifactType.REACT,
                content: reactElement.textContent || ''
            };
        }

        // Check if it's a Mermaid diagram
        const mermaidElement = container.querySelector('.mermaid');
        if (mermaidElement) {
            return {
                type: ArtifactType.MERMAID,
                content: mermaidElement.textContent || ''
            };
        }

        // Default to Markdown for other content
        return {
            type: ArtifactType.MARKDOWN,
            content: container.innerHTML
        };
    }

    /**
     * Stitch artifacts with the same type and title
     * This is used to combine multiple code blocks that belong together
     */
    public static stitchArtifacts(artifacts: ArtifactState[]): ArtifactState[] {
        if (artifacts.length <= 1) {
            return artifacts;
        }

        // Group artifacts by title
        const groupedByTitle: Record<string, ArtifactState[]> = {};

        artifacts.forEach(artifact => {
            const key = `${artifact.title}-${artifact.type}`;
            if (!groupedByTitle[key]) {
                groupedByTitle[key] = [];
            }
            groupedByTitle[key].push(artifact);
        });

        // Combine artifacts in each group
        const stitchedArtifacts: ArtifactState[] = [];

        Object.values(groupedByTitle).forEach(group => {
            if (group.length === 1) {
                // If only one artifact in the group, keep it as is
                stitchedArtifacts.push(group[0]);
            } else {
                // Sort by timestamp (oldest first)
                group.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

                // Combine content (specific to artifact type)
                const combined = this.combineArtifacts(group);
                stitchedArtifacts.push(combined);
            }
        });

        return stitchedArtifacts;
    }

    /**
     * Combine artifacts of the same type
     */
    private static combineArtifacts(artifacts: ArtifactState[]): ArtifactState {
        const firstArtifact = artifacts[0];

        // If not code artifacts, just use the last one
        if (firstArtifact.type !== ArtifactType.CODE) {
            return artifacts[artifacts.length - 1];
        }

        // For code artifacts, concatenate the content
        const combinedContent = artifacts
            .map(a => a.content)
            .join('\n\n');

        // Create a new artifact with the combined content
        return firstArtifact.with({
            content: combinedContent,
            timestamp: new Date()
        });
    }
}
