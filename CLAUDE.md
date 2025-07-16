# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

nocturne-ui is a React-based web application designed specifically for the Spotify Car Thing. It provides an intuitive interface for local media control and Bluetooth device management, optimized for the Car Thing's 800x480 touch display and unique hardware controls.

## Technology Stack

- **Framework**: React 19 with React Router
- **Build Tool**: Vite 6+ with legacy browser support
- **Package Manager**: Bun (preferred) or npm
- **Styling**: Tailwind CSS with custom utility classes
- **State Management**: React hooks and context
- **Real-time Communication**: WebSocket (via useNocturned hook)
- **API Communication**: Fetch API with network-aware requests

## Common Development Commands

```bash
# Install dependencies
bun install

# Start development server (usually port 5173)
bun dev

# Build for production
bun run build

# Run ESLint
bun run lint

# Preview production build
bun preview
```

## Car Thing Deployment

### Quick Deployment Script
```bash
# Use the provided deployment script
./deploy.sh
```

### Manual Deployment
```bash
# Build the UI
bun run build

# Deploy to Car Thing
sshpass -p "nocturne" scp -r dist/* root@172.16.42.2:/etc/nocturne/ui/

# Restart UI service
sshpass -p "nocturne" ssh root@172.16.42.2 "rc-service weston restart"
```

## Architecture Overview

### Core Hooks Architecture
- **useNocturned**: Global WebSocket connection and API communication
- **useLocalMedia**: Media state management with smooth UI updates
- **useBluetooth**: Bluetooth device management with auto-reconnection
- **useNavigation**: Hardware button and gesture navigation
- **useScrollWheel**: Scroll wheel event handling for Car Thing

### Component Structure
```
src/
├── components/
│   ├── media/                    # Media control components
│   │   ├── LocalMediaPlayer.jsx  # Main media interface
│   │   ├── VolumeControl.jsx     # Volume slider
│   │   └── MediaControls.jsx     # Play/pause/skip buttons
│   ├── bluetooth/                # Bluetooth management
│   │   ├── BluetoothSettings.jsx # Main BT interface
│   │   ├── DeviceList.jsx        # Paired devices
│   │   └── PairingModal.jsx      # Pairing confirmation
│   ├── common/                   # Shared components
│   │   ├── navigation/           # Navigation components
│   │   ├── icons/               # SVG icon components
│   │   └── modals/              # Modal components
│   └── settings/                 # Settings screens
└── hooks/                        # Custom React hooks
```

## Key Implementation Patterns

### Media Control Pattern
The media system uses a layered approach:
1. **useLocalMedia hook**: Manages server state and smooth client-side updates
2. **LocalMediaPlayer component**: Orchestrates media UI components
3. **Real-time synchronization**: WebSocket updates with optimistic UI updates

```javascript
// Example: Smooth progress bar updates
const { position, duration, isPlaying, seekTo } = useLocalMedia();

// Client-side position animation for smooth playback
useEffect(() => {
  if (isPlaying) {
    const animate = () => {
      // Update position based on elapsed time
      setClientPosition(serverPosition + elapsed);
      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }
}, [isPlaying]);
```

### Bluetooth Management Pattern
Complex state management with reconnection logic:
1. **Auto-reconnection**: Attempts to reconnect to last known device
2. **Connection queuing**: Prevents multiple simultaneous connection attempts
3. **Network polling**: Monitors connection health after pairing

### Component State Management
Uses React hooks pattern with custom hooks for complex state:
- **Local state**: Component-specific UI state
- **Shared state**: Global app state via context or global hooks
- **Server state**: API state managed by custom hooks

## Car Thing Specific Optimizations

### Hardware Integration
- **Scroll Wheel**: Implemented via useScrollWheel hook for volume/seek control
- **Hardware Buttons**: Mapped via useNavigation hook for back/preset functions
- **Touch Optimization**: Minimum 44px touch targets, optimized gesture handling

### Display Optimization
- **Resolution**: 800x480 landscape orientation
- **Font Loading**: Custom font loading with fallbacks
- **Performance**: Optimized bundle splitting and lazy loading

### Browser Compatibility
- **Legacy Support**: Vite legacy plugin for older Chromium versions
- **Polyfills**: Modern JavaScript features polyfilled for Car Thing browser

## API Communication

### Backend Integration
The UI communicates with the nocturned service running on port 5000:

```javascript
// Media control endpoints
POST /media/play
POST /media/pause
POST /media/next
POST /media/previous
POST /media/seek/{position_ms}
POST /media/volume/{percent}
GET /media/status

// Bluetooth management endpoints
GET /bluetooth/devices
POST /bluetooth/connect/{addr}
POST /bluetooth/disconnect/{addr}
POST /bluetooth/discover/on
POST /bluetooth/discover/off
```

