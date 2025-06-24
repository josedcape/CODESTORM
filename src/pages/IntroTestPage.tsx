import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, RotateCcw, Home, Menu as MenuIcon, Settings } from 'lucide-react';
import IntroAnimation from '../components/IntroAnimation';
import useIntroAnimation from '../hooks/useIntroAnimation';
import { 
  clearAllIntroAnimationFlags, 
  initializeFreshIntroExperience,
  logIntroAnimationStatus 
} from '../utils/introAnimationUtils';

const IntroTestPage: React.FC = () => {
  const navigate = useNavigate();
  const [testKey, setTestKey] = useState('test');
  const { showIntro, completeIntro, resetIntro } = useIntroAnimation(testKey);

  const handleTestIntro = () => {
    logIntroAnimationStatus('TEST', 'Manual trigger requested');
    resetIntro();
  };

  const handleClearAll = () => {
    clearAllIntroAnimationFlags();
    logIntroAnimationStatus('TEST', 'All flags cleared');
  };

  const handleInitializeFresh = () => {
    initializeFreshIntroExperience();
    logIntroAnimationStatus('TEST', 'Fresh experience initialized');
  };

  const handleChangeTestKey = () => {
    const newKey = `test-${Date.now()}`;
    setTestKey(newKey);
    logIntroAnimationStatus('TEST', `Changed test key to: ${newKey}`);
  };

  if (showIntro) {
    return <IntroAnimation onComplete={completeIntro} />;
  }

  return (
    <div className="min-h-screen bg-codestorm-darker text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          🎬 Intro Animation Test Page
        </h1>

        <div className="bg-codestorm-dark rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Animation Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-codestorm-blue/20 rounded-lg p-4">
              <h3 className="font-semibold text-blue-300 mb-2">Current State</h3>
              <p className="text-sm">Test Key: <span className="font-mono text-yellow-300">{testKey}</span></p>
              <p className="text-sm">Show Intro: <span className={showIntro ? 'text-green-400' : 'text-red-400'}>{showIntro ? 'YES' : 'NO'}</span></p>
            </div>
            <div className="bg-codestorm-accent/20 rounded-lg p-4">
              <h3 className="font-semibold text-purple-300 mb-2">Expected Behavior</h3>
              <p className="text-sm">✅ Animation should ALWAYS show</p>
              <p className="text-sm">✅ No localStorage persistence</p>
              <p className="text-sm">✅ Fresh experience guaranteed</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <button
            onClick={handleTestIntro}
            className="flex items-center justify-center p-4 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <Play className="w-5 h-5 mr-2" />
            Test Intro Animation
          </button>

          <button
            onClick={handleClearAll}
            className="flex items-center justify-center p-4 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Clear All Flags
          </button>

          <button
            onClick={handleInitializeFresh}
            className="flex items-center justify-center p-4 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
          >
            <Settings className="w-5 h-5 mr-2" />
            Initialize Fresh
          </button>

          <button
            onClick={handleChangeTestKey}
            className="flex items-center justify-center p-4 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Change Test Key
          </button>

          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center p-4 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Home className="w-5 h-5 mr-2" />
            Go to Home
          </button>

          <button
            onClick={() => navigate('/menu')}
            className="flex items-center justify-center p-4 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <MenuIcon className="w-5 h-5 mr-2" />
            Go to Menu
          </button>
        </div>

        <div className="bg-codestorm-dark rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Testing Instructions</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-start">
              <span className="text-blue-400 mr-2">1.</span>
              <span>Click "Test Intro Animation" to manually trigger the animation</span>
            </div>
            <div className="flex items-start">
              <span className="text-blue-400 mr-2">2.</span>
              <span>Navigate to Home or Menu pages to see intro animations</span>
            </div>
            <div className="flex items-start">
              <span className="text-blue-400 mr-2">3.</span>
              <span>Refresh the page - animation should still show</span>
            </div>
            <div className="flex items-start">
              <span className="text-blue-400 mr-2">4.</span>
              <span>Open in new tab/window - animation should show</span>
            </div>
            <div className="flex items-start">
              <span className="text-blue-400 mr-2">5.</span>
              <span>Check browser console for detailed logging</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntroTestPage;
