#!/usr/bin/env python3
"""
Cleanup Script for Claude Artifacts Chrome Extension

This script:
1. Removes unnecessary duplicate files
2. Converts remaining JavaScript files to TypeScript
3. Ignores node_modules directory

Usage: python cleanup.py [project-directory]
"""

import os
import shutil
import sys
from pathlib import Path


def main():
    # Get project root from command line argument or use current directory
    project_root = sys.argv[1] if len(sys.argv) > 1 else '.'
    project_root = Path(project_root).resolve()

    print(f"Cleaning up project at: {project_root}")

    # Convert relative paths to absolute paths
    def to_absolute_path(relative_path):
        return project_root / relative_path

    files_to_remove = [
        # Duplicate JavaScript files
        'background/background.js',
        'background/apiFetchService.js',
        'background/messageRouter.js',
        'background/downloadService.js',
        'background/artifactService.js',
        'content/eventHandlers.js',
        'content/messaging.js',
        'content/banner.js',
        'content/content.js',
        'content/uiInjector.js',
        'shared/artifactExtractor.js',
        'shared/filenameHelper.js',
        'shared/zipCreator.js',

        # Empty or stub files
        'options/index.ts',
        'popup/index.ts',

        # Redundant combined files
        'src/combined_text_files.txt',

        # Legacy type definitions
        'background/storageService.ts',

        # Uncomment these if you don't need these features
        # 'content/editor/compilerService.ts',
        # 'content/events/rateLimitHandler.ts',
    ]

    # 1. Remove unnecessary files
    print(f"Removing unnecessary files from {project_root}...")
    for file in files_to_remove:
        absolute_path = to_absolute_path(file)
        try:
            if absolute_path.exists():
                absolute_path.unlink()
                print(f"✓ Removed: {file}")
            else:
                print(f"○ Skipped (not found): {file}")
        except Exception as e:
            print(f"✗ Failed to remove {file}: {str(e)}")

    # 2. Find all .js files and rename them to .ts
    print("\nRenaming .js files to .ts...")

    # Get list of relative paths to exclude
    excluded_paths = [to_absolute_path(path) for path in files_to_remove]

    # Find all .js files and rename to .ts
    for root, dirs, files in os.walk(project_root):
        # Skip node_modules directory
        if 'node_modules' in dirs:
            dirs.remove('node_modules')

        for file in files:
            if file.endswith('.js'):
                js_file = Path(root) / file

                # Skip files that are in the remove list
                if js_file in excluded_paths:
                    continue

                ts_file = js_file.with_suffix('.ts')

                try:
                    # Rename .js to .ts
                    js_file.rename(ts_file)
                    relative_path = js_file.relative_to(project_root)
                    relative_ts_path = ts_file.relative_to(project_root)
                    print(f"✓ Renamed: {relative_path} → {relative_ts_path}")
                except Exception as e:
                    print(f"✗ Failed to rename {js_file.relative_to(project_root)}: {str(e)}")

    print("\nFile cleanup completed!")
    print("\nNext steps:")
    print("1. Update import statements in your .ts files")
    print("2. Fix any TypeScript errors")
    print("3. Update your manifest.json to point to the correct files")
    print("4. Run 'tsc' to compile the TypeScript files")


if __name__ == "__main__":
    main()
