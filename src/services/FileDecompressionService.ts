import JSZip from 'jszip';

export interface FileNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  lastModified?: number;
  content?: string | ArrayBuffer;
  children?: FileNode[];
  extension?: string;
  isExpanded?: boolean;
}

export interface DecompressionProgress {
  stage: 'reading' | 'extracting' | 'processing' | 'complete';
  progress: number;
  message: string;
  currentFile?: string;
}

export interface DecompressionResult {
  success: boolean;
  fileTree: FileNode[];
  totalFiles: number;
  totalSize: number;
  error?: string;
}

export class FileDecompressionService {
  private static readonly SUPPORTED_ARCHIVE_EXTENSIONS = ['.zip', '.jar', '.war'];
  private static readonly SUPPORTED_INDIVIDUAL_EXTENSIONS = [
    '.js', '.jsx', '.ts', '.tsx', '.html', '.htm', '.css', '.scss', '.sass',
    '.json', '.xml', '.yaml', '.yml', '.md', '.txt', '.py', '.java', '.c',
    '.cpp', '.h', '.hpp', '.cs', '.php', '.rb', '.go', '.rs', '.swift',
    '.kt', '.scala', '.sql', '.sh', '.bat', '.ps1', '.dockerfile', '.gitignore',
    '.env', '.config', '.ini', '.properties', '.log', '.vue', '.svelte'
  ];
  private static readonly MAX_ARCHIVE_SIZE = 200 * 1024 * 1024; // 200MB for archives
  private static readonly MAX_INDIVIDUAL_FILE_SIZE = 10 * 1024 * 1024; // 10MB per individual file
  private static readonly MAX_LINES_PER_FILE = 2000; // Maximum lines per code file
  private static readonly LARGE_FILE_THRESHOLD = 1000; // Lines threshold for large file handling
  private static readonly TEXT_EXTENSIONS = [
    '.js', '.jsx', '.ts', '.tsx', '.html', '.htm', '.css', '.scss', '.sass',
    '.json', '.xml', '.yaml', '.yml', '.md', '.txt', '.py', '.java', '.c',
    '.cpp', '.h', '.hpp', '.cs', '.php', '.rb', '.go', '.rs', '.swift',
    '.kt', '.scala', '.sql', '.sh', '.bat', '.ps1', '.dockerfile', '.gitignore',
    '.env', '.config', '.ini', '.properties', '.log', '.vue', '.svelte'
  ];

  static isArchiveSupported(file: File): boolean {
    const extension = this.getFileExtension(file.name).toLowerCase();
    return this.SUPPORTED_ARCHIVE_EXTENSIONS.includes(extension);
  }

  static isIndividualFileSupported(file: File): boolean {
    const extension = this.getFileExtension(file.name).toLowerCase();
    return this.SUPPORTED_INDIVIDUAL_EXTENSIONS.includes(extension);
  }

  static isSupported(file: File): boolean {
    return this.isArchiveSupported(file) || this.isIndividualFileSupported(file);
  }

  static getFileType(file: File): 'archive' | 'individual' | 'unsupported' {
    if (this.isArchiveSupported(file)) return 'archive';
    if (this.isIndividualFileSupported(file)) return 'individual';
    return 'unsupported';
  }

  static validateFile(file: File): { valid: boolean; error?: string; fileType?: 'archive' | 'individual' } {
    if (!file) {
      return { valid: false, error: 'No file provided' };
    }

    const fileType = this.getFileType(file);

    if (fileType === 'unsupported') {
      return {
        valid: false,
        error: 'Unsupported file format. Please upload ZIP archives or supported code files.'
      };
    }

    // Validate file size based on type
    if (fileType === 'archive') {
      if (file.size > this.MAX_ARCHIVE_SIZE) {
        return {
          valid: false,
          error: `Archive size exceeds ${this.MAX_ARCHIVE_SIZE / 1024 / 1024}MB limit`
        };
      }
    } else if (fileType === 'individual') {
      if (file.size > this.MAX_INDIVIDUAL_FILE_SIZE) {
        return {
          valid: false,
          error: `Individual file size exceeds ${this.MAX_INDIVIDUAL_FILE_SIZE / 1024 / 1024}MB limit`
        };
      }
    }

    return { valid: true, fileType };
  }

