import { useState, useEffect, useRef, useCallback } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import FontLoader from "./components/common/FontLoader";
import AuthContainer from "./components/auth/AuthContainer";
import NetworkScreen from "./components/auth/NetworkScreen";
import Home from "./pages/Home";
import ContentView from "./components/content/ContentView";
import DeviceSwitcherModal from "./components/player/DeviceSwitcherModal";
import NetworkPasswordModal from "./components/common/modals/NetworkPasswordModal";
import ConnectorQRModal from "./components/common/modals/ConnectorQRModal";
import SystemUpdateModal from "./components/common/modals/SystemUpdateModal";
import ButtonMappingOverlay from "./components/common/overlays/ButtonMappingOverlay";
import NetworkBanner from "./components/common/overlays/NetworkBanner";
import PowerMenu from "./components/common/overlays/PowerMenu";
import LockScreen from "./components/lockscreen/LockScreen";
import FpsMonitor from "./components/debug/FpsMonitor";
import ConsoleOverlay from "./components/debug/ConsoleOverlay";
import { useNetwork } from "./hooks/useNetwork";
import { DeviceSwitcherContext } from "./hooks/useSpotifyPlayerControls";
import { useBluetooth, useSystemUpdate } from "./hooks/useNocturned";
import { useSpotifyData } from "./hooks/useSpotifyData";
import { usePlaybackProgress } from "./hooks/usePlaybackProgress";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { SettingsProvider } from "./contexts/SettingsContext";
import { ConnectorProvider } from "./contexts/ConnectorContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { PlayerProvider } from "./contexts/PlayerContext";
import React from "react";
import PairingScreen from "./components/auth/PairingScreen";
import { createSpotifyUri, getSpotifyUriTypes } from "./utils/spotifyUtils";
import ColorTransitionTester from "./components/test/ColorTransitionTester";

export const NetworkContext = React.createContext({
  selectedNetwork: null,
  setSelectedNetwork: () => { },
});

export const ConnectorContext = React.createContext({
  showConnectorModal: false,
  setShowConnectorModal: () => { },
});

