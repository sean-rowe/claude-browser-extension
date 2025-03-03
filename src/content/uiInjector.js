import { downloadArtifacts } from "./eventHandlers.js";

function injectUI() {
    const buttonContainer = document.querySelector(".flex.min-w-0.items-center.max-md\\:text-sm");
    if (!buttonContainer || buttonContainer.querySelector(".claude-download-button")) return;

    const container = document.createElement("div");
    container.className = "claude-download-container ml-1 flex items-center";
    container.innerHTML = `
    <select class="claude-download-options rounded-md bg-gray-100 py-1 px-2 text-sm">
      <option value="flat">Flat structure</option>
      <option value="structured">Inferred structure</option>
    </select>
    <button class="claude-download-button ml-1 rounded-md bg-gray-100 py-1 px-3 text-sm">
      <i class="fa fa-download mr-2"></i>Download artifacts
    </button>
  `;
    buttonContainer.appendChild(container);

    container.querySelector(".claude-download-button").onclick = downloadArtifacts;
}

setInterval(injectUI, 1500);
