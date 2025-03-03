import storageService from "./storageService.js";
import downloadService from "./downloadService.js";
import { extractArtifacts } from "../shared/artifactExtractor.js";
import { getUniqueFileName } from "../shared/filenameHelper.js";
import { createZip } from "../shared/zipCreator.js";

export async function handleDownloadArtifacts(request, sender) {
    const payload = await storageService.getChatPayload(request.uuid);
    if (!payload) {
        notifyTab(sender.tab.id, false, "No payload found, try refreshing.");
        return;
    }

    const artifacts = [];
    const usedNames = new Set();

    payload.chat_messages.forEach((message, index) => {
        if (message.sender !== "assistant" || !message.text) return;

        const extracted = extractArtifacts(message.text);
        extracted.forEach((artifact) => {
            artifacts.push({
                filename: getUniqueFileName(
                    artifact.title,
                    artifact.language,
                    index,
                    usedNames,
                    request.useDirectoryStructure
                ),
                content: artifact.content,
            });
        });
    });

    if (!artifacts.length) {
        notifyTab(sender.tab.id, false, "No artifacts in this conversation.");
        return;
    }

    const zipBlob = await createZip(artifacts);
    await downloadService.downloadZip(zipBlob, `${payload.name}.zip`);
    notifyTab(sender.tab.id, true, `${artifacts.length} artifacts downloaded.`);
}

function notifyTab(tabId, success, message) {
    chrome.tabs.sendMessage(tabId, {
        action: "artifactsProcessed",
        success,
        message,
    });
}
