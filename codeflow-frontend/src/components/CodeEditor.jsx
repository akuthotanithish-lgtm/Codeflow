import { useEffect } from 'react';
import Editor, { useMonaco } from '@monaco-editor/react';
import Spinner from './Spinner';

const CodeEditor = ({ language, code, setCode, theme = 'vs-dark', options = {} }) => {
    const monaco = useMonaco();

    const handleEditorChange = (value) => {
        if (setCode) {
            setCode(value);
        }
    };

    // --- DEFINE CUSTOM THEMES ---
    useEffect(() => {
        if (monaco) {
            // GitHub Light Theme Definition
            monaco.editor.defineTheme('github-light', {
                base: 'vs',
                inherit: true,
                rules: [],
                colors: {
                    'editor.background': '#ffffff',
                    'editor.foreground': '#24292e',
                    'editor.lineHighlightBackground': '#f6f8fa',
                    'editorCursor.foreground': '#24292e',
                    'editorIndentGuide.background': '#d1d5da',
                    'editor.selectionBackground': '#0366d625',
                }
            });

            // GitHub Dark Theme Definition
            monaco.editor.defineTheme('github-dark', {
                base: 'vs-dark',
                inherit: true,
                rules: [],
                colors: {
                    'editor.background': '#0d1117',
                    'editor.foreground': '#c9d1d9',
                    'editor.lineHighlightBackground': '#161b22',
                    'editorCursor.foreground': '#c9d1d9',
                    'editorIndentGuide.background': '#30363d',
                    'editor.selectionBackground': '#163356',
                }
            });
        }
    }, [monaco]);

    const finalOptions = {
        fontSize: 14,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        ...options,
    };

    return (
        <div className="h-full w-full border border-gray-200 rounded-md overflow-hidden bg-white shadow-sm">
            <Editor
                height="100%"
                language={language}
                value={code}
                // --- APPLY THEME HERE ---
                theme={theme} 
                onChange={handleEditorChange}
                loading={<Spinner />}
                options={finalOptions}
            />
        </div>
    );
};

export default CodeEditor;