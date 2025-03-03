import { handleDownloadArtifacts } from "./artifactService.js";

chrome.runtime.onMessage.addListener((request, sender) => {
    switch (request.action) {
        case "downloadArtifacts":
            handleDownloadArtifacts(request, sender);
            break;
        default:
            console.warn(`Unhandled action: ${request.action}`);
    }
});