function useGlobalButtonMapping({
  accessToken,
  isAuthenticated,
  playTrack,
  refreshPlaybackState,
  setActiveSection,
}) {
  const [showMappingOverlay, setShowMappingOverlay] = useState(false);
  const [activeButton, setActiveButton] = useState(null);
  const [isProcessingButtonPress, setIsProcessingButtonPress] = useState(false);
  const ignoreNextReleaseRef = useRef(false);

  const handleButtonPress = useCallback(
    async (buttonNumber) => {
      if (
        !accessToken ||
        !isAuthenticated ||
        isProcessingButtonPress
      )
        return;

      const mappedId = localStorage.getItem(`button${buttonNumber}Id`);
      const mappedType = localStorage.getItem(`button${buttonNumber}Type`);

      if (!mappedId || !mappedType) return;

      setIsProcessingButtonPress(true);
      setActiveButton(buttonNumber);
      setShowMappingOverlay(true);

      let contextUri = null;
      let uris = null;

      const { ALBUM, PLAYLIST, ARTIST, SHOW, EPISODE } = getSpotifyUriTypes();
      
      try {
        if (mappedType === "album") {
          contextUri = createSpotifyUri(ALBUM, mappedId);
        } else if (mappedType === "playlist") {
          contextUri = createSpotifyUri(PLAYLIST, mappedId);
        } else if (mappedType === "artist") {
          const response = await fetch(
            `https://api.spotify.com/v1/artists/${mappedId}/top-tracks?market=from_token`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            if (data.tracks && data.tracks.length > 0) {
              uris = data.tracks.map((track) => track.uri);
            }
          } else {
            contextUri = createSpotifyUri(ARTIST, mappedId);
          }
        } else if (mappedType === "show") {
          const response = await fetch(
            `https://api.spotify.com/v1/shows/${mappedId}/episodes?limit=50`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            if (data.items && data.items.length > 0) {
              const lastPlayedEpisodeId = localStorage.getItem(`lastPlayedEpisode_${mappedId}`);
              let targetEpisodeIndex = 0;
              
              if (lastPlayedEpisodeId) {
                const foundIndex = data.items.findIndex(ep => ep.id === lastPlayedEpisodeId);
                if (foundIndex !== -1) {
                  targetEpisodeIndex = foundIndex;
                }
              }
              
              contextUri = createSpotifyUri(SHOW, mappedId);
              uris = [createSpotifyUri(EPISODE, data.items[targetEpisodeIndex].id)];
            }
          } else {
            contextUri = createSpotifyUri(SHOW, mappedId);
          }
        } else if (mappedType === "mix") {
          const mixTracksJson = localStorage.getItem(
            `button${buttonNumber}Tracks`
          );
          if (mixTracksJson) {
            try {
              const mixTracks = JSON.parse(mixTracksJson);
              uris = mixTracks;
              localStorage.setItem("currentPlayingMixId", mappedId);
            } catch (e) {
              console.error("Error parsing mix tracks:", e);
            }
          }
        } else if (mappedType === "liked-songs") {
          const likedTracksJson = localStorage.getItem(
            `button${buttonNumber}Tracks`
          );
          if (likedTracksJson) {
            try {
              const likedTracks = JSON.parse(likedTracksJson);
              uris = likedTracks;
              localStorage.setItem("playingLikedSongs", "true");
            } catch (e) {
              console.error("Error parsing liked tracks:", e);

              const response = await fetch(
                "https://api.spotify.com/v1/me/tracks?limit=50",
                {
                  headers: {
                    Authorization: `Bearer ${accessToken}`,
                  },
                }
              );

              if (response.ok) {
                const data = await response.json();
                if (data.items && data.items.length > 0) {
                  uris = data.items.map((item) => item.track.uri);
                  localStorage.setItem("playingLikedSongs", "true");
                }
              }
            }
          } else {
            const response = await fetch(
              "https://api.spotify.com/v1/me/tracks?limit=50",
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              }
            );

            if (response.ok) {
              const data = await response.json();
              if (data.items && data.items.length > 0) {
                uris = data.items.map((item) => item.track.uri);
                localStorage.setItem("playingLikedSongs", "true");
              }
            }
          }
        }

        let success = false;
        if (contextUri) {
          success = await playTrack(null, contextUri);
        } else if (uris && uris.length > 0) {
          success = await playTrack(null, null, uris);
        }

        if (success) {
          setTimeout(() => {
            refreshPlaybackState();
            setActiveSection("media");
          }, 500);
        }

        setTimeout(() => {
          setShowMappingOverlay(false);
          setActiveButton(null);
          setIsProcessingButtonPress(false);
        }, 1500);
      } catch (error) {
        console.error("Error playing mapped content:", error);
        setShowMappingOverlay(false);
        setActiveButton(null);
        setIsProcessingButtonPress(false);
      }
    },
    [
      accessToken,
      isAuthenticated,
      playTrack,
      refreshPlaybackState,
      setActiveSection,
      isProcessingButtonPress,
    ]
  );

  useEffect(() => {
    if (!isAuthenticated) return;

    const handleKeyDown = (e) => {
      const validButtons = ["1"]; // Only button 1 for Spotify mapping, others are for overlays
      const buttonNumber = e.key;

      if (!validButtons.includes(buttonNumber)) return;
      e.preventDefault();
    };

    const handleKeyUp = (e) => {
      const validButtons = ["1"]; // Only button 1 for Spotify mapping, others are for overlays
      const buttonNumber = e.key;

      if (!validButtons.includes(buttonNumber)) return;

      if (ignoreNextReleaseRef.current) {
        ignoreNextReleaseRef.current = false;
        return;
      }

      handleButtonPress(buttonNumber);
      e.preventDefault();
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    window.addEventListener("keyup", handleKeyUp, { capture: true });

    return () => {
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
      window.removeEventListener("keyup", handleKeyUp, { capture: true });
    };
  }, [isAuthenticated, handleButtonPress]);

  const setIgnoreNextRelease = useCallback(() => {
    ignoreNextReleaseRef.current = true;
  }, []);

  return {
    showMappingOverlay,
    activeButton,
    setIgnoreNextRelease,
  };
}

