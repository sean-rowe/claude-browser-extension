/**
 * Monaco Editor type declarations
 * These are simplified declarations for the Monaco editor
 * For complete type information, see https://microsoft.github.io/monaco-editor/typedoc/
 */
declare namespace monaco {
    namespace editor {
        interface IStandaloneCodeEditor {
            getValue(): string;
            setValue(value: string): void;
            layout(): void;
            focus(): void;
            dispose(): void;
        }

        interface IStandaloneEditorConstructionOptions {
            value?: string;
            language?: string;
            theme?: string;
            automaticLayout?: boolean;
            minimap?: {
                enabled?: boolean;
            };
            lineNumbers?: 'on' | 'off' | 'relative';
            wordWrap?: 'on' | 'off';
            fontSize?: number;
            tabSize?: number;
            insertSpaces?: boolean;
            folding?: boolean;
            scrollBeyondLastLine?: boolean;
            roundedSelection?: boolean;
            renderWhitespace?: string;
            fontFamily?: string;
            renderLineHighlight?: string;
        }

        function create(element: HTMLElement, options?: IStandaloneEditorConstructionOptions): IStandaloneCodeEditor;
        function setTheme(theme: string): void;
    }

    namespace languages {
        function register(language: { id: string }): void;
        function setMonarchTokensProvider(languageId: string, provider: any): void;
    }
}
