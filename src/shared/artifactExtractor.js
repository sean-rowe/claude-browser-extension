// Extract artifacts from Claude's responses
export function extractArtifacts(text) {
    const artifactRegex = /<antArtifact[^>]*>([\s\S]*?)<\/antArtifact>/g;
    const artifacts = [];
    let match;

    while ((match = artifactRegex.exec(text)) !== null) {
        const fullTag = match[0];
        const content = match[1];

        const titleMatch = fullTag.match(/title="([^"]*)/);
        const languageMatch = fullTag.match(/language="([^"]*)/);

        artifacts.push({
            title: titleMatch ? titleMatch[1] : "Untitled",
            language: languageMatch ? languageMatch[1] : "txt",
            content: content.trim(),
        });
    }

    return artifacts;
}
