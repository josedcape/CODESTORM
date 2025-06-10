import React from 'react';
import UniversalWebPreviewButton from './UniversalWebPreviewButton';
import { FileItem } from '../../types';

const WebPreviewTest: React.FC = () => {
  // Archivos de prueba simulados
  const testFiles: FileItem[] = [
    {
      id: 'test-html',
      name: 'index.html',
      path: 'index.html',
      content: `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Prueba Vista Previa Web</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
            padding: 20px;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
        }
        .container {
            text-align: center;
            background: rgba(255, 255, 255, 0.1);
            padding: 40px;
            border-radius: 20px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        h1 {
            font-size: 2.5em;
            margin-bottom: 20px;
        }
        button {
            background: #ff6b6b;
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 25px;
            font-size: 1.1em;
            cursor: pointer;
            transition: transform 0.2s;
        }
        button:hover {
            transform: scale(1.05);
        }
        .demo-box {
            width: 100px;
            height: 100px;
            background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
            margin: 20px auto;
            border-radius: 50%;
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🌐 Vista Previa Web Funcionando!</h1>
        <div class="demo-box"></div>
        <p>Esta es una página de prueba para el modal de vista previa web universal de CODESTORM.</p>
        <button onclick="testJS()">Probar JavaScript</button>
        <p id="result"></p>
    </div>

    <script>
        function testJS() {
            document.getElementById('result').innerHTML = '✅ JavaScript funcionando correctamente!';
            console.log('JavaScript ejecutado en vista previa');
        }
        
        console.log('🚀 Página cargada en vista previa web');
    </script>
</body>
</html>`,
      type: 'file',
      size: 2048,
      lastModified: Date.now()
    },
    {
      id: 'test-css',
      name: 'styles.css',
      path: 'styles.css',
      content: `/* Estilos adicionales */
.extra-style {
    color: #ff6b6b;
    font-weight: bold;
}`,
      type: 'file',
      size: 100,
      lastModified: Date.now()
    },
    {
      id: 'test-js',
      name: 'script.js',
      path: 'script.js',
      content: `// JavaScript adicional
console.log('Script adicional cargado');

function extraFunction() {
    alert('Función extra ejecutada!');
}`,
      type: 'file',
      size: 150,
      lastModified: Date.now()
    }
  ];

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className="bg-codestorm-dark p-4 rounded-lg border border-codestorm-blue/30 mb-4">
        <h3 className="text-white text-sm font-medium mb-2">🧪 Prueba Vista Previa Web</h3>
        <p className="text-gray-400 text-xs mb-3">
          Componente de prueba con archivos web simulados
        </p>
        <div className="text-xs text-gray-500">
          Archivos: {testFiles.length} | HTML: ✅ | CSS: ✅ | JS: ✅
        </div>
      </div>
      
      <UniversalWebPreviewButton
        files={testFiles}
        projectName="Proyecto de Prueba"
        className="relative"
      />
    </div>
  );
};

export default WebPreviewTest;
