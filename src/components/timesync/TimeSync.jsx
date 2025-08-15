import React, { useEffect } from 'react';
import { useGradientState } from '../../hooks/useGradientState';

const TimeSync = () => {
  const [gradientState, updateGradientColors] = useGradientState();

  useEffect(() => {
    updateGradientColors(null, "timesync");
  }, [updateGradientColors]);

  return (
    <div style={{ color: 'white', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <h1>Time Sync</h1>
    </div>
  );
};

export default TimeSync;