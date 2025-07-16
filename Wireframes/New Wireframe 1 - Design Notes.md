# Design Notes for "New Wireframe 1.png"

## Wireframe Overview
This wireframe shows the redesigned home screen layout with enhanced navigation structure and improved media player interface.

---

## Design Clarifications & Requirements

### 1. Bluetooth Section Implementation
**Current State**: Bluetooth management is a submenu within Settings, constrained to the smaller content area  
**Proposed Change**: Dedicated "Bluetooth" navigation item with full-screen view  

**Requirements**:
- Move Bluetooth functionality from Settings submenu to main navigation
- Utilize full screen real estate instead of constrained content area
- Maintain all current Bluetooth functionality (device pairing, management, status)
- Keep existing vertical scrolling behavior
- Improve layout design to take advantage of larger display area
- Better visual hierarchy and spacing with full-screen layout

### 2. Media Player Mode Detection
**Automatic Mode Switching**: Based on track duration  
**Logic**: Tracks longer than 15 minutes automatically switch to "podcast mode"  

**Implementation Details**:
- **Song Mode**: Tracks ≤ 15 minutes (typical music tracks)
- **Podcast Mode**: Tracks > 15 minutes (podcasts, audiobooks, long-form content)
- **Real-time Detection**: Mode determined dynamically based on current track duration
- **Layout Adaptation**: UI adjusts automatically between song/podcast layouts
- **Content Compatibility**: Podcast mode works for audiobooks and other long-form audio content

### 3. Enhanced Media Player Controls
**Extended Control Set**: More comprehensive playback controls in bottom section  

**Control Layout** (from wireframe):
- **Previous Track**: Navigate to previous item in queue
- **Skip Back 30s**: Jump backward 30 seconds in current track
- **Play/Pause**: Standard playback toggle
- **Skip Forward 30s**: Jump forward 30 seconds in current track  
- **Next Track**: Navigate to next item in queue
- **Additional Controls**: Volume, options, etc.

**Seek Functionality**: 
- Maintains existing seek bar behavior and interaction
- 30-second skip buttons provide quick navigation for podcast content
- Both seek methods work simultaneously (scrubbing + button skips)

### 4. Options Press Functionality
**Trigger**: Bottom right button in the media player control bar  
**Behavior**: Pop-up overlay with additional media controls and options  

**Implementation Details**:
- Activated by pressing the bottom-right control button (shown in wireframe)
- Overlay should appear over current media player interface
- Contains additional controls not shown in main interface (like, shuffle, repeat, etc.)
- Should maintain context of current playing media
- Easy dismissal back to main media interface

### 5. Grid Scrolling Behavior
**Requirement**: Maintain current horizontal scrolling implementation  
**Clarification**: The 6-column grid layout shown is for visual reference only  

**Implementation Notes**:
- Keep existing horizontal scroll behavior for content sections (Recents, Library, etc.)
- Wireframe grid layout is for future design reference, not immediate implementation
- Current scrolling performance and interaction patterns should be preserved
- Grid sizing and spacing can be referenced for future layout improvements

### 6. Navigation Structure Changes
**New Structure**:
```
Sidebar Navigation (9 items):
├── Media (existing functionality)
├── Recents (existing functionality)
├── Library (existing functionality) 
├── Artists (existing functionality)
├── Radio (existing functionality)
├── Podcasts (existing functionality)
├── Settings (reduced scope - no longer contains Bluetooth)
└── Bluetooth (NEW - promoted from Settings submenu)
```

**Impact on Settings**:
- Remove Bluetooth management from Settings menu
- Settings retains: Account, General, Playback, Network (WiFi), Updates, Support & Credits
- Settings remains full-screen but with reduced content scope

---

## Technical Implementation Notes

### Media Player Mode Logic
```javascript
// Pseudo-code for mode detection
const determineMediaMode = (trackDuration) => {
  const PODCAST_THRESHOLD = 15 * 60 * 1000; // 15 minutes in milliseconds
  return trackDuration > PODCAST_THRESHOLD ? 'podcast' : 'song';
};

// UI adapts based on mode
const MediaPlayer = ({ currentTrack }) => {
  const mode = determineMediaMode(currentTrack.duration);
  return mode === 'podcast' ? <PodcastLayout /> : <SongLayout />;
};
```

### Enhanced Control Implementation
1. **Add 30-second skip controls** to media player interface
2. **Implement skip forward/backward functionality** (±30 seconds)
3. **Maintain existing seek bar** alongside new skip buttons
4. **Update control layout** to accommodate additional buttons
5. **Ensure proper spacing** and touch targets for all controls

### Navigation Changes Required
1. **Add new Bluetooth section** to main navigation array
2. **Update Settings component** to remove Bluetooth submenu
3. **Create full-screen Bluetooth component** (can reuse existing Bluetooth settings content)
4. **Update routing logic** to handle new Bluetooth section
5. **Modify sidebar component** to include 9th navigation item

### Media Player Enhancements
1. **Implement options overlay** triggered by bottom-right button
2. **Design overlay UI** with additional controls (like, shuffle, repeat, volume, etc.)
3. **Add overlay state management** for show/hide behavior
4. **Ensure proper overlay positioning** and visual hierarchy
5. **Add real-time mode switching** based on track duration

### Layout Considerations
1. **Bluetooth full-screen layout** should utilize improved spacing and visual hierarchy
2. **Maintain responsive behavior** for different content types and modes
3. **Preserve existing scroll performance** while allowing for future grid layout improvements
4. **Consider animation transitions** between navigation sections and media modes

---

## Mode-Specific Behaviors

### Song Mode (≤ 15 minutes)
- **Layout**: Album art emphasis, standard music metadata
- **Controls**: Full control set with emphasis on track navigation
- **Display**: Artist, Album, Track title hierarchy
- **Skip Controls**: 30-second skips available but less prominent

### Podcast Mode (> 15 minutes)
- **Layout**: Episode/chapter emphasis, podcast-specific metadata  
- **Controls**: Skip controls more prominent for content navigation
- **Display**: Podcast name, Episode title, Chapter information
- **Skip Controls**: 30-second skips prominently featured for content scrubbing

---

## Future Considerations

### Adaptive Control Layout
- Controls could adapt further based on content type (music vs podcast vs audiobook)
- Skip intervals could be customizable (15s, 30s, 60s options)
- Mode detection threshold could be user-configurable

### Enhanced Podcast Features
- Chapter navigation for supported content
- Playback speed controls in options overlay
- Sleep timer functionality for long-form content

### Grid Layout Evolution
- Current wireframe shows potential future grid layout improvements
- 6-column album grid could replace current horizontal scrolling in future iterations
- Consider implementing as optional layout mode or density setting

---

**Document Version**: 1.0  
**Created**: 2025-01-05  
**Related Wireframe**: New Wireframe 1.png  
**Status**: Design Specification