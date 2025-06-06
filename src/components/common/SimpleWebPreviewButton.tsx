import React, { useState } from 'react';
import { Globe } from 'lucide-react';
import WebPreviewModal from './WebPreviewModal';
import { FileItem } from '../../types';

const SimpleWebPreviewButton: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Archivos de prueba
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
    }
  ];

  const handleOpenModal = () => {
    console.log('🚀 Abriendo modal simple');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    console.log('❌ Cerrando modal simple');
    setIsModalOpen(false);
  };

  return (
    <>
      {/* Botón flotante simple y visible */}
      <button
        onClick={handleOpenModal}
        className="fixed bottom-4 right-4 w-20 h-20 bg-red-500 hover:bg-red-600 rounded-full shadow-2xl flex items-center justify-center text-white font-bold text-lg transition-all duration-200 transform hover:scale-110 z-[9999] border-4 border-white"
        title="Prueba Vista Previa Web"
      >
        <div className="text-center">
          <Globe className="h-8 w-8 mx-auto mb-1" />
          <div className="text-xs">TEST</div>
        </div>
      </button>

      {/* Modal de vista previa */}
      <WebPreviewModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        files={testFiles}
        projectName="Prueba Simple"
      />
    </>
  );
};

export default SimpleWebPreviewButton;
