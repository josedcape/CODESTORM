/**
 * Utilidad para probar la funcionalidad de carga de repositorios
 */

import GitHubRepositoryService from '../services/GitHubRepositoryService';

export const testGitHubRepository = async (url: string, branch?: string) => {
  console.log('🧪 Iniciando prueba de carga de repositorio:', url);
  
  try {
    const githubService = new GitHubRepositoryService();
    
    // Parsear URL
    const repoInfo = githubService.parseGitHubUrl(url);
    if (!repoInfo) {
      throw new Error('URL de GitHub inválida');
    }
    
    console.log('📋 Información del repositorio:', repoInfo);
    
    // Obtener información básica
    const repoData = await githubService.getRepositoryInfo(repoInfo.owner, repoInfo.repo);
    console.log('📊 Datos del repositorio:', {
      name: repoData.name,
      description: repoData.description,
      size: repoData.size,
      defaultBranch: repoData.default_branch
    });
    
    // Obtener estructura
    console.log('🔄 Cargando estructura del repositorio...');
    const structure = await githubService.getRepositoryStructure(
      repoInfo.owner,
      repoInfo.repo,
      branch || repoData.default_branch,
      (progress) => {
        console.log(`📁 Progreso: ${progress.current}/${progress.total} - ${progress.file || 'Procesando...'}`);
      }
    );
    
    console.log('✅ Estructura cargada exitosamente:', {
      name: structure.name,
      type: structure.type,
      childrenCount: structure.children?.length || 0
    });
    
    return {
      success: true,
      repoInfo,
      repoData,
      structure
    };
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
};

// Función para probar con repositorios de ejemplo
export const testExampleRepositories = async () => {
  const testRepos = [
    'https://github.com/facebook/react',
    'https://github.com/microsoft/vscode',
    'https://github.com/vercel/next.js'
  ];
  
  console.log('🧪 Iniciando pruebas con repositorios de ejemplo...');
  
  for (const repo of testRepos) {
    console.log(`\n--- Probando: ${repo} ---`);
    const result = await testGitHubRepository(repo);
    
    if (result.success) {
      console.log('✅ Prueba exitosa');
    } else {
      console.log('❌ Prueba fallida:', result.error);
    }
    
    // Pausa entre pruebas para evitar rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n🏁 Pruebas completadas');
};

// Función para contar archivos en una estructura
export const countFilesInStructure = (structure: any): number => {
  let count = 0;
  
  const countRecursive = (node: any) => {
    if (node.type === 'file') {
      count++;
    }
    if (node.children) {
      node.children.forEach(countRecursive);
    }
  };
  
  countRecursive(structure);
  return count;
};

// Función para obtener estadísticas de la estructura
export const getStructureStats = (structure: any) => {
  let fileCount = 0;
  let dirCount = 0;
  let totalSize = 0;
  const languages = new Set<string>();
  
  const analyzeRecursive = (node: any) => {
    if (node.type === 'file') {
      fileCount++;
      if (node.size) totalSize += node.size;
      if (node.language) languages.add(node.language);
    } else if (node.type === 'directory') {
      dirCount++;
    }
    
    if (node.children) {
      node.children.forEach(analyzeRecursive);
    }
  };
  
  analyzeRecursive(structure);
  
  return {
    files: fileCount,
    directories: dirCount,
    totalSize,
    languages: Array.from(languages),
    languageCount: languages.size
  };
};
