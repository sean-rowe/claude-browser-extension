# Claude Artifacts Helper

A Chrome extension that enhances Claude AI with artifact downloading, editing, and code execution capabilities.

## Features

- **Download Artifacts**: Save all artifacts (code, SVGs, markdown, etc.) from a Claude conversation with a single click
- **Edit Artifacts**: Use the Monaco editor to edit artifacts directly in the Claude interface
- **Run Code**: Execute code artifacts directly in the browser (JavaScript, TypeScript, HTML)
- **Continue Conversations via API**: When rate limited, continue your conversation via the Claude API

## Installation

### From Source

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/claude-artifacts-helper.git
   cd claude-artifacts-helper
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   npm run build
   ```

4. Load the extension in Chrome:
    - Open Chrome and navigate to `chrome://extensions`
    - Enable "Developer mode" by clicking the toggle in the top-right corner
    - Click "Load unpacked" and select the `dist` directory from this project

### Development

For development with hot-reloading:

```bash
npm run dev
```

## Usage

1. Navigate to [Claude.ai](https://claude.ai/)
2. The extension will automatically add a download button to the Claude header
3. Click the button to download all artifacts, or use the individual artifact controls

### Artifact Controls

Each artifact in Claude's responses will have the following controls:

- **Edit**: Opens the Monaco editor to edit the artifact
- **Copy**: Copies the artifact content to your clipboard
- **Download**: Downloads the individual artifact
- **Run**: (Code artifacts only) Executes the code in the browser

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