### WebSocket Event Handling
Real-time events from nocturned service:
```javascript
// Media events
'media/connected'         // Android device connected
'media/disconnected'      // Android device disconnected
'media/state_update'      // Media state changed

// Bluetooth events
'bluetooth/connect'       // Device connected
'bluetooth/disconnect'    // Device disconnected
'bluetooth/pairing'       // Pairing request
```

## Development Best Practices

### Component Development
- Use functional components with hooks
- Implement proper error boundaries
- Optimize re-renders with React.memo and useMemo
- Handle loading and error states consistently

### State Management
- Use custom hooks for complex stateful logic
- Implement proper cleanup in useEffect hooks
- Handle network connectivity gracefully
- Use optimistic updates for responsive UI

### Performance Optimization
- Implement code splitting for large components
- Use CSS transforms for animations
- Minimize bundle size with proper imports
- Lazy load non-critical components

### Testing Strategies
- Test components in isolation
- Mock API responses for reliable testing
- Test hardware integration on actual Car Thing
- Verify WebSocket connection handling

## Debugging and Troubleshooting

### Common Issues

#### Media Control Not Working
- Check if nocturned service is running: `ssh root@172.16.42.2 "ps aux | grep nocturned"`
- Verify Android device connection in Bluetooth settings
- Check WebSocket connection status in browser dev tools

#### UI Not Loading
- Verify files deployed to `/etc/nocturne/ui/` on Car Thing
- Check if Caddy service is running: `ssh root@172.16.42.2 "rc-status | grep caddy"`
- Clear browser cache: `rm -rf /data/etc/chrome/cache/* /data/etc/chrome/data/*`

#### Bluetooth Issues
- Check Bluetooth adapter status in settings
- Verify device pairing from Android device
- Monitor WebSocket messages for pairing events

### Development Tools
```bash
# Check API status
curl http://localhost:5000/media/status

# Monitor WebSocket messages
# Use browser dev tools WebSocket tab

# Test on actual Car Thing
bun dev --host
# Then access via Car Thing browser at http://[your-ip]:5173
```

## Build Configuration

### Vite Configuration
The project uses optimized Vite configuration:
- **Legacy Support**: Chrome 64+ compatibility
- **Bundle Splitting**: Separate chunks for vendor, spotify, and UI code
- **Modern Build**: ES modules with polyfills

### Environment Variables
```bash
# Development
VITE_API_URL=http://localhost:5000

# Production (Car Thing)
VITE_API_URL=http://localhost:5000
```

## File Structure Guidelines

### Component Organization
- Group related components in feature directories
- Use barrel exports (index.js) for clean imports
- Separate logic (hooks) from presentation (components)
- Keep components focused on single responsibility

### Asset Management
- Icons: SVG components in `src/components/common/icons/`
- Images: Static assets in `public/images/`
- Fonts: Web fonts in `public/fonts/`

## Recent Implementation Notes

### Media Screen Enhancement (2025-01-07)
- ✅ Implemented automatic mode detection (song vs podcast)
- ✅ Added 5-button media control layout
- ✅ Enhanced progress bar with scroll wheel seeking
- ✅ Mode-specific UI elements (like button vs volume icon)
- ✅ **FIXED**: Critical volume control position sync bug
- ✅ Consolidated sidebar - removed duplicate "Now Playing" section
- ✅ Advanced progress bar with keyboard controls (Enter/Escape)
- ✅ Smart mode detection (>15 minutes = podcast mode)

### Volume Control Bug Fix (2025-01-07)
**Problem**: Volume scrolling caused progress bar/time display to jump to previous positions
**Solution**: Separated volume updates from position updates in WebSocket message handling
**Files Modified**: `src/hooks/useLocalMedia.js` with comprehensive documentation

### Repository Setup
- ✅ **Private Fork**: https://github.com/UseLizard/nocturne-ui
- ✅ **SSH Authentication**: Working with ed25519 key
- ✅ **Remote Setup**: 
  - `origin`: git@github.com:UseLizard/nocturne-ui.git (your private fork)
  - `upstream`: https://github.com/usenocturne/nocturne-ui.git (original repo)

### Deployment Process
1. Build with `bun run build`
2. Use `./deploy.sh` script for automated deployment
3. Or manually: Clear old assets, deploy dist files to `/etc/nocturne/ui/`
4. Clear browser cache if needed
5. Restart Caddy and Weston services