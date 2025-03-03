export function createBanner(message, type = "error", timeout = 8000) {
    const banner = document.createElement("article");
    banner.className = type;
    banner.innerHTML = `<p>${message}</p>`;
    document.body.prepend(banner);
    setTimeout(() => {
        banner.classList.add("hide");
        setTimeout(() => banner.remove(), 500);
    }, timeout);
}
