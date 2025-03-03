/**
 * Types of artifacts that can be extracted from Claude responses
 */
export enum ArtifactType {
    CODE = 'code',
    MARKDOWN = 'markdown',
    HTML = 'html',
    SVG = 'svg',
    MERMAID = 'mermaid',
    REACT = 'react',
    UNKNOWN = 'unknown'
}

/**
 * Interface for an extracted artifact from Claude
 */
export interface Artifact {
    /**
     * Unique identifier for the artifact
     */
    id: string;

    /**
     * Display title of the artifact
     */
    title: string;

    /**
     * Content of the artifact
     */
    content: string;

    /**
     * Type of the artifact
     */
    type: ArtifactType;

    /**
     * Programming language for code artifacts
     */
    language?: string;

    /**
     * Timestamp when the artifact was extracted
     */
    timestamp: string;

    /**
     * Conversation ID this artifact belongs to
     */
    conversationId?: string;

    /**
     * Message ID this artifact belongs to
     */
    messageId?: string;

    /**
     * Whether this artifact is part of a series that needs stitching
     */
    partOfSeries?: boolean;

    /**
     * Position in the series if part of one
     */
    seriesPosition?: number;

    /**
     * Total number of parts in the series
     */
    seriesTotal?: number;
}

/**
 * Interface for artifact file information for downloading
 */
export interface ArtifactFile {
    /**
     * Filename to use for the artifact
     */
    filename: string;

    /**
     * Content of the file
     */
    content: string | Blob;

    /**
     * Path within the archive (for structured organization)
     */
    path?: string;

    /**
     * Original artifact reference
     */
    artifact: Artifact;
}

/**
 * Information about a conversation that contains artifacts
 */
export interface ConversationInfo {
    /**
     * Unique ID of the conversation
     */
    id: string;

    /**
     * Title of the conversation
     */
    title: string;

    /**
     * Timestamp of the conversation
     */
    timestamp: string;

    /**
     * Number of artifacts in the conversation
     */
    artifactCount: number;
}
