import os
import datetime
import argparse
import sys

# Define text file extensions to include
TEXT_EXTENSIONS = [
    '.txt', '.md', '.js', '.ts', '.jsx', '.tsx', '.json',
    '.html', '.css', '.scss', '.vue', '.svg', '.yml', '.yaml',
    '.gitignore', '.eslintrc', '.env.example', '.babelrc'
]

# Directories to skip
IGNORE_DIRS = [
    'node_modules', 'dist', 'build', '.git', '.idea', '.vscode'
]

# Output file path
OUTPUT_FILE = 'combined_text_files.txt'

def is_text_file(file_path):
    """Check if a file is likely a text file based on extension"""
    _, ext = os.path.splitext(file_path.lower())
    return ext in TEXT_EXTENSIONS

def find_text_files(dir_path):
    """Recursively find all text files in directory"""
    file_list = []

    for root, dirs, files in os.walk(dir_path):
        # Skip ignored directories
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]

        for file in files:
            file_path = os.path.join(root, file)
            if is_text_file(file_path):
                file_list.append(file_path)

    return file_list

def combine_text_files(root_dir):
    """Combine all text files into a single output file"""
    try:
        text_files = find_text_files(root_dir)

        print(f"Found {len(text_files)} text files to combine")

        combined_content = "# Combined Text Files\n"
        combined_content += f"# Generated: {datetime.datetime.now().isoformat()}\n\n"

        for file_path in text_files:
            try:
                relative_path = os.path.relpath(file_path, root_dir)
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as file:
                    content = file.read()

                combined_content += f"\n{'=' * 80}\n"
                combined_content += f"FILE: {relative_path}\n"
                combined_content += f"{'=' * 80}\n\n"
                combined_content += f"{content}\n"

                print(f"Added: {relative_path}")
            except Exception as e:
                print(f"Error reading file {file_path}: {e}")

        output_path = os.path.join(root_dir, OUTPUT_FILE)
        with open(output_path, 'w', encoding='utf-8') as output:
            output.write(combined_content)

        print(f"\nSuccessfully combined files into {output_path}")
    except Exception as e:
        print(f"Error combining files: {e}")

def get_directory():
    """Get directory from command line args or prompt user"""
    parser = argparse.ArgumentParser(description='Combine text files recursively.')
    parser.add_argument('directory', nargs='?', help='Directory to process')
    args = parser.parse_args()

    directory = args.directory
    if not directory:
        directory = input("Enter the directory path (press Enter for current directory): ")
        if not directory:
            directory = os.getcwd()

    # Verify directory exists
    if not os.path.isdir(directory):
        print(f"Error: '{directory}' is not a valid directory.")
        sys.exit(1)

    return os.path.abspath(directory)

if __name__ == "__main__":
    directory = get_directory()
    print(f"Processing directory: {directory}")
    combine_text_files(directory)
