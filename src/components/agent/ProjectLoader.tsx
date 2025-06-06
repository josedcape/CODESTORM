import React, { useState, useRef } from 'react';
import { Upload, Github, GitBranch, FolderOpen, Download, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { ProjectRepository, ProjectStructure } from '../../pages/Agent';
import LoadingSpinner from '../LoadingSpinner';

interface ProjectLoaderProps {
  onProjectLoad: (project: ProjectRepository) => void;
  isLoading: boolean;
}

const ProjectLoader: React.FC<ProjectLoaderProps> = ({ onProjectLoad, isLoading }) => {
  const [loadMethod, setLoadMethod] = useState<'github' | 'gitlab' | 'zip' | 'local'>('github');
  const [repoUrl, setRepoUrl] = useState('');
  const [branch, setBranch] = useState('main');
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState<{
    progress: number;
    message: string;
    subMessage?: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGitHubLoad = async () => {
    if (!repoUrl.trim()) {
      setError('Por favor ingresa una URL de repositorio válida');
      return;
    }

    try {
      setError(null);
      setLoadingProgress({
        progress: 0,
        message: 'Iniciando carga del repositorio...',
        subMessage: 'Conectando con GitHub API'
      });

      // Cargar repositorio real de GitHub
      const structure = await loadGitHubStructure(repoUrl, branch || 'main');

      setLoadingProgress({
        progress: 95,
        message: 'Finalizando...',
        subMessage: 'Preparando estructura del proyecto'
      });

      const project: ProjectRepository = {
        id: `github-${Date.now()}`,
        name: extractRepoName(repoUrl),
        url: repoUrl,
        type: 'github',
        branch: branch || 'main',
        size: calculateStructureSize(structure),
        lastModified: Date.now(),
        structure: structure
      };

      setLoadingProgress({
        progress: 100,
        message: '¡Repositorio cargado exitosamente!',
        subMessage: `${calculateStructureSize(structure)} archivos procesados`
      });

      // Pequeña pausa para mostrar el éxito antes de continuar
      setTimeout(() => {
        setLoadingProgress(null);
        onProjectLoad(project);
      }, 1000);

    } catch (err) {
      setLoadingProgress(null);
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar el repositorio. Verifica la URL y permisos.';
      setError(errorMessage);
    }
  };

  // Función auxiliar para calcular el tamaño total de la estructura
  const calculateStructureSize = (structure: ProjectStructure): number => {
    let totalSize = 0;

    const calculateNode = (node: ProjectStructure) => {
      if (node.type === 'file' && node.size) {
        totalSize += node.size;
      }
      if (node.children) {
        node.children.forEach(calculateNode);
      }
    };

    calculateNode(structure);
    return totalSize;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setError(null);
      setLoadingProgress({
        progress: 0,
        message: 'Procesando archivo...',
        subMessage: `Leyendo ${file.name}`
      });

      if (file.type === 'application/zip' || file.name.endsWith('.zip')) {
        const structure = await processZipFile(file);

        setLoadingProgress({
          progress: 90,
          message: 'Finalizando...',
          subMessage: 'Preparando estructura del proyecto'
        });

        const mockProject: ProjectRepository = {
          id: `zip-${Date.now()}`,
          name: file.name.replace('.zip', ''),
          type: 'zip',
          size: file.size,
          lastModified: file.lastModified,
          structure: structure
        };

        setLoadingProgress({
          progress: 100,
          message: '¡Archivo procesado exitosamente!',
          subMessage: `Proyecto ${mockProject.name} listo`
        });

        // Pequeña pausa para mostrar el éxito
        setTimeout(() => {
          setLoadingProgress(null);
          onProjectLoad(mockProject);
        }, 1000);

      } else {
        setLoadingProgress(null);
        setError('Solo se admiten archivos ZIP por el momento');
      }
    } catch (err) {
      setLoadingProgress(null);
      setError('Error al procesar el archivo. Verifica que sea un ZIP válido.');
    }
  };

  const extractRepoName = (url: string): string => {
    const match = url.match(/github\.com\/[^\/]+\/([^\/]+)/);
    return match ? match[1].replace('.git', '') : 'Repositorio';
  };

  const loadGitHubStructure = async (url: string, branch: string): Promise<ProjectStructure> => {
    try {
      // Importar el servicio de GitHub
      const { default: GitHubRepositoryService } = await import('../../services/GitHubRepositoryService');
      const githubService = new GitHubRepositoryService();

      setLoadingProgress({
        progress: 5,
        message: 'Validando repositorio...',
        subMessage: 'Verificando URL y permisos'
      });

      // Parsear la URL para obtener owner y repo
      const repoInfo = githubService.parseGitHubUrl(url);
      if (!repoInfo) {
        throw new Error('URL de GitHub inválida. Formato esperado: https://github.com/owner/repo');
      }

      setLoadingProgress({
        progress: 10,
        message: 'Obteniendo estructura del repositorio...',
        subMessage: `Conectando a ${repoInfo.owner}/${repoInfo.repo}`
      });

      // Obtener la estructura real del repositorio
      const structure = await githubService.getRepositoryStructure(
        repoInfo.owner,
        repoInfo.repo,
        branch,
        (progress) => {
          const percentage = 10 + (progress.current / progress.total) * 80; // 10-90%
          setLoadingProgress({
            progress: percentage,
            message: 'Descargando archivos...',
            subMessage: `${progress.current}/${progress.total} archivos${progress.file ? ` - ${progress.file}` : ''}`
          });
        }
      );

      return structure;
    } catch (error) {
      console.error('Error cargando repositorio de GitHub:', error);
      throw error;
    }
  };

  const processZipFile = async (file: File): Promise<ProjectStructure> => {
    try {
      // Importar el servicio de importación de repositorios
      const { default: RepositoryImportService } = await import('../../services/RepositoryImportService');
      const importService = new RepositoryImportService();

      setLoadingProgress({
        progress: 10,
        message: 'Extrayendo archivos...',
        subMessage: 'Descomprimiendo contenido'
      });

      // Procesar el archivo ZIP real
      const importedRepo = await importService.importRepository(file, (progress) => {
        const percentage = 10 + (progress.progress / 100) * 70; // 10-80%
        setLoadingProgress({
          progress: percentage,
          message: `${progress.stage === 'reading' ? 'Leyendo' :
                     progress.stage === 'extracting' ? 'Extrayendo' :
                     progress.stage === 'processing' ? 'Procesando' : 'Completando'}...`,
          subMessage: progress.currentFile || `${progress.processedFiles || 0}/${progress.totalFiles || 0} archivos`
        });
      });

      setLoadingProgress({
        progress: 85,
        message: 'Convirtiendo estructura...',
        subMessage: 'Preparando formato del proyecto'
      });

      // Convertir la estructura del servicio al formato esperado por Agent
      return convertImportedStructureToProjectStructure(importedRepo);
    } catch (error) {
      console.error('Error procesando archivo ZIP:', error);
      throw new Error('Error al procesar el archivo ZIP. Verifica que sea un archivo válido.');
    }
  };

  // Función para convertir la estructura importada al formato ProjectStructure
  const convertImportedStructureToProjectStructure = (importedRepo: any): ProjectStructure => {
    const convertNode = (node: any, path: string = '/'): ProjectStructure => {
      if (node.type === 'file') {
        return {
          id: generateFileId(path),
          name: node.name,
          path: path,
          type: 'file',
          size: node.size,
          lastModified: node.lastModified?.getTime() || Date.now(),
          language: detectLanguageFromExtension(node.name),
          content: node.content || ''
        };
      } else {
        // Es un directorio
        const children: ProjectStructure[] = [];
        if (node.children) {
          for (const [childName, childNode] of Object.entries(node.children)) {
            const childPath = path === '/' ? `/${childName}` : `${path}/${childName}`;
            children.push(convertNode(childNode, childPath));
          }
        }

        return {
          id: generateFileId(path),
          name: node.name,
          path: path,
          type: 'directory',
          isExpanded: children.length <= 3, // Auto-expandir directorios pequeños
          children: children
        };
      }
    };

    // Crear la estructura raíz
    return {
      id: 'root',
      name: importedRepo.name,
      path: '/',
      type: 'directory',
      isExpanded: true,
      children: Object.entries(importedRepo.structure).map(([name, node]) =>
        convertNode(node, `/${name}`)
      )
    };
  };

  // Función auxiliar para generar IDs únicos
  const generateFileId = (path: string): string => {
    return `file-${path.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}`;
  };

  // Función auxiliar para detectar el lenguaje por extensión
  const detectLanguageFromExtension = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const languageMap: { [key: string]: string } = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'php': 'php',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'sass': 'sass',
      'json': 'json',
      'xml': 'xml',
      'yaml': 'yaml',
      'yml': 'yaml',
      'md': 'markdown',
      'txt': 'text',
      'sh': 'bash',
      'bat': 'batch'
    };
    return languageMap[extension || ''] || 'text';
  };

  return (
    <div className="bg-codestorm-dark rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
        <FolderOpen className="w-5 h-5 mr-2 text-codestorm-accent" />
        Cargar Proyecto
      </h3>

      {/* Selector de método de carga */}
      <div className="flex space-x-2 mb-4">
        <button
          onClick={() => setLoadMethod('github')}
          className={`px-3 py-2 text-sm rounded transition-colors ${
            loadMethod === 'github' 
              ? 'bg-codestorm-accent text-white' 
              : 'bg-codestorm-darker text-gray-400 hover:text-white'
          }`}
        >
          <Github className="w-4 h-4 inline mr-1" />
          GitHub
        </button>
        <button
          onClick={() => setLoadMethod('gitlab')}
          className={`px-3 py-2 text-sm rounded transition-colors ${
            loadMethod === 'gitlab' 
              ? 'bg-codestorm-accent text-white' 
              : 'bg-codestorm-darker text-gray-400 hover:text-white'
          }`}
        >
          <GitBranch className="w-4 h-4 inline mr-1" />
          GitLab
        </button>
        <button
          onClick={() => setLoadMethod('zip')}
          className={`px-3 py-2 text-sm rounded transition-colors ${
            loadMethod === 'zip' 
              ? 'bg-codestorm-accent text-white' 
              : 'bg-codestorm-darker text-gray-400 hover:text-white'
          }`}
        >
          <Upload className="w-4 h-4 inline mr-1" />
          ZIP/TAR.GZ
        </button>
      </div>

      {/* Formulario según el método seleccionado */}
      {(loadMethod === 'github' || loadMethod === 'gitlab') && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              URL del Repositorio
            </label>
            <input
              type="url"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/usuario/repositorio"
              className="w-full px-3 py-2 bg-codestorm-darker border border-codestorm-blue/30 rounded text-white placeholder-gray-400 focus:outline-none focus:border-codestorm-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Rama
            </label>
            <input
              type="text"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="main"
              className="w-full px-3 py-2 bg-codestorm-darker border border-codestorm-blue/30 rounded text-white placeholder-gray-400 focus:outline-none focus:border-codestorm-accent"
            />
          </div>
          <button
            onClick={handleGitHubLoad}
            disabled={isLoading || !repoUrl.trim()}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-codestorm-accent text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>{isLoading ? 'Cargando...' : 'Cargar Repositorio'}</span>
          </button>
        </div>
      )}

      {loadMethod === 'zip' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Archivo ZIP o TAR.GZ
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".zip,.tar.gz,.tar"
              onChange={handleFileUpload}
              className="w-full px-3 py-2 bg-codestorm-darker border border-codestorm-blue/30 rounded text-white file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:bg-codestorm-accent file:text-white hover:file:bg-blue-600"
            />
          </div>
          <div className="text-sm text-gray-400">
            Formatos soportados: ZIP, TAR.GZ, TAR
          </div>
        </div>
      )}

      {/* Mensajes de error */}
      {error && (
        <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span className="text-red-300 text-sm">{error}</span>
        </div>
      )}

      {/* Spinner de carga moderno */}
      {(isLoading || loadingProgress) && (
        <div className="mt-6">
          <LoadingSpinner
            message={loadingProgress?.message || 'Procesando proyecto...'}
            subMessage={loadingProgress?.subMessage}
            progress={loadingProgress?.progress}
            size="medium"
            variant="primary"
          />
        </div>
      )}
    </div>
  );
};

export default ProjectLoader;
