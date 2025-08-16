import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  SettingsCreditsIcon,
  SettingsGeneralIcon,
  SettingsPlaybackIcon,
  SettingsSupportIcon,
} from "../common/icons";
import { useSettings } from "../../contexts/SettingsContext";
import SettingsToggleItem from "./SettingsToggleItem";
import SettingsActionItem from "./SettingsActionItem";
import SettingsSponsorsList from "./SettingsSponsorsList";

const settingsStructure = {
  general: {
    title: "General",
    icon: SettingsGeneralIcon,
    items: [
      {
        id: "start-with-now-playing",
        title: "Start with Now Playing",
        type: "toggle",
        description:
          "When enabled, the app will open directly to Now Playing instead of Recents when you start it.",
        storageKey: "startWithNowPlaying",
        defaultValue: false,
      },
    ],
  },
  playback: {
    title: "Playback",
    icon: SettingsPlaybackIcon,
    items: [
      {
        id: "show-lyrics-gesture",
        title: "Swipe to Show Lyrics",
        type: "toggle",
        description:
          "Enable swiping up on the track info to show the lyrics of a song.",
        storageKey: "showLyricsGestureEnabled",
        defaultValue: false,
      },
    ],
  },
  support: {
    title: "Support Nocturne",
    icon: SettingsSupportIcon,
  },
  credits: {
    title: "Credits",
    icon: SettingsCreditsIcon,
    type: "custom",
    items: [
      {
        id: "developers",
        title: "Developers",
        type: "sponsors",
        names: ["Brandon Saldan", "bbaovanc", "Dominic Frye", "shadow"],
      },
      {
        id: "contributors",
        title: "Contributors",
        type: "sponsors",
        names: ["angelolz", "EllEation", "Jenner Gray", "vakst", "álvaro s", "Justin Reynard"],
      },
      {
        id: "sponsors",
        title: "Sponsors",
        type: "sponsors",
        names: [
          "Daniel Smith",
          "Logan",
          "paulcity",
          "Vladdy",
          "Nathan",
          "SeveralZombies",
          "DeepfakeKittens",
          "Jenner Gray",
          "Jesse A Kantor",
          "Josef Halcomb",
          "MaydaySilly",
          "SeanCMNJ",
          "tasteeohs",
          "BlackFlag",
          "Bomb",
          "Fernando Díaz González",
          "h2k",
          "smugdog",
          "Tanner",
          "Thomas",
          "Vonnieboo from ff.net",
          "13EnbiesInATrenchcoat",
          "@lukwstkn",
          "Begouin",
          "Bestestdev",
          "bompo312",
          "Christopher Cartwright",
          "ClovisBae from reddit",
          "D4137",
          "DanL",
          "Devcrowley",
          "discord: @terbro#9956",
          "Drevmeister-Fresh",
          "Dustin",
          "Ethan Pruitt",
          "Exx-on",
          "Garrett Webb",
          "Gerald Lesnak II",
          "Hyrule Villager",
          "Jaime Sánchez",
          "Jeff Reiner",
          "Madison Hallowell",
          "Morgan",
          "nguyenkvvn",
          "Pablo Portilla",
          "Reuben Lo",
          "Robert Max Womack",
          "Sergio Navarro",
          "SK",
          "Tóthmárton Ákos",
          "timothy chilinski",
          "Tyri J Smith",
          "Vasiliy Uchanev",
          "Xavier Garza",
          "23r01nf1n17y",
          "Alfonso Morales",
          "Archmeyvn",
          "Austyn Tjulander",
          "Awston Roden",
          "@cackhanded",
          "Cameron Williams",
          "Cody Rees",
          "Cowsaysmoo",
          "Creeper_798",
          "CyberDruid",
          "Dave",
          "Garry Hendry",
          "Greg Solis",
          "itsamanpret",
          "Jackson Lopata",
          "James Augustine",
          "Jesse Lopez",
          "jxding",
          "Krypthos",
          "Matthew McPheeters",
          "mattisvensson ",
          "Mids",
          "mobius_j",
          "Murdrous",
          "Navi",
          "rerunx5 (Alex)",
          "scornwell",
          "Slackticus",
          "Tempo",
          "Thaddeus Nagy",
          "uktexan",
          "Yungguap",
          "1Vortex",
          "_0.0.1_",
          "abd_uhh",
          "Abid Rasheed",
          "Adam",
          "Adam",
          "Adam Duda",
          "Adam Kunic",
          "acousticjacob",
          "Akhad Alimov",
          "Akshith Gunasekaran",
          "Alan A",
          "Alexander Black",
          "Alex Haseler",
          "Ali Khodr-Ali",
          "AlxLve",
          "Alzitra",
          "Andrew",
          "Andrew J. Pafitis",
          "Andrew Pratt",
          "Angelolz",
          "AnxietyPlus",
          "Anthony E Mason",
          "Anthony Petrella",
          "Arturo Hernandez",
          "Aug#5404",
          "Austin Heiss",
          "automathematics",
          "Barrett Belanger",
          "barnabas_lsq",
          "BASTIAAN WILLEM DE VRIES",
          "Benjamin Menendez",
          "Brandon Fawcett",
          "Brian Humensky",
          "@bubbleofvelvet",
          "BudGillett",
          "Canaan.0",
          "Canyon",
          "Cameron Hyde",
          "Carter Juckes",
          "Casper Bruning",
          "Cbb",
          "Charlie Vince-Crowhurst",
          "Chatito0s",
          "Checked Me",
          "CheezborgorSanwitch",
          "Christian Klit",
          "Christopher",
          "Christopher Swenson",
          "Cian",
          "CircuitFox",
          "Clark Hager",
          "codex (dartmouthcollege)",
          "Cole Conrad",
          "Colleen Smith",
          "Colin R.",
          "Connor George",
          "Cooper Johnson",
          "Corks & Controllers",
          "cosmicfoureyes",
          "crakerjac",
          "Daniel R",
          "Dan Segal",
          "David Bastos",
          "David Ellis",
          "DC",
          "ddooee",
          "DeanGulBairy",
          "Derek Patterson",
          "dhhh0729",
          "discord: @cereal2",
          "discord: @Forgetful19#8608",
          "discord: @ry_az",
          "Dom",
          "Dominic Tesch",
          "Doosed",
          "Dylan",
          "@efrondeur",
          "Elijah Segers",
          "Eliel Viseman",
          "ElGibbay",
          "ellie!",
          "entropyofdesire",
          "Erbay",
          "Eric Karnes",
          "eschar_heron on discord",
          "Ethan Proia",
          "Evan Garaizar",
          "Fifthman",
          "Franking4",
          "Freesnöw",
          "GenerlAce",
          "Gerardo Ulloa",
          "@gjcodes",
          "gooby",
          "Grayson WendtGeisler",
          "gumbum3",
          "Hannah Walters",
          "HarpMudd",
          "harry",
          "I E J HERON",
          "insane ",
          "ISAAC J NORTON",
          "JaCrispy",
          "Jackson Davis",
          "Jack Murphy",
          "Jack Schaeffer",
          "Jacob Winn",
          "jagger cardenas",
          "Jaime Gabriel",
          "Jake Laster",
          "Jake S",
          "Jason Lee",
          "Jasperjaks",
          "Jayden",
          "Jeremie Boudreau",
          "Jeremy Tavener",
          "Jesus Pena",
          "jiddahidda",
          "JOEL PASCAL MEYER",
          "Joe",
          "Joe Gerard",
          "John Byrd",
          "John Karoul",
          "John M Nerney",
          "Jonah Philippon",
          "Jonathan Irwin",
          "Jonathan Xayabanha",
          "Joseph P Aguirre",
          "Joshua Dixon",
          "Joshua Villalta",
          "@jrosser04",
          "Julian Bill",
          "Julian Gonzales",
          "Julian Tokarev",
          "justin473011",
          "Justin Rogers",
          "K. Colin Pinegar",
          "Kaden",
          "karltonmarx",
          "Kelsie",
          "Kevin Lara",
          "Kiguy2052",
          "Korey Sawdey",
          "Kropka",
          "Kyle Knowles",
          "Liam Winters",
          "@lillyyagirl",
          "Linus Fraley",
          "@lordofstick_",
          "Louie2Lit",
          "Louis Pietruszewski",
          "Lucas Templin",
          "Luis Dominguez",
          "Luis Garcia",
          "MANDEEP SINGH AL GURDIP SINGH",
          "marcel",
          "Mark Councell",
          "Matt McKillen",
          "Matthew r Urso",
          "Maxb0tbeep",
          "MC",
          "Michael Dayah",
          "Michael Seltzer",
          "Michelle Joudrey",
          "Midnight Wolf",
          "Miguel Martinez",
          "Miguel Martinez",
          "Moaath",
          "mord1991",
          "MrPickles01",
          "N8",
          "Naga",
          "Narp",
          "@nelson8403",
          "Nicholas Gelone",
          "Nicholas Warner",
          "Nickolas Schuessler",
          "nightsleep",
          "Nohryzon",
          "nono9k",
          "Ole Noetzel",
          "ON4BCY",
          "owen",
          "parrot#2507",
          "Patrick Bowden",
          "patrickjmcd",
          "Paul Herron",
          "PeterPig",
          "Phillip Deguzman",
          "@pineappleundies",
          "Pink",
          "Piotr Laczynski",
          "pocketfish",
          "Random Weeb",
          "Renato Oliveira",
          "Rob",
          "roddiemod",
          "Rodrigo Manzano-Baltazar",
          "runaway254",
          "Sam Jakub",
          "Sara Beattie",
          "@SgtAngel777",
          "Sean Blair",
          "Sean Decker",
          "Sean Kearney",
          "seoulcialite",
          "sergiok9505",
          "SezyKnight",
          "Sheel Patel",
          "silv3rsid3up",
          "Skatelivelearn",
          "sneese",
          "Softbroed",
          "SolitaryHyena",
          "Stanley Manalansan",
          "Steven Snoke",
          "sunlime",
          "Taylor",
          "tb",
          "TechGeek01",
          "therage1367 (discord)",
          "@theflopytaco",
          "Thomas",
          "Timothy Membrino",
          "titto.",
          "tokkipan",
          "Tong Kai Ming",
          "Travis Stoia",
          "@tricxtr",
          "Ubaldo Rodriguez",
          "Ulises",
          "VeggiEgg",
          "VectorGlitch",
          "Vivyy",
          "Vladimir Akst",
          "Vladimir Stepakhin",
          "walnka",
          "wally",
          "Wazzup",
          "whathebuddha",
          "whizkid98",
          "Wicr",
          "Will Baxter",
          "William Bjorvik",
          "xb",
          "xxgreeninkxx",
          "yayamori",
          "Zackary Mong",
          "Zak",
          "Zimworf",
          "ZonkDE",
          "鐘宏亮",
        ],
      },
    ],
  },
};

