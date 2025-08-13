import { useState, useEffect, useRef } from "react";
import { useNocturned } from "../../hooks/useNocturned";

export default function BTSpeedTest() {
  const [testStatus, setTestStatus] = useState("idle"); // idle, testing, complete, failed
  const [currentTest, setCurrentTest] = useState("");
  const [results, setResults] = useState({
    latency: null,
    throughput: null,
    packetLoss: null,
    mtu: null,
    connectionQuality: null,
    phyStatus: null
  });
  const [testProgress, setTestProgress] = useState(0);
  const [detailedStats, setDetailedStats] = useState([]);
  const { ws, addMessageListener, removeMessageListener } = useNocturned();
  const startTimeRef = useRef(null);
  const testSequenceRef = useRef(0);

  useEffect(() => {
    const listenerId = addMessageListener("bt-speed-test", (data) => {
      console.log("BTSpeedTest received message:", data);
      
      if (data.type === "test/bt_speed_pong") {
        // Calculate latency from ping-pong
        const latency = Date.now() - startTimeRef.current;
        setDetailedStats(prev => [...prev, { 
          type: "latency", 
          value: latency, 
          timestamp: Date.now() 
        }]);
      } else if (data.type === "test/bt_speed_throughput") {
        // Throughput test result
        if (data.payload) {
          setResults(prev => ({
            ...prev,
            throughput: data.payload.throughput_kbps,
            mtu: data.payload.mtu
          }));
          setDetailedStats(prev => [...prev, { 
            type: "throughput", 
            value: data.payload.throughput_kbps,
            chunks: data.payload.chunks_received,
            timestamp: Date.now() 
          }]);
        }
      } else if (data.type === "test/bt_speed_complete") {
        // Test complete with summary
        if (data.payload) {
          setResults({
            latency: data.payload.avg_latency_ms,
            throughput: data.payload.throughput_kbps,
            packetLoss: data.payload.packet_loss_percent,
            mtu: data.payload.mtu,
            phyStatus: data.payload.phy_status || "Unknown",
            connectionQuality: calculateQuality(
              data.payload.avg_latency_ms,
              data.payload.throughput_kbps,
              data.payload.packet_loss_percent
            )
          });
          setTestStatus("complete");
          setTestProgress(100);
        }
      } else if (data.type === "test/bt_speed_progress") {
        // Progress update
        if (data.payload) {
          setTestProgress(data.payload.progress_percent);
          setCurrentTest(data.payload.current_test || "");
        }
      } else if (data.type === "test/bt_speed_failed") {
        setTestStatus("failed");
        console.error("BT speed test failed:", data.payload?.reason);
      } else if (data.type === "test/2m_phy_response") {
        // 2M PHY negotiation response
        if (data.payload) {
          setResults(prev => ({
            ...prev,
            phyStatus: data.payload.success ? "2M PHY" : "1M PHY"
          }));
          console.log("PHY Status:", data.payload.success ? "2M PHY enabled" : "1M PHY (default)");
        }
      } else if (data.type === "test/phy_status") {
        // PHY status update
        if (data.payload) {
          setResults(prev => ({
            ...prev,
            phyStatus: data.payload.phy_mode || "Unknown"
          }));
        }
      }
    });

    return () => removeMessageListener(listenerId);
  }, [addMessageListener, removeMessageListener]);

  const calculateQuality = (latency, throughput, packetLoss) => {
    // Simple quality calculation based on metrics
    if (!latency || !throughput) return "Unknown";
    
    let score = 100;
    
    // Latency scoring (lower is better)
    if (latency < 50) score -= 0;
    else if (latency < 100) score -= 10;
    else if (latency < 200) score -= 25;
    else score -= 50;
    
    // Throughput scoring (higher is better, in kbps)
    if (throughput > 100) score -= 0;
    else if (throughput > 50) score -= 15;
    else if (throughput > 20) score -= 30;
    else score -= 50;
    
    // Packet loss scoring
    if (packetLoss > 0) score -= packetLoss * 2;
    
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Poor";
  };

  const startSpeedTest = async () => {
    setTestStatus("testing");
    setTestProgress(0);
    setCurrentTest("Initializing...");
    setResults({
      latency: null,
      throughput: null,
      packetLoss: null,
      mtu: null,
      connectionQuality: null,
      phyStatus: null
    });
    setDetailedStats([]);
    testSequenceRef.current++;
    
    try {
      // Start the speed test via HTTP API
      const response = await fetch("http://localhost:5000/api/test/bt-speed/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          test_sequence: testSequenceRef.current
        })
      });
      
      if (!response.ok) {
        console.error("Failed to start BT speed test");
        setTestStatus("failed");
      }
    } catch (error) {
      console.error("Error starting BT speed test:", error);
      setTestStatus("failed");
    }
  };

  const runLatencyTest = async () => {
    setCurrentTest("Testing latency...");
    startTimeRef.current = Date.now();
    
    // Send ping via WebSocket
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: "test/bt_speed_ping",
        timestamp: Date.now()
      }));
    }
  };

  const getStatusColor = () => {
    switch (testStatus) {
      case "testing":
        return "bg-blue-600";
      case "complete":
        return "bg-green-600";
      case "failed":
        return "bg-red-600";
      default:
        return "bg-gray-900";
    }
  };

  const getQualityColor = (quality) => {
    switch (quality) {
      case "Excellent":
        return "text-green-400";
      case "Good":
        return "text-blue-400";
      case "Fair":
        return "text-yellow-400";
      case "Poor":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  const formatLatency = (ms) => {
    if (!ms) return "—";
    return `${Math.round(ms)}ms`;
  };

  const formatThroughput = (kbps) => {
    if (!kbps) return "—";
    if (kbps > 1000) {
      return `${(kbps / 1000).toFixed(1)} Mbps`;
    }
    return `${Math.round(kbps)} kbps`;
  };

  return (
    <div className={`h-full w-full transition-colors duration-300 ${getStatusColor()} flex flex-col items-center justify-center`}>
      <div className="max-w-5xl w-full px-8">
        <h1 className="text-5xl font-bold text-white mb-8 text-center">
          Bluetooth Speed Test
        </h1>
        
        <div className="mb-8 text-center">
          <button
            onClick={startSpeedTest}
            className="px-8 py-4 bg-white text-gray-900 rounded-lg text-xl font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={testStatus === "testing"}
          >
            {testStatus === "testing" ? "Testing..." : "Start Speed Test"}
          </button>
        </div>
        
        {testStatus === "testing" && (
          <div className="mb-8">
            <div className="text-white text-xl mb-4 text-center">
              {currentTest}
            </div>
            <div className="w-full bg-white/20 rounded-full h-4 overflow-hidden">
              <div 
                className="bg-white h-full transition-all duration-300 ease-out"
                style={{ width: `${testProgress}%` }}
              />
            </div>
            <p className="mt-2 text-white text-center">{testProgress}%</p>
          </div>
        )}
        
        {(testStatus === "complete" || (testStatus === "testing" && Object.values(results).some(v => v !== null))) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-black/30 rounded-xl p-6">
              <h3 className="text-2xl font-semibold text-white mb-4">Results</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-white/80 text-lg">Latency:</span>
                  <span className="text-white text-xl font-mono">
                    {formatLatency(results.latency)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-white/80 text-lg">Throughput:</span>
                  <span className="text-white text-xl font-mono">
                    {formatThroughput(results.throughput)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-white/80 text-lg">Packet Loss:</span>
                  <span className="text-white text-xl font-mono">
                    {results.packetLoss !== null ? `${results.packetLoss.toFixed(1)}%` : "—"}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-white/80 text-lg">MTU Size:</span>
                  <span className="text-white text-xl font-mono">
                    {results.mtu ? `${results.mtu} bytes` : "—"}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-white/80 text-lg">PHY Mode:</span>
                  <span className={`text-xl font-mono ${
                    results.phyStatus === "2M PHY" ? "text-green-400" : 
                    results.phyStatus === "1M PHY" ? "text-yellow-400" : 
                    "text-white"
                  }`}>
                    {results.phyStatus || "—"}
                  </span>
                </div>
                
                <div className="pt-4 mt-4 border-t border-white/20">
                  <div className="flex justify-between items-center">
                    <span className="text-white text-lg">Connection Quality:</span>
                    <span className={`text-2xl font-bold ${getQualityColor(results.connectionQuality)}`}>
                      {results.connectionQuality || "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {detailedStats.length > 0 && (
              <div className="bg-black/30 rounded-xl p-6">
                <h3 className="text-2xl font-semibold text-white mb-4">Test History</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {detailedStats.slice(-10).reverse().map((stat, index) => (
                    <div key={index} className="text-white/70 text-sm font-mono">
                      {stat.type === "latency" && `Latency: ${stat.value}ms`}
                      {stat.type === "throughput" && `Throughput: ${formatThroughput(stat.value)} (${stat.chunks} chunks)`}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {testStatus === "failed" && (
          <div className="bg-red-900/50 rounded-xl p-6 text-center">
            <p className="text-white text-xl">
              Speed test failed. Please check your Bluetooth connection and try again.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}