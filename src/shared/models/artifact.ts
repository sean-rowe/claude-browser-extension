/**
 * Artifact types that can be generated by Claude
 */
export enum ArtifactType {
    CODE = 'code',
    SVG = 'svg',
    MARKDOWN = 'markdown',
    MERMAID = 'mermaid',
    HTML = 'html',
    REACT = 'react',
    UNKNOWN = 'unknown'
}

/**
 * Represents an artifact that Claude has created
 */
export interface Artifact {
    id: string;
    title: string;
    type: ArtifactType;
    content: string;
    language?: string;
    timestamp: Date;
    messageId?: string;
    conversationId?: string;
}

/**
 * Represents a file created from an artifact for download
 */
export interface ArtifactFile {
    filename: string;
    content: string | Blob;
    path?: string;
    artifact: Artifact;
}

/**
 * Base class for all artifacts following Team Pattern
 */
export class ArtifactState {
    readonly id: string;
    readonly title: string;
    readonly type: ArtifactType;
    readonly content: string;
    readonly language?: string;
    readonly timestamp: Date;
    readonly messageId?: string;
    readonly conversationId?: string;
    readonly previousState?: ArtifactState;

    constructor(data: Artifact, previousState?: ArtifactState) {
        this.id = data.id;
        this.title = data.title;
        this.type = data.type;
        this.content = data.content;
        this.language = data.language;
        this.timestamp = data.timestamp instanceof Date
            ? data.timestamp
            : new Date(data.timestamp);
        this.messageId = data.messageId;
        this.conversationId = data.conversationId;
        this.previousState = previousState;
    }

    /**
     * Create a new ArtifactState with updated properties
     */
    with(updates: Partial<Artifact>): ArtifactState {
        return new ArtifactState({
            ...this,
            ...updates
        }, this);
    }

    /**
     * Convert state to a plain object (useful for storage)
     */
    toObject(): Artifact {
        return {
            id: this.id,
            title: this.title,
            type: this.type,
            content: this.content,
            language: this.language,
            timestamp: this.timestamp,
            messageId: this.messageId,
            conversationId: this.conversationId
        };
    }
}
