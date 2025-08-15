import { useState, useEffect } from "react";
import { useGradientState } from '../../hooks/useGradientState';
import AlbumArtTest from "../AlbumArtTest";
import BTSpeedTest from "./BTSpeedTest";
import { ChevronLeftIcon } from "../common/icons";

export default function TestHub() {
  const [gradientState, updateGradientColors] = useGradientState();
  const [selectedTest, setSelectedTest] = useState(null);

  useEffect(() => {
    updateGradientColors(null, "test");
  }, [updateGradientColors]);

  const testOptions = [
    {
      id: "album-art",
      name: "Album Art Transfer",
      description: "Test album art transfer over BLE",
      component: AlbumArtTest,
    },
    {
      id: "bt-speed",
      name: "BT Speed Test",
      description: "Test Bluetooth connection speed and latency",
      component: BTSpeedTest,
    },
  ];

  if (selectedTest) {
    const TestComponent = selectedTest.component;
    return (
      <div className="relative h-full w-full">
        <button
          onClick={() => setSelectedTest(null)}
          className="absolute top-8 left-8 z-10 flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
        >
          <ChevronLeftIcon className="w-5 h-5" />
          Back to Tests
        </button>
        <TestComponent />
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-gray-900 flex flex-col items-center justify-center">
      <div className="max-w-6xl w-full px-8">
        <h1 className="text-5xl font-bold text-white mb-12 text-center">
          System Tests
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {testOptions.map((test) => (
            <button
              key={test.id}
              onClick={() => setSelectedTest(test)}
              className="p-8 bg-white/10 hover:bg-white/20 rounded-2xl transition-all transform hover:scale-105 text-left"
            >
              <h2 className="text-3xl font-semibold text-white mb-3">
                {test.name}
              </h2>
              <p className="text-xl text-white/70">{test.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}