import React from 'react';
import { Switch } from '@headlessui/react';

const SettingsToggleItem = ({ item, value, onChange }) => {
  return (
    <div className="mb-8">
      <div className="flex items-center">
        <div className="flex-1">
          <h3 className="text-[32px] font-[580] text-white tracking-tight mb-2">
            {item.title}
          </h3>
          <p className="text-[20px] font-[560] text-white/60 max-w-[380px] tracking-tight">
            {item.description}
          </p>
        </div>
        <Switch
          checked={value}
          onChange={onChange}
          className={`${
            value ? 'bg-white' : 'bg-white/30'
          } relative inline-flex h-[26px] w-[50px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75`}
        >
          <span
            className={`${
              value ? 'translate-x-6 bg-black' : 'translate-x-0 bg-white'
            } pointer-events-none inline-block h-[22px] w-[22px] transform rounded-full shadow-lg ring-0 transition duration-200 ease-in-out`}
          />
        </Switch>
      </div>
    </div>
  );
};

export default SettingsToggleItem;