  static validateFileContent(content: string, fileName: string): { valid: boolean; warning?: string; error?: string } {
    const lines = content.split('\n');
    const lineCount = lines.length;

    if (lineCount > this.MAX_LINES_PER_FILE) {
      return {
        valid: false,
        error: `File "${fileName}" has ${lineCount} lines, exceeding the ${this.MAX_LINES_PER_FILE} line limit`
      };
    }

    if (lineCount > this.LARGE_FILE_THRESHOLD) {
      return {
        valid: true,
        warning: `File "${fileName}" has ${lineCount} lines and will use optimized rendering`
      };
    }

    return { valid: true };
  }

  static isLargeFile(content: string): boolean {
    return content.split('\n').length > this.LARGE_FILE_THRESHOLD;
  }

  static async processFile(
    file: File,
    onProgress?: (progress: DecompressionProgress) => void
  ): Promise<DecompressionResult> {
    try {
      console.log(`🔄 Starting processing of ${file.name} (${this.formatFileSize(file.size)})`);

      const validation = this.validateFile(file);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
          fileTree: [],
          totalFiles: 0,
          totalSize: 0
        };
      }

      // Route to appropriate processing method based on file type
      if (validation.fileType === 'archive') {
        return await this.decompressFile(file, onProgress);
      } else if (validation.fileType === 'individual') {
        return await this.processIndividualFile(file, onProgress);
      }

