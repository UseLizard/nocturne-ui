import React, { useState, useEffect, useRef } from 'react';

const TabbedView = ({ 
  tabs, 
  activeTab, 
  onTabChange, 
  isDarkMode = false,
  className = "",
  tabsClassName = "",
  contentClassName = ""
}) => {
  const tabsRef = useRef(null);
  const [underlineStyle, setUnderlineStyle] = useState({ left: 0, width: 0 });

  // Update underline position when active tab changes
  useEffect(() => {
    const updateUnderlinePosition = () => {
      if (tabsRef.current) {
        const activeIndex = tabs.findIndex(tab => tab.key === activeTab);
        const activeButton = tabsRef.current.children[activeIndex];
        
        if (activeButton) {
          // Get the text span inside the button for precise positioning
          const textSpan = activeButton.querySelector('span');
          const containerRect = tabsRef.current.getBoundingClientRect();
          
          if (textSpan) {
            const spanRect = textSpan.getBoundingClientRect();
            setUnderlineStyle({
              left: spanRect.left - containerRect.left,
              width: spanRect.width,
            });
          } else {
            // Fallback to button positioning if span not found
            const buttonRect = activeButton.getBoundingClientRect();
            setUnderlineStyle({
              left: buttonRect.left - containerRect.left,
              width: buttonRect.width,
            });
          }
        }
      }
    };

    const timer = setTimeout(updateUnderlinePosition, 0);
    window.addEventListener('resize', updateUnderlinePosition);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateUnderlinePosition);
    };
  }, [activeTab, tabs]);

  const getActiveTabContent = () => {
    const activeTabData = tabs.find(tab => tab.key === activeTab);
    return activeTabData ? activeTabData.content : null;
  };

  return (
    <div className={`relative ${className}`}>
      {/* Tab Headers */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 pt-8 z-20">
        <div ref={tabsRef} className={`relative flex space-x-12 ${tabsClassName}`}>
          {tabs.map((tab) => (
            <button 
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`bg-transparent pb-2 transition-colors duration-300 focus:outline-none ${
                activeTab === tab.key 
                  ? (isDarkMode ? 'text-white' : 'text-black')
                  : (isDarkMode ? 'text-white/50 hover:text-white/70' : 'text-black/50 hover:text-black/70')
              }`}
            >
              <span className="text-2xl font-medium">{tab.label}</span>
            </button>
          ))}
          
          {/* Animated underline */}
          <div 
            className={`absolute bottom-0 h-0.5 ${isDarkMode ? 'bg-white' : 'bg-black'} transition-all duration-500 ease-in-out`} 
            style={underlineStyle} 
          />
        </div>
      </div>

      {/* Tab Content */}
      <div className={`pt-24 ${contentClassName}`}>
        {getActiveTabContent()}
      </div>
    </div>
  );
};

export default TabbedView;