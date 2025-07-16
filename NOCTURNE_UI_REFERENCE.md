# Nocturne UI - Reference Guide

## Overview

nocturne-ui is a React-based web application designed specifically for the Spotify Car Thing. It provides an intuitive interface for local media control and Bluetooth device management, optimized for touch interaction and the Car Thing's unique form factor.

## Technology Stack

- **Framework**: React 18+
- **Build Tool**: Vite
- **Package Manager**: Bun
- **Styling**: Tailwind CSS
- **State Management**: React Hooks + Context
- **Real-time Communication**: WebSocket
- **HTTP Client**: Fetch API

## Project Structure

```
/nocturne-ui/
├── src/
│   ├── components/
│   │   ├── common/navigation/
│   │   │   ├── Sidebar.jsx           # Main navigation
│   │   │   └── StatusBar.jsx         # Connection indicators
│   │   ├── media/                    # Media control components
│   │   │   ├── LocalMediaPlayer.jsx  # Main media interface
│   │   │   ├── MediaControls.jsx     # Play/pause/skip buttons
│   │   │   ├── MediaDisplay.jsx      # Track info display
│   │   │   ├── MediaProgressBar.jsx  # Seek bar with position
│   │   │   └── VolumeControl.jsx     # Volume slider
│   │   ├── bluetooth/                # Bluetooth management
│   │   │   ├── BluetoothSettings.jsx # Main Bluetooth interface
│   │   │   ├── DeviceList.jsx        # Paired device listing
│   │   │   ├── PairingModal.jsx      # Pairing confirmation UI
│   │   │   └── BluetoothStatus.jsx   # Connection status
│   │   └── settings/
│   │       └── Settings.jsx          # Device settings
│   ├── hooks/
│   │   ├── useLocalMedia.js          # Media state management
│   │   └── useNocturned.js           # WebSocket connection
│   ├── pages/
│   │   └── Home.jsx                  # Main page with media section
│   └── App.jsx                       # Root component
├── public/                           # Static assets
├── package.json                      # Dependencies and scripts
└── vite.config.js                    # Build configuration
```

## Build Commands

### Development
```bash
# Install dependencies
bun install

# Start development server
bun dev

# Run with host binding (for Car Thing testing)
bun dev --host
```

### Production
```bash
# Build for production
bun run build

# Preview production build
bun preview

# Deploy to Car Thing
sshpass -p 'nocturne' scp -r dist/* root@172.16.42.2:/etc/nocturne/ui/
```

### Linting and Testing
```bash
# Run ESLint
bun run lint

# Fix linting issues
bun run lint:fix

# Run tests (if configured)
bun test
```

## Core Components

### Media Control Components

#### LocalMediaPlayer.jsx
Main media player interface that coordinates all media-related components.

**Key Features**:
- Connection status monitoring
- Real-time media state display
- Responsive layout for Car Thing screen
- Fallback UI when no media is playing

**Props**: None (uses hooks for state management)

#### MediaControls.jsx
Interactive controls for media playback.

**Features**:
- Play/pause toggle button
- Next/previous track buttons
- Large touch-friendly design
- Visual feedback for button states

**API Integration**:
```javascript
// Send commands to nocturned
fetch('/media/play', { method: 'POST' })
fetch('/media/pause', { method: 'POST' })
fetch('/media/next', { method: 'POST' })
fetch('/media/previous', { method: 'POST' })
```

#### MediaProgressBar.jsx
Seek bar with position display and touch interaction.

**Features**:
- Current position and total duration display
- Touch/click seeking functionality
- Real-time position updates
- Time formatting (MM:SS)

**API Integration**:
```javascript
// Seek to specific position
fetch(`/media/seek/${position_ms}`, { method: 'POST' })
```

#### VolumeControl.jsx
Volume adjustment slider.

**Features**:
- 0-100% volume range
- Visual volume level indicator
- Touch-friendly slider control
- Real-time volume updates

