import React from 'react';

const SettingsSponsorsList = ({ item }) => {
  return (
    <div className="mb-8">
      <h3 className="text-[32px] font-[580] text-white tracking-tight mb-4">
        {item.title}
      </h3>
      <div className="grid grid-cols-2 gap-x-8 gap-y-1">
        {item.names.map((name, index) => (
          <p key={index} className="text-[20px] font-[560] text-white/60 tracking-tight">
            {name}
          </p>
        ))}
      </div>
    </div>
  );
};

export default SettingsSponsorsList;