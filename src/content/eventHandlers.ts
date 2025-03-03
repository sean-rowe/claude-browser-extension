import { sendMessageToBackground } from "./messaging.js";

export function downloadArtifacts() {
    const uuid = window.location.pathname.split("/").pop();
    const structure = document.querySelector(".claude-download-options").value;
    sendMessageToBackground({
        action: "downloadArtifacts",
        uuid,
        useDirectoryStructure: structure === "structured",
    });
}
