import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';

/**
 * A custom hook to manage the position and style of the underline for the active tab.
 * It tracks the DOM element of each tab button and calculates the underline's
 * position and width based on the currently active tab.
 */
const useTabUnderline = (activeTab) => {
  const buttonRefs = useRef(new Map());
  const [underlineStyle, setUnderlineStyle] = useState({ left: 0, width: 0, opacity: 0 });

  // Memoized function to calculate and update the underline style.
  const updateUnderline = useCallback(() => {
    const activeButton = buttonRefs.current.get(activeTab);
    if (activeButton) {
      setUnderlineStyle({
        left: activeButton.offsetLeft,
        width: activeButton.offsetWidth,
        opacity: 1,
      });
    }
  }, [activeTab]);

  // Effect to update the underline when the active tab changes or the window is resized.
  useEffect(() => {
    // A small delay ensures that any layout shifts have completed before measuring.
    const timer = setTimeout(() => requestAnimationFrame(updateUnderline), 50);
    
    window.addEventListener('resize', updateUnderline);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateUnderline);
    };
  }, [activeTab, updateUnderline]);

  // Callback ref to store references to the tab button elements.
  const setButtonRef = useCallback((tabKey, element) => {
    if (element) {
      buttonRefs.current.set(tabKey, element);
    } else {
      buttonRefs.current.delete(tabKey);
    }
    // When a ref is attached, immediately update the underline if it's the active tab.
    // This handles the initial positioning correctly.
    if (tabKey === activeTab) {
      requestAnimationFrame(updateUnderline);
    }
  }, [activeTab, updateUnderline]);

  return { underlineStyle, setButtonRef };
};

const TabButton = React.memo(({ tab, isActive, isDarkMode, onClick, buttonRef }) => {
  const baseClasses = "bg-transparent pb-2 transition-colors duration-300 focus:outline-none text-2xl font-medium text-center whitespace-nowrap";
  
  const colorClasses = isActive
    ? (isDarkMode ? 'text-white' : 'text-black')
    : (isDarkMode ? 'text-white/50 hover:text-white/70' : 'text-black/50 hover:text-black/70');

  return (
    <button
      ref={buttonRef}
      onClick={onClick}
      className={`${baseClasses} ${colorClasses}`}
      aria-selected={isActive}
      role="tab"
    >
      {tab.label}
    </button>
  );
});

const TabUnderline = ({ style, isDarkMode }) => (
  <div 
    className={`absolute bottom-0 h-0.5 ${isDarkMode ? 'bg-white' : 'bg-black'} transition-all duration-300 ease-out`}
    style={{
      ...style,
      // Using transform for movement can be smoother than animating `left`.
      transform: `translateX(${style.left}px)`,
      width: style.width,
    }}
  />
);

const TabbedView = ({
  tabs = [],
  activeTab,
  onTabChange,
  isDarkMode = false,
  className = "",
  tabsClassName = "",
  contentClassName = ""
}) => {
  const { underlineStyle, setButtonRef } = useTabUnderline(activeTab);

  const activeTabData = useMemo(() => 
    tabs.find(tab => tab.key === activeTab),
    [tabs, activeTab]
  );

  // Memoize the tab change handler to prevent unnecessary re-renders of TabButton.
  const handleTabChange = useCallback((tabKey) => {
    if (tabKey !== activeTab) {
      onTabChange?.(tabKey);
    }
  }, [activeTab, onTabChange]);

  if (!tabs.length) {
    return null;
  }

  return (
    // Use a flex column layout for robust positioning.
    <div className={`flex flex-col ${className}`}>
      {/* 1. Tab Bar */}
      <div className={`flex justify-center pt-8 z-10 ${tabsClassName}`}>
        <div 
          className="relative flex space-x-12"
          role="tablist"
          aria-label="Navigation tabs"
        >
          {tabs.map((tab) => (
            <TabButton
              key={tab.key}
              tab={tab}
              isActive={activeTab === tab.key}
              isDarkMode={isDarkMode}
              onClick={() => handleTabChange(tab.key)}
              buttonRef={(el) => setButtonRef(tab.key, el)}
            />
          ))}
          
          <TabUnderline style={underlineStyle} isDarkMode={isDarkMode} />
        </div>
      </div>

      {/* 2. Tab Content */}
      {/* The top padding provides space, but the layout is not dependent on it. */}
      <div className={`pt-12 ${contentClassName}`} role="tabpanel">
        {activeTabData?.content}
      </div>
    </div>
  );
};

export default TabbedView;
