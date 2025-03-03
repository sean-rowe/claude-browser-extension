// Creates a JSZip instance and returns blob asynchronously
export async function createZip(artifacts) {
    const zip = new JSZip();
    artifacts.forEach(({ filename, content }) => {
        zip.file(filename, content);
    });
    return zip.generateAsync({ type: "blob" });
}
