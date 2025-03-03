const downloadService = {
    async downloadZip(blob, filename) {
        const url = URL.createObjectURL(blob);
        chrome.downloads.download({ url, filename, saveAs: true }, () => {
            URL.revokeObjectURL(url);
        });
    },
};

export default downloadService;
