import React, { useState } from 'react';
import { useColorTransition } from '../../hooks/useColorTransition';

function ColorTransitionTester() {
  const { transitionToColor, resetToDefault } = useColorTransition();
  const [duration, setDuration] = useState(2000);
  const [easing, setEasing] = useState('cubic-bezier(0.25, 0.46, 0.45, 0.94)');

  const colors = [
    { name: 'Crimson', value: '#DC143C' },
    { name: 'Forest', value: '#228B22' },
    { name: 'Royal Blue', value: '#4169E1' },
    { name: 'Purple', value: '#8A2BE2' },
    { name: 'Orange', value: '#FF6347' },
    { name: 'Teal', value: '#008080' }
  ];

  const easingOptions = [
    { name: 'Smooth', value: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)' },
    { name: 'Ease In', value: 'ease-in' },
    { name: 'Ease Out', value: 'ease-out' },
    { name: 'Bounce', value: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)' },
    { name: 'Elastic', value: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)' },
    { name: 'Linear', value: 'linear' }
  ];

  const handleColorClick = (color) => {
    transitionToColor(color, duration, easing);
  };

  const handleResetClick = () => {
    resetToDefault();
  };

  const handleBackdropClick = (e) => {
    // Only close if clicking the backdrop itself, not the modal content
    if (e.target === e.currentTarget) {
      // Close the modal by pressing button 3 again or handle closing
      const event = new KeyboardEvent('keydown', { key: '3' });
      document.dispatchEvent(event);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-white text-xl font-semibold text-center mb-6">Color Transition Tester</h3>
        
        {/* Duration Control */}
        <div className="mb-6">
          <label className="block text-gray-300 text-sm font-medium mb-2">
            Duration: {duration}ms
          </label>
          <input
            type="range"
            min="200"
            max="5000"
            step="100"
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>0.2s</span>
            <span>5s</span>
          </div>
        </div>

        {/* Easing Control */}
        <div className="mb-6">
          <label className="block text-gray-300 text-sm font-medium mb-2">
            Animation Type
          </label>
          <button
            onClick={() => {
              const currentIndex = easingOptions.findIndex(o => o.value === easing);
              const nextIndex = (currentIndex + 1) % easingOptions.length;
              setEasing(easingOptions[nextIndex].value);
            }}
            className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {easingOptions.find(o => o.value === easing)?.name}
          </button>
        </div>

        {/* Color Buttons */}
        <div className="mb-6">
          <label className="block text-gray-300 text-sm font-medium mb-3">
            Colors
          </label>
          <div className="grid grid-cols-3 gap-3">
            {colors.map((color) => (
              <button
                key={color.value}
                onClick={() => handleColorClick(color.value)}
                className="px-3 py-2 rounded-lg text-white text-sm font-medium transition-all duration-200 hover:scale-105 hover:shadow-lg"
                style={{ 
                  backgroundColor: color.value,
                  boxShadow: `0 4px 12px ${color.value}40`
                }}
              >
                {color.name}
              </button>
            ))}
          </div>
        </div>

        {/* Reset Button */}
        <button
          onClick={handleResetClick}
          className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
        >
          Reset to Default
        </button>
      </div>
    </div>
  );
}

export default ColorTransitionTester;