      return {
        success: false,
        error: 'Unknown file type',
        fileTree: [],
        totalFiles: 0,
        totalSize: 0
      };

    } catch (error) {
      console.error('❌ File processing failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        fileTree: [],
        totalFiles: 0,
        totalSize: 0
      };
    }
  }

  static async processIndividualFile(
    file: File,
    onProgress?: (progress: DecompressionProgress) => void
  ): Promise<DecompressionResult> {
    try {
      console.log(`📄 Processing individual file: ${file.name}`);

      onProgress?.({
        stage: 'reading',
        progress: 20,
        message: 'Reading file content...'
      });

      // Read file content
      const content = await this.readFileContent(file);

      onProgress?.({
        stage: 'processing',
        progress: 60,
        message: 'Validating file content...'
      });

      // Validate content if it's a text file
      if (this.isTextFile(file.name)) {
        const validation = this.validateFileContent(content as string, file.name);
        if (!validation.valid) {
          return {
            success: false,
            error: validation.error,
            fileTree: [],
            totalFiles: 0,
            totalSize: 0
          };
        }

        if (validation.warning) {
          console.warn(`⚠️ ${validation.warning}`);
        }
      }

      onProgress?.({
        stage: 'processing',
        progress: 80,
        message: 'Creating file structure...'
      });

      // Create file node
      const fileNode: FileNode = {
        id: this.generateId(file.name),
        name: file.name,
        path: `/${file.name}`,
        type: 'file',
        size: file.size,
        extension: this.getFileExtension(file.name),
        content: content,
        lastModified: file.lastModified,
        isExpanded: false
      };

      onProgress?.({
        stage: 'complete',
        progress: 100,
        message: `Successfully processed ${file.name}`
      });

      console.log(`✅ Successfully processed individual file: ${file.name}`);

      return {
        success: true,
        fileTree: [fileNode],
        totalFiles: 1,
        totalSize: file.size
      };

    } catch (error) {
      console.error(`❌ Failed to process individual file ${file.name}:`, error);
      return {
        success: false,
        error: `Failed to process file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        fileTree: [],
        totalFiles: 0,
        totalSize: 0
      };
    }
  }

  private static async readFileContent(file: File): Promise<string | ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        if (this.isTextFile(file.name)) {
          // Read as text for supported text files
          const textReader = new FileReader();
          textReader.onload = () => resolve(textReader.result as string);
          textReader.onerror = () => reject(new Error('Failed to read file as text'));
          textReader.readAsText(file, 'utf-8');
        } else {
          // Read as array buffer for binary files
          resolve(reader.result as ArrayBuffer);
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }

  static async decompressFile(
    file: File,
    onProgress?: (progress: DecompressionProgress) => void
  ): Promise<DecompressionResult> {
    try {
      // Validate file
      const validation = this.validateFile(file);
      if (!validation.valid) {
        return {
          success: false,
          fileTree: [],
          totalFiles: 0,
          totalSize: 0,
          error: validation.error
        };
      }

      onProgress?.({
        stage: 'reading',
        progress: 10,
        message: 'Reading archive file...'
      });

      // Read the file
      const arrayBuffer = await file.arrayBuffer();

      onProgress?.({
        stage: 'extracting',
        progress: 30,
        message: 'Extracting archive contents...'
      });

      // Load with JSZip
      const zip = new JSZip();
      const zipContent = await zip.loadAsync(arrayBuffer);

      onProgress?.({
        stage: 'processing',
        progress: 50,
        message: 'Processing extracted files...'
      });

      // Build file tree
      const fileTree: FileNode[] = [];
      const fileMap = new Map<string, FileNode>();
      let totalFiles = 0;
      let totalSize = 0;
      let processedFiles = 0;

      // Count total files for progress
      const totalEntries = Object.keys(zipContent.files).length;

      // Process each file/directory
      for (const [relativePath, zipEntry] of Object.entries(zipContent.files)) {
        processedFiles++;
        const progress = 50 + (processedFiles / totalEntries) * 40;

        onProgress?.({
          stage: 'processing',
          progress,
          message: 'Processing files...',
          currentFile: relativePath
        });

        const pathParts = relativePath.split('/').filter(part => part.length > 0);
        const fileName = pathParts[pathParts.length - 1] || '';
        const isDirectory = zipEntry.dir;

        if (!isDirectory) {
          totalFiles++;
          totalSize += zipEntry._data?.uncompressedSize || 0;
        }

        // Create file node
        const fileNode: FileNode = {
          id: this.generateId(relativePath),
          name: fileName || relativePath,
          path: relativePath,
          type: isDirectory ? 'directory' : 'file',
          size: isDirectory ? undefined : zipEntry._data?.uncompressedSize || 0,
          lastModified: zipEntry.date?.getTime(),
          extension: isDirectory ? undefined : this.getFileExtension(fileName),
          isExpanded: false,
          children: isDirectory ? [] : undefined
        };

        // Load content for text files with size validation
        if (!isDirectory && this.isTextFile(fileName)) {
          try {
            // Check individual file size before processing
            const fileSize = zipEntry._data?.uncompressedSize || 0;
            if (fileSize > this.MAX_INDIVIDUAL_FILE_SIZE) {
              console.warn(`File ${relativePath} exceeds individual file size limit (${fileSize} bytes)`);
              fileNode.content = `// File too large to display (${this.formatFileSize(fileSize)})\n// Maximum individual file size: ${this.formatFileSize(this.MAX_INDIVIDUAL_FILE_SIZE)}`;
            } else {
              const textContent = await zipEntry.async('text');

              // Validate content length
              const validation = this.validateFileContent(textContent, fileName);
              if (!validation.valid) {
                console.warn(`File ${relativePath}: ${validation.error}`);
                fileNode.content = `// File too large to display (${textContent.split('\n').length} lines)\n// Maximum lines per file: ${this.MAX_LINES_PER_FILE}\n// Use external editor for files this large`;
              } else {
                fileNode.content = textContent;
                if (validation.warning) {
                  console.info(`File ${relativePath}: ${validation.warning}`);
                }
              }
            }
          } catch (error) {
            console.warn(`Failed to read text content for ${relativePath}:`, error);
            fileNode.content = await zipEntry.async('arraybuffer');
          }
        } else if (!isDirectory) {
          fileNode.content = await zipEntry.async('arraybuffer');
        }

        fileMap.set(relativePath, fileNode);

        // Build tree structure
        if (pathParts.length === 1) {
          // Root level file/directory
          fileTree.push(fileNode);
        } else {
          // Nested file/directory - find parent
          const parentPath = pathParts.slice(0, -1).join('/') + '/';
          const parent = fileMap.get(parentPath);
          if (parent && parent.children) {
            parent.children.push(fileNode);
          }
        }
      }

      // Sort tree
      this.sortFileTree(fileTree);

      onProgress?.({
        stage: 'complete',
        progress: 100,
        message: `Successfully extracted ${totalFiles} files`
      });

      return {
        success: true,
        fileTree,
        totalFiles,
        totalSize,
      };

    } catch (error) {
      console.error('Decompression error:', error);
      return {
        success: false,
        fileTree: [],
        totalFiles: 0,
        totalSize: 0,
        error: error instanceof Error ? error.message : 'Unknown decompression error'
      };
    }
  }

  static findFileByPath(fileTree: FileNode[], path: string): FileNode | null {
    for (const node of fileTree) {
      if (node.path === path) {
        return node;
      }
      if (node.children) {
        const found = this.findFileByPath(node.children, path);
        if (found) return found;
      }
    }
    return null;
  }

  static getAllFiles(fileTree: FileNode[]): FileNode[] {
    const files: FileNode[] = [];

    function traverse(nodes: FileNode[]) {
      for (const node of nodes) {
        if (node.type === 'file') {
          files.push(node);
        }
        if (node.children) {
          traverse(node.children);
        }
      }
    }

    traverse(fileTree);
    return files;
  }

  static updateFileContent(fileTree: FileNode[], path: string, newContent: string): FileNode[] {
    return fileTree.map(node => {
      if (node.path === path && node.type === 'file') {
        return { ...node, content: newContent };
      }
      if (node.children) {
        return { ...node, children: this.updateFileContent(node.children, path, newContent) };
      }
      return node;
    });
  }

  static async createArchive(fileTree: FileNode[], fileName: string = 'modified_project.zip'): Promise<Blob> {
    const zip = new JSZip();

    function addToZip(nodes: FileNode[], currentPath: string = '') {
      for (const node of nodes) {
        const fullPath = currentPath + node.name;

        if (node.type === 'directory') {
          zip.folder(fullPath);
          if (node.children) {
            addToZip(node.children, fullPath + '/');
          }
        } else if (node.content) {
          zip.file(fullPath, node.content);
        }
      }
    }

    addToZip(fileTree);
    return await zip.generateAsync({ type: 'blob' });
  }

  private static getFileExtension(fileName: string): string {
    const lastDot = fileName.lastIndexOf('.');
    return lastDot === -1 ? '' : fileName.substring(lastDot);
  }

  private static isTextFile(fileName: string): boolean {
    const extension = this.getFileExtension(fileName).toLowerCase();
    return this.TEXT_EXTENSIONS.includes(extension);
  }

  private static generateId(path: string): string {
    return `file_${path.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
  }

  private static sortFileTree(nodes: FileNode[]): void {
    nodes.sort((a, b) => {
      // Directories first
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }
      // Then alphabetical
      return a.name.localeCompare(b.name);
    });

    // Recursively sort children
    nodes.forEach(node => {
      if (node.children) {
        this.sortFileTree(node.children);
      }
    });
  }

  static getFileIcon(node: FileNode): string {
    if (node.type === 'directory') {
      return node.isExpanded ? '📂' : '📁';
    }

    const extension = node.extension?.toLowerCase() || '';
    const iconMap: Record<string, string> = {
      '.js': '🟨',
      '.jsx': '⚛️',
      '.ts': '🔷',
      '.tsx': '⚛️',
      '.html': '🌐',
      '.htm': '🌐',
      '.css': '🎨',
      '.scss': '🎨',
      '.sass': '🎨',
      '.json': '📋',
      '.xml': '📄',
      '.md': '📝',
      '.txt': '📄',
      '.py': '🐍',
      '.java': '☕',
      '.c': '⚙️',
      '.cpp': '⚙️',
      '.cs': '🔷',
      '.php': '🐘',
      '.rb': '💎',
      '.go': '🐹',
      '.rs': '🦀',
      '.swift': '🦉',
      '.kt': '🎯',
      '.sql': '🗄️',
      '.sh': '🐚',
      '.bat': '⚡',
      '.dockerfile': '🐳',
      '.yml': '⚙️',
      '.yaml': '⚙️',
      '.env': '🔐',
      '.log': '📊'
    };

    return iconMap[extension] || '📄';
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}
