# Nocturne Ecosystem

Complete music car interface system for Spotify Car Thing with Android companion app.

## Architecture

### Components
- **nocturned-v2** - Go backend daemon managing BLE communication, weather data, time sync
- **nocturne-ui** - React/Vite frontend with music controls and weather display  
- **NocturneCompanion** - Android app sending weather/time data via BLE

### Technology Stack
- **Frontend**: Vite + React + TailwindCSS (no TypeScript)
- **Backend**: Go 1.23+ with Binary Protocol V2 over BLE
- **Android**: Kotlin + Jetpack Compose, API 26+
- **Target**: Spotify Car Thing (Void Linux, ARM64)

## Key Commands

### Development
```bash
# Frontend
bun run dev          # Development server
bun run build        # Production build
bun run lint         # Lint check

# Backend (nocturned-v2)
go build             # Local build
./deploy_nocturned.sh # Build ARM64 + deploy to Car Thing
./scripts/stream_logs.sh # Color-coded log streaming

# Android
./gradlew assembleDebug  # Build APK
./gradlew installDebug   # Install to device
```

### Deployment
```bash
# Deploy frontend
./deployment/deploy_nocturne-ui.sh

# Deploy backend  
cd nocturned/nocturned-v2 && ./deploy_nocturned.sh

# Deploy Android
./deployment/install_nocturne_companion.sh
```

## API Endpoints

### Weather System
- `GET /api/weather/current` - Returns hourly and weekly weather data
- Weather data: `/var/nocturne/weather/hourly_weather.json`, `weekly_weather.json`
- WebSocket broadcasts weather updates in real-time

### System
- `GET /api/v2/health` - System health check
- `GET /api/v2/status` - Service status
- `WebSocket /ws` - Real-time updates (weather, time sync, media)

## Data Flow

### Weather Data
1. **NocturneCompanion** → GZIP-compressed JSON via BLE Binary Protocol V2
2. **nocturned-v2** → Decompresses, parses, stores to JSON files
3. **nocturne-ui** → Fetches via HTTP API, displays hourly/weekly forecasts

### Time Sync
1. **NocturneCompanion** → Timestamp + timezone via BLE
2. **nocturned-v2** → Sets system time, broadcasts via WebSocket
3. **nocturne-ui** → Updates clock display in real-time

## Key Files

### Backend (nocturned-v2)
- `weather_handler.go` - Weather data processing and storage
- `broadcaster.go` - WebSocket event broadcasting  
- `protocol.go` - Binary protocol message parsing
- `server/server.go` - HTTP API with v1/v2 compatibility

### Frontend (nocturne-ui)
- `components/weather/WeatherView.jsx` - Main weather interface
- `components/weather/HourlyForecast.jsx` - Hourly weather display
- `components/weather/WeeklyForecast.jsx` - Weekly weather display

## Debugging

### Log Monitoring
```bash
# Color-coded streaming (recommended)
cd nocturned/nocturned-v2 && ./scripts/stream_logs.sh

# Raw log access
sshpass -p "nocturne" ssh root@172.16.42.2 "tail -f /var/nocturne/nocturned_v2.log"
```

### Device Access
- **SSH**: `sshpass -p "nocturne" ssh root@172.16.42.2`
- **Browser Debug**: `./deployment/debug_browser_console.sh`
- **Screenshots**: Press `3` key in UI → `./deployment/collect_screenshots.sh`

## System Paths (Car Thing)

### Core Files
- Binary: `/usr/local/bin/nocturned`
- UI: `/etc/nocturne/ui/`  
- Weather: `/var/nocturne/weather/`
- Logs: `/var/nocturne/nocturned_v2.log`
- Screenshots: `/var/nocturne/screenshots/`

### Services
- Backend: `sv status nocturned`
- UI: `sv status chromium`
- Config: `/etc/sv/nocturned/`, `/etc/sv/chromium/`