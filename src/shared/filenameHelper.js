// Generates unique filenames based on directory structure preference
export function getUniqueFileName(
    title,
    language,
    messageIndex,
    usedNames,
    useDirectoryStructure,
) {
    let baseName = title.replace(/[^\w\-._]+/g, "_");
    let extension = getFileExtension(language);
    let fileName = useDirectoryStructure
        ? inferDirectoryStructure(baseName, extension)
        : `${messageIndex + 1}_${baseName}${extension}`;

    let suffix = "";
    let suffixCount = 1;
    while (usedNames.has(fileName + suffix)) {
        suffix = `_${"*".repeat(suffixCount++)}`;
    }

    fileName += suffix;
    usedNames.add(fileName);
    return fileName;
}

function inferDirectoryStructure(baseName, extension, messageIndex = null) {
    const parts = baseName.split("/");
    const fileName = parts.pop() + extension;
    const directory = parts.join("/");
    return messageIndex !== null
        ? `${directory}/${messageIndex + 1}_${fileName}`
        : `${directory}/${fileName}`;
}

function getFileExtension(language) {
    const map = {
        js: ".js", python: ".py", java: ".java", txt: ".txt",
        // add other languages as needed
    };
    return map[language.toLowerCase()] || ".txt";
}
