import React from 'react';

const SettingsActionItem = ({ item, onAction }) => {
  return (
    <div className="mb-8">
      <button
        onClick={() => onAction(item.action)}
        className="text-left w-full transition-all duration-200 hover:scale-[1.02] transform-gpu"
      >
        <h3 className="text-[32px] font-[580] text-white tracking-tight mb-2">
          {item.title}
        </h3>
        <p className="text-[20px] font-[560] text-white/60 max-w-[380px] tracking-tight">
          {item.description}
        </p>
      </button>
    </div>
  );
};

export default SettingsActionItem;