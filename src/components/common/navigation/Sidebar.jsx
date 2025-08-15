import {
  NowPlayingIcon,
  RecentsIcon,
  LibraryIcon,
  ArtistsIcon,
  RadioIcon,
  PodcastIcon,
  SettingsIcon,
  BluetoothIcon,
  LockIcon,
  ClockIcon,
  SunIcon,
} from "../../common/icons";
import StatusBar from "./StatusBar";
import { useSettings } from "../../../contexts/SettingsContext";

export default function Sidebar({ activeSection, setActiveSection }) {
  const { settings } = useSettings();

  const handleSectionClick = (section) => {
    setActiveSection(section);
  };

  const SidebarItem = ({ section, icon: Icon, label }) => (
    <div
      className="relative flex items-center group transition-gentle hover:scale-102"
      onClick={() => handleSectionClick(section)}
    >
      {activeSection === section && (
        <div
          className="absolute left-[-19px] top-1/2 transform -translate-y-1/2 h-8 w-1.5 bg-white rounded-full drop-shadow-[0_8px_5px_rgba(0,0,0,0.25)] slideIn-animation"
          aria-hidden="true"
        />
      )}
      <div className="mr-4 flex-shrink-0">
        <div className={`h-[70px] w-[70px] rounded-[12px] flex items-center justify-center border border-white/10 drop-shadow-[0_20px_5px_rgba(0,0,0,0.25)] transition-gentle ${
          activeSection === section 
            ? 'bg-white/35' 
            : 'bg-white/25 hover:bg-white/30'
        }`}>
          <Icon className={`h-10 w-10 transition-gentle ${
            activeSection === section ? 'text-white' : 'text-white/80 hover:text-white'
          }`} />
        </div>
      </div>
      <div>
        <h4 className={`ml-1 text-[32px] font-[580] tracking-tight transition-gentle ${
          activeSection === section ? 'text-white' : 'text-white/80 hover:text-white'
        }`}>
          {label}
        </h4>
      </div>
    </div>
  );

  return (
    <div className="space-y-7 pt-12">
      {settings.showStatusBar && <StatusBar />}

      <SidebarItem section="media" icon={NowPlayingIcon} label="Media" />
      <SidebarItem section="recents" icon={RecentsIcon} label="Recents" />
      <SidebarItem section="library" icon={LibraryIcon} label="Library" />
      <SidebarItem section="artists" icon={ArtistsIcon} label="Artists" />
      <SidebarItem section="albumart" icon={LibraryIcon} label="Album Art" />
      <SidebarItem section="radio" icon={RadioIcon} label="Radio" />
      <SidebarItem section="podcasts" icon={PodcastIcon} label="Podcasts" />
      <SidebarItem section="weather" icon={SunIcon} label="Weather" />
      <SidebarItem section="lockscreen" icon={LockIcon} label="Lock Screen" />
      <SidebarItem section="timesync" icon={ClockIcon} label="Time Sync" />
      <SidebarItem section="settings" icon={SettingsIcon} label="Settings" />
      <SidebarItem section="bluetooth" icon={BluetoothIcon} label="Bluetooth" />
      <SidebarItem section="test" icon={SettingsIcon} label="Test" />
    </div>
  );
}