**API Integration**:
```javascript
// Set volume level
fetch(`/media/volume/${percent}`, { method: 'POST' })
```

### Bluetooth Management Components

#### BluetoothSettings.jsx
Main Bluetooth management interface.

**Features**:
- Bluetooth adapter on/off toggle
- Device discovery controls
- Paired device list display
- Connection management

#### DeviceList.jsx
Display and management of paired Bluetooth devices.

**Features**:
- Device name, address, and status display
- Connect/disconnect actions
- Device removal (forget) functionality
- Real-time connection status updates

#### PairingModal.jsx
Modal interface for handling pairing requests.

**Features**:
- Pairing request notifications
- Accept/deny pairing actions
- Device information display
- Auto-dismiss on timeout

### Navigation Components

#### Sidebar.jsx
Main navigation menu with media section integration.

**Features**:
- Navigation to different app sections
- Media section with connection indicator
- Touch-optimized menu items
- Visual state indicators

#### StatusBar.jsx
Top status bar with connection and media indicators.

**Features**:
- Bluetooth adapter status
- Media connection indicator
- Currently playing track info (scrolling)
- Battery and system status

## State Management

### useLocalMedia Hook
Manages media state and communication with nocturned service.

**State Properties**:
```javascript
{
  connected: boolean,           // Android device connection status
  currentTrack: {
    artist: string,
    album: string,
    track: string,
    duration_ms: number,
    position_ms: number,
    is_playing: boolean,
    volume_percent: number
  },
  connectionStatus: string,     // 'disconnected' | 'connecting' | 'connected'
  error: string | null
}
```

**API Methods**:
```javascript
const {
  play,
  pause,
  next,
  previous,
  seek,
  setVolume,
  getStatus
} = useLocalMedia();
```

### useNocturned Hook
Manages WebSocket connection and real-time event handling.

**WebSocket Events**:
```javascript
// Media events
'media/connected'         // Android device connected
'media/disconnected'      // Android device disconnected
'media/state_update'      // Media state changed
'media/command_sent'      // Command acknowledgment

// Bluetooth events
'bluetooth/connect'       // Device connected
'bluetooth/disconnect'    // Device disconnected
'bluetooth/pairing/request' // Pairing request received
```

## API Integration

### Media Control Endpoints
```javascript
// Get current media status
GET /media/status
Response: {
  connected: boolean,
  state: {
    artist: string,
    album: string,
    track: string,
    duration_ms: number,
    position_ms: number,
    is_playing: boolean,
    volume_percent: number
  }
}

// Send media commands
POST /media/play
POST /media/pause
POST /media/next
POST /media/previous
POST /media/seek/{position_ms}
POST /media/volume/{percent}
```

### Bluetooth Management Endpoints
```javascript
// Bluetooth adapter control
POST /bluetooth/discover/on     // Enable discoverable mode
POST /bluetooth/discover/off    // Disable discoverable mode

// Device management
GET /bluetooth/devices          // List paired devices
POST /bluetooth/connect/{addr}  // Connect to device
POST /bluetooth/disconnect/{addr} // Disconnect device
POST /bluetooth/remove/{addr}   // Remove/forget device

// Pairing management
POST /bluetooth/pairing/accept  // Accept pairing request
POST /bluetooth/pairing/deny    // Deny pairing request
```

## Development Guidelines

### Car Thing Optimization

#### Screen Dimensions
- Resolution: 480x800 pixels
- Aspect ratio: 3:5 (portrait)
- Touch-friendly button sizes (minimum 44px)
- High contrast for outdoor visibility

#### Performance Considerations
- Minimize re-renders with React.memo
- Use CSS transforms for animations
- Optimize bundle size with code splitting
- Lazy load non-critical components