function App() {
  console.log('📱 APP: Component rendering');
  const [activeSection, setActiveSection] = useState("media");
  
  // Add logging wrapper for setActiveSection
  const setActiveSectionWithLogging = useCallback((newSection) => {
    console.log('🧭 NAVIGATION:', {
      to: newSection,
      timestamp: new Date().toISOString(),
      caller: new Error().stack.split('\n')[2] || 'unknown'
    });
    setActiveSection(newSection);
  }, []);
  const [viewingContent, setViewingContent] = useState(null);
  const [contentSourceSection, setContentSourceSection] = useState(null);
  const [isDeviceSwitcherOpen, setIsDeviceSwitcherOpen] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState(null);
  const [showConnectorModal, setShowConnectorModal] = useState(false);
  const [showPowerMenu, setShowPowerMenu] = useState(false);
  const [showLockScreen, setShowLockScreen] = useState(false);
  const [playbackIntentOnDeviceSwitch, setPlaybackIntentOnDeviceSwitch] = useState(null);
  const [mKeyPressStart, setMKeyPressStart] = useState(null);
  const [showFpsMonitor, setShowFpsMonitor] = useState(false);
  const [showConsoleOverlay, setShowConsoleOverlay] = useState(false);
  const [showColorTransitionTester, setShowColorTransitionTester] = useState(false);
  const longPressTimeoutRef = useRef(null);


  useEffect(() => {
    fetch('http://localhost:5000/device/resetcounter', {
      method: 'POST',
    }).catch(error => {
      console.error('Error resetting boot counter:', error);
    });
  }, []);

  // Screenshot function (key 5)
  const takeScreenshot = useCallback(() => {
    fetch('http://localhost:5000/device/screenshot', {
      method: 'POST',
    }).then(response => {
      if (response.ok) {
        console.log('Screenshot taken successfully');
      } else {
        console.error('Failed to take screenshot');
      }
    }).catch(error => {
      console.error('Error taking screenshot:', error);
    });
  }, []);

  // Use centralized keyboard shortcuts hook
  useKeyboardShortcuts({
    onPowerMenuShow: setShowPowerMenu,
    onLockScreenShow: setShowLockScreen,
    onFpsToggle: () => setShowFpsMonitor(prev => !prev),
    onConsoleToggle: () => setShowConsoleOverlay(prev => !prev),
    onColorTransitionTesterToggle: () => setShowColorTransitionTester(prev => !prev),
    onScreenshot: takeScreenshot,
    showPowerMenu,
    showLockScreen
  });

  const {
    isAuthenticated,
    accessToken,
    authIsLoading,
    currentPlayback,
    currentlyPlayingAlbum,
    albumChangeEvent,
    playerIsLoading,
    playerError,
    refreshPlaybackState,
    playerControls,
    recentAlbums,
    userPlaylists,
    topArtists,
    likedSongs,
    radioMixes,
    userShows,
    initialDataLoaded,
    isLoading,
    errors: dataErrors,
    refreshData,
  } = useSpotifyData(activeSection);

  const {
    isConnected: isInternetConnected,
    showNetworkBanner,
    initialCheckDone,
    initialConnectionFailed,
    hasEverConnectedThisSession,
  } = useNetwork();

  const {
    pairingRequest,
    isConnecting,
    showTetheringScreen,
    lastConnectedDevice,
    acceptPairing,
    denyPairing,
    setDiscoverable,
    disconnectDevice,
    enableNetworking,
    stopRetrying,
  } = useBluetooth();

  const { updateStatus, progress, isUpdating, isError, errorMessage } =
    useSystemUpdate();

  const playbackProgress = usePlaybackProgress(currentPlayback, refreshPlaybackState, accessToken);

  const {
    showMappingOverlay: showGlobalMappingOverlay,
    activeButton: globalActiveButton,
    setIgnoreNextRelease,
  } = useGlobalButtonMapping({
    accessToken,
    isAuthenticated,
    playTrack: playerControls.playTrack,
    refreshPlaybackState,
    setActiveSection: setActiveSectionWithLogging,
  });

  const handleOpenDeviceSwitcher = (playbackIntent = null) => {
    if (playbackIntent) {
      setPlaybackIntentOnDeviceSwitch(playbackIntent);
    }
    setIsDeviceSwitcherOpen(true);
  };

  const handleCloseDeviceSwitcher = (selectedDeviceId = null) => {
    setIsDeviceSwitcherOpen(false);
    if (selectedDeviceId && playbackIntentOnDeviceSwitch) {
      const { trackUriToPlay, contextUriToPlay, urisToPlay } = playbackIntentOnDeviceSwitch;
      (async () => {
        let success = false;
        if (contextUriToPlay) {
          success = await playerControls.playTrack(trackUriToPlay, contextUriToPlay, null, selectedDeviceId);
        } else if (urisToPlay && urisToPlay.length > 0) {
          success = await playerControls.playTrack(null, null, urisToPlay, selectedDeviceId);
        } else if (trackUriToPlay) {
          success = await playerControls.playTrack(trackUriToPlay, null, null, selectedDeviceId);
        }

        if (success) {
          setTimeout(() => {
            refreshPlaybackState();
            setActiveSectionWithLogging("media");
          }, 1500);
        }
        setPlaybackIntentOnDeviceSwitch(null);
      })();
    } else {
      setPlaybackIntentOnDeviceSwitch(null);
    }
  };

  const deviceSwitcherContextValue = {
    openDeviceSwitcher: handleOpenDeviceSwitcher,
  };

  const handleNetworkClose = () => {
    setSelectedNetwork(null);
  };

  const networkContextValue = {
    selectedNetwork,
    setSelectedNetwork,
  };

  const connectorContextValue = {
    showConnectorModal,
    setShowConnectorModal,
  };

  useEffect(() => {
    if (isAuthenticated) {
      const handleNetworkRestored = () => {
        refreshPlaybackState(true);
      };
      window.addEventListener("online", handleNetworkRestored);
      return () => {
        window.removeEventListener("online", handleNetworkRestored);
      };
    }
  }, [isAuthenticated, refreshPlaybackState]);

  // Removed: useEffect that was forcing section to media on every render

  // Handle lock screen activation
  useEffect(() => {
    if (activeSection === 'lockscreen') {
      setShowLockScreen(true);
    }
  }, [activeSection]);

  useEffect(() => {
    if (lastConnectedDevice && isInternetConnected) {
      setDiscoverable(false);
    } else {
      setDiscoverable(true);
    }
  }, [lastConnectedDevice, isInternetConnected, setDiscoverable]);

  useEffect(() => {
    if (showTetheringScreen) {
      enableNetworking();
    }
  }, [showTetheringScreen, enableNetworking]);

  const handleAuthSuccess = () => {
    const storedAccessToken = localStorage.getItem("spotifyAccessToken");
    const storedRefreshToken = localStorage.getItem("spotifyRefreshToken");
    const storedExpiry = localStorage.getItem("spotifyTokenExpiry");
    const isTokenValid = storedExpiry && new Date(storedExpiry) > new Date();

    if (storedAccessToken && storedRefreshToken && isTokenValid) {
      if (initialDataLoaded) {
        console.log("Refreshing data after auth success");
        refreshData();
      } else {
        console.log("Skipping refresh - letting initial data load handle the fetch");
      }
    } else {
      console.warn("No valid tokens found after auth success");
    }
  };


  const handleOpenContent = (id, type) => {
    setContentSourceSection(activeSection);
    setViewingContent({ id, type });
    if (type === "artist") {
      setActiveSectionWithLogging("artists");
    } else if (type === "album") {
      setActiveSectionWithLogging("recents");
    }
  };

  const handleNavigateToArtistFromMedia = (artistId, contentType) => {
    setContentSourceSection("media");
    setViewingContent({ id: artistId, type: contentType });
    setActiveSectionWithLogging("artists");
  };

  const handleNavigateToAlbumFromMedia = (albumId, contentType) => {
    setContentSourceSection("media");
    setViewingContent({ id: albumId, type: contentType });
    setActiveSectionWithLogging("recents");
  };

  const handleCloseContent = () => {
    const source = contentSourceSection;
    setViewingContent(null);
    setContentSourceSection(null);

    if (source) {
      setActiveSectionWithLogging(source);
    }
  };

  const handleNavigateToMedia = () => {
    setViewingContent(null);
    setActiveSectionWithLogging("media");
  };

  const handleNavigateToArtist = (id, type) => {
    setViewingContent({ id, type });
    setActiveSectionWithLogging("artists");
  };

  const handleNetworkCancel = () => {
    if (lastConnectedDevice) {
      disconnectDevice(lastConnectedDevice.address);
    }
  };

  const isFlashing = isUpdating && updateStatus.stage === "flash";

  // With Bluetooth-only setup, we don't need internet connectivity for core functionality
  const showConnectionLostScreen = false;

  // Minimize network banner since Bluetooth functionality doesn't require internet
  const displayNetworkBanner = false;

  let content;
  if (showConnectionLostScreen) {
    content = <NetworkScreen isConnectionLost={true} deviceName={lastConnectedDevice?.name} />;
  } else if (false && !isAuthenticated && initialCheckDone) {
    // Spotify auth disabled - all functionality handled via Android companion app
    content = <AuthContainer onAuthSuccess={handleAuthSuccess} />;
  } else if (viewingContent) {
    content = (
      <ContentView
        accessToken={accessToken}
        contentId={viewingContent.id}
        contentType={viewingContent.type}
        onClose={handleCloseContent}
        onNavigateToNowPlaying={handleNavigateToMedia}
        currentlyPlayingTrackUri={currentPlayback?.item?.uri}
        currentPlayback={currentPlayback}
        radioMixes={radioMixes}
        setIgnoreNextRelease={setIgnoreNextRelease}
        playbackProgress={playbackProgress}
        refreshPlaybackState={refreshPlaybackState}
      />
    );
  } else {
    content = (
      <Home
        accessToken={accessToken}
        activeSection={activeSection}
        setActiveSection={setActiveSectionWithLogging}
        recentAlbums={recentAlbums}
        userPlaylists={userPlaylists}
        topArtists={topArtists}
        likedSongs={likedSongs}
        radioMixes={radioMixes}
        userShows={userShows}
        isLoading={isLoading}
        refreshData={refreshData}
        refreshPlaybackState={refreshPlaybackState}
        onOpenContent={handleOpenContent}
        onOpenDeviceSwitcher={handleOpenDeviceSwitcher}
      />
    );
  }

  return (
    <ThemeProvider>
      <PlayerProvider
        currentPlayback={currentPlayback}
        currentlyPlayingAlbum={currentlyPlayingAlbum}
        playerControls={playerControls}
        playbackProgress={playbackProgress}
      >
        <ConnectorProvider>
          <SettingsProvider>
            <DeviceSwitcherContext.Provider value={deviceSwitcherContextValue}>
              <NetworkContext.Provider value={networkContextValue}>
                <ConnectorContext.Provider value={connectorContextValue}>
                  <Router>
                    <FontLoader />
                    <main
                      className="overflow-hidden relative min-h-screen rounded-2xl"
                      style={{
                        fontFamily: `var(--font-inter), var(--font-noto-sans-sc), var(--font-noto-sans-tc), var(--font-noto-serif-jp), var(--font-noto-sans-kr), var(--font-noto-naskh-ar), var(--font-noto-sans-bn), var(--font-noto-sans-dv), var(--font-noto-sans-he), var(--font-noto-sans-ta), var(--font-noto-sans-th), var(--font-noto-sans-gk), system-ui, sans-serif`,
                        fontOpticalSizing: "auto",
                      }}
                    >
                      <div className="relative z-10">
                        {showLockScreen ? (
                          <div className="fadeIn-animation">
                            <LockScreen 
                              onUnlock={() => {
                                setShowLockScreen(false);
                                setActiveSectionWithLogging('media'); // Return to media after unlock
                              }}
                            />
                          </div>
                        ) : (
                          <div className="fadeIn-animation">
                            {content}
                          </div>
                        )}
                      </div>
                    </main>
                  </Router>
                </ConnectorContext.Provider>
              </NetworkContext.Provider>
            </DeviceSwitcherContext.Provider>
          </SettingsProvider>
        </ConnectorProvider>
      </PlayerProvider>
    </ThemeProvider>
  );
}

export default App;