export default function Settings({
  accessToken,
  onOpenDonationModal,
  setActiveSection,
}) {
  const navigate = useNavigate();
  const [activeParent, setActiveParent] = useState(null);
  const [activeSubItem, setActiveSubItem] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const shouldExitToRecents = useRef(false);
  const isProcessingEscape = useRef(false);
  const scrollContainerRef = useRef(null);
  const { settings, updateSetting } = useSettings();

  const [showMain, setShowMain] = useState(true);
  const [showParent, setShowParent] = useState(false);
  const [showSubpage, setShowSubpage] = useState(false);

  const [mainClasses, setMainClasses] = useState("translate-x-0 opacity-100");
  const [parentClasses, setParentClasses] = useState(
    "translate-x-full opacity-0"
  );
  const [subpageClasses, setSubpageClasses] = useState(
    "translate-x-full opacity-0"
  );

  const ANIMATION_DURATION = 300;

  useEffect(() => {
    scrollContainerRef.current = document.querySelector(
      ".settings-scroll-container"
    );
  }, []);


  const handleToggle = (key) => {
    updateSetting(key, !settings[key]);
  };


  const handleAction = (action) => {
    switch (action) {
      case "openDonation":
        onOpenDonationModal();
        break;
    }
  };

  const navigateTo = (page, subItem = null) => {
    if (isAnimating) return;
    setIsAnimating(true);
    shouldExitToRecents.current = false;

    if (showMain) {
      setMainClasses("-translate-x-full opacity-0");
      setParentClasses("translate-x-0 opacity-100");
      setActiveParent(page);

      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = 0;
        }
      }, ANIMATION_DURATION / 3);

      setTimeout(() => {
        setShowMain(false);
        setShowParent(true);
        setIsAnimating(false);

        if (subItem) {
          setTimeout(() => {
            navigateTo(page, subItem);
          }, 50);
        }
      }, ANIMATION_DURATION);
    } else if (showParent && subItem) {
      setParentClasses("-translate-x-full opacity-0");
      setSubpageClasses("translate-x-0 opacity-100");
      setActiveSubItem(subItem);

      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = 0;
        }
      }, ANIMATION_DURATION / 3);

      setTimeout(() => {
        setShowParent(false);
        setShowSubpage(true);
        setIsAnimating(false);
      }, ANIMATION_DURATION);
    }
  };

  const navigateBack = () => {
    if (isAnimating) return;
    setIsAnimating(true);

    if (showSubpage) {
      setSubpageClasses("translate-x-full opacity-0");
      setParentClasses("translate-x-0 opacity-100");

      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = 0;
        }
      }, ANIMATION_DURATION / 3);

      setTimeout(() => {
        setShowSubpage(false);
        setShowParent(true);
        setActiveSubItem(null);
        setIsAnimating(false);
      }, ANIMATION_DURATION);
    } else if (showParent) {
      setParentClasses("translate-x-full opacity-0");
      setMainClasses("translate-x-0 opacity-100");

      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = 0;
        }
      }, ANIMATION_DURATION / 3);

      setTimeout(() => {
        setShowParent(false);
        setShowMain(true);
        setActiveParent(null);
        setIsAnimating(false);
      }, ANIMATION_DURATION);
    }
  };

  const renderSettingItem = (item) => {
    if (item.subpage) {
      const SubpageComponent = item.subpage.component;
      return <SubpageComponent key={item.id} />;
    }

    switch (item.type) {
      case "toggle":
        return (
          <SettingsToggleItem
            key={item.id}
            item={item}
            value={settings[item.storageKey]}
            onChange={() => handleToggle(item.storageKey)}
          />
        );
      case "action":
        return (
          <SettingsActionItem
            key={item.id}
            item={item}
            onAction={handleAction}
          />
        );
      case "sponsors":
        return (
          <SettingsSponsorsList
            key={item.id}
            item={item}
          />
        );
      default:
        return null;
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isAnimating) return;
      
      if (e.key === "Escape") {
        if (showSubpage) {
          navigateBack();
        } else if (showParent) {
          navigateBack();
        } else {
          shouldExitToRecents.current = true;
          setActiveSection("recents");
        }

        setTimeout(() => {
          setIsAnimating(false);
        }, ANIMATION_DURATION);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isAnimating, showSubpage, showParent, setActiveSection]);

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden settings-scroll-container" style={{ touchAction: "pan-y", overflowX: "hidden" }}>
      <style>{`
        .screen-transition {
          transition: transform ${ANIMATION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1),
                      opacity ${ANIMATION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1);
          will-change: transform, opacity;
        }
        .settings-scroll-container::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <div className="min-h-full flex flex-col px-12 pt-12 -ml-12">
        <div className="flex-1 relative">
          <div className="relative w-full" style={{ minHeight: "100%" }}>
            <div
              className={`absolute top-0 left-0 w-full screen-transition ${mainClasses}`}
              style={{
                visibility: showMain || isAnimating ? "visible" : "hidden",
                touchAction: "pan-y",
                overflowX: "hidden",
              }}
            >
              <h2 className="text-[46px] font-[580] text-white tracking-tight mb-6">
                Settings
              </h2>
              <div className="space-y-4 mb-12">
                {Object.entries(settingsStructure).map(([key, section]) => (
                  <button
                    key={key}
                    onClick={() => {
                      if (key === "support") {
                        onOpenDonationModal();
                      } else {
                        navigateTo(key);
                      }
                    }}
                    className="flex items-center justify-between w-full p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-colors border border-white/10 focus:outline-none"
                    disabled={isAnimating}
                  >
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                        <section.icon className="w-7 h-7 text-white" />
                      </div>
                      <span className="text-[32px] ml-4 font-[580] text-white tracking-tight">
                        {section.title}
                      </span>
                    </div>
                    {key !== "support" && (
                      <ChevronRightIcon className="w-8 h-8 text-white/60" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div
              className={`absolute top-0 left-0 w-full screen-transition ${parentClasses}`}
              style={{
                visibility: showParent || isAnimating ? "visible" : "hidden",
                touchAction: "pan-y",
                overflowX: "hidden",
              }}
            >
              <div className="flex items-center mb-4">
                <button
                  onClick={navigateBack}
                  className="mr-4 focus:outline-none"
                  style={{ background: 'none' }}
                  disabled={isAnimating}
                >
                  <ChevronLeftIcon className="w-8 h-8 text-white" />
                </button>
                <h2 className="text-[46px] font-[580] text-white tracking-tight">
                  {activeParent && settingsStructure[activeParent].title}
                </h2>
              </div>
              <div className="space-y-6 mb-12">
                {activeParent &&
                  settingsStructure[activeParent].type === "parent" ? (
                  <div className="space-y-4">
                    {settingsStructure[activeParent].items?.map((subItem) => (
                      <button
                        key={subItem.id}
                        onClick={() => navigateTo(activeParent, subItem)}
                        className="flex items-center justify-between w-full p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-colors border border-white/10 focus:outline-none"
                        disabled={isAnimating}
                      >
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                            <subItem.icon className="w-7 h-7 text-white" />
                          </div>
                          <span className="text-[32px] ml-4 font-[580] text-white tracking-tight">
                            {subItem.title}
                          </span>
                        </div>
                        <ChevronRightIcon className="w-8 h-8 text-white/60" />
                      </button>
                    ))}
                  </div>
                ) : (
                  activeParent &&
                  settingsStructure[activeParent].items?.map((item) =>
                    renderSettingItem(item)
                  )
                )}
              </div>
            </div>

            <div
              className={`absolute top-0 left-0 w-full screen-transition ${subpageClasses}`}
              style={{
                visibility: showSubpage || isAnimating ? "visible" : "hidden",
                touchAction: "pan-y",
                overflowX: "hidden",
              }}
            >
              <div className="flex items-center mb-4">
                <button
                  onClick={navigateBack}
                  className="mr-4 focus:outline-none"
                  style={{ background: 'none'}}
                  disabled={isAnimating}
                >
                  <ChevronLeftIcon className="w-8 h-8 text-white" />
                </button>
                <h2 className="text-[46px] font-[580] text-white tracking-tight">
                  {activeSubItem?.title}
                </h2>
              </div>
              <div className="space-y-6 mb-12">
                {activeSubItem && renderSettingItem(activeSubItem)}
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