#### Touch Interaction
```css
/* Touch-friendly button sizing */
.touch-button {
  min-width: 44px;
  min-height: 44px;
  padding: 12px;
  border-radius: 8px;
}

/* Improve touch responsiveness */
.interactive {
  touch-action: manipulation;
  user-select: none;
}
```

### State Management Best Practices

#### React Hooks Usage
```javascript
// Efficient state updates
const [mediaState, setMediaState] = useState(initialState);

// Memoized computations
const progress = useMemo(() => {
  return mediaState.position_ms / mediaState.duration_ms;
}, [mediaState.position_ms, mediaState.duration_ms]);

// Debounced API calls
const debouncedSeek = useCallback(
  debounce((position) => seek(position), 300),
  [seek]
);
```

#### WebSocket Connection Management
```javascript
// Robust WebSocket handling
useEffect(() => {
  const ws = new WebSocket('ws://localhost:8080');
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    handleWebSocketMessage(data);
  };
  
  ws.onclose = () => {
    // Implement reconnection logic
    setTimeout(() => connectWebSocket(), 5000);
  };
  
  return () => ws.close();
}, []);
```

## Testing and Debugging

### Local Development Testing
```bash
# Test against mock API
VITE_API_URL=http://localhost:5001 bun dev

# Test with actual Car Thing
VITE_API_URL=http://172.16.42.2:5000 bun dev --host
```

### Car Thing Deployment Testing
```bash
# Build and deploy to Car Thing
bun run build
sshpass -p 'nocturne' scp -r dist/* root@172.16.42.2:/etc/nocturne/ui/

# Restart Weston service to reload UI
sshpass -p 'nocturne' ssh root@172.16.42.2 "rc-service weston restart"
```

### Debugging Tips

#### WebSocket Connection Issues
```javascript
// Add WebSocket debugging
const ws = new WebSocket('ws://172.16.42.2:8080');
ws.onopen = () => console.log('WebSocket connected');
ws.onerror = (error) => console.error('WebSocket error:', error);
ws.onclose = (event) => console.log('WebSocket closed:', event.code, event.reason);
```

#### API Call Debugging
```javascript
// Log all API calls
const apiCall = async (url, options = {}) => {
  console.log(`API Call: ${options.method || 'GET'} ${url}`);
  const response = await fetch(url, options);
  console.log(`API Response: ${response.status}`, await response.clone().json());
  return response;
};
```

#### Car Thing Console Access
```bash
# SSH into Car Thing for live debugging
ssh root@172.16.42.2

# View Chromium console logs
ps aux | grep chromium
```

## Common Issues and Solutions

### Issue: UI Not Loading on Car Thing
**Solutions**:
- Check if Caddy service is running: `rc-status | grep caddy`
- Verify UI files are in `/etc/nocturne/ui/`
- Check Weston service configuration

### Issue: WebSocket Connection Fails
**Solutions**:
- Verify nocturned service is running on port 8080
- Check firewall settings on Car Thing
- Monitor WebSocket URL in browser dev tools

### Issue: Media Controls Not Responding
**Solutions**:
- Check if Android device is connected
- Verify NocturneCompanion app is running
- Monitor API response status codes
- Check nocturned service logs

### Issue: Touch Interaction Problems
**Solutions**:
- Increase button sizes (minimum 44px)
- Add touch-action CSS properties
- Test with actual Car Thing hardware
- Optimize for single-touch gestures

## Build Optimization

### Production Build Configuration
```javascript
// vite.config.js
export default {
  build: {
    target: 'esnext',
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          media: ['./src/components/media'],
          bluetooth: ['./src/components/bluetooth']
        }
      }
    }
  }
};
```

### Bundle Size Analysis
```bash
# Analyze bundle size
bun run build --analyze

# Check individual file sizes
ls -la dist/assets/
```

---

**Last Updated**: 2025-01-05  
**Component Version**: 1.0.0  
**Dependencies**: React 18+, Vite 4+, Bun  
**Target Platform**: Spotify Car Thing (480x800 touch display)