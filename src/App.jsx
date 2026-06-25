import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Admin from './Admin'

const BracketSlot = ({ teamName, flagUrl, variantClass, placeholder }) => {
  return (
    <div className={`team-slot ${variantClass}`}>
    <span>{teamName || placeholder}</span>
    <div className="flag-box">
    {flagUrl && <img src={flagUrl} alt={`${teamName} flag`} />}
    </div>
    </div>
  )
}

export default function App() {
  const [slots, setSlots] = useState({});
  // 1. Initialize the router state
  const [currentRoute, setCurrentRoute] = useState(window.location.hash);

  // 2. Listen for URL changes
  useEffect(() => {
    const handleHashChange = () => setCurrentRoute(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // 3. Fetch data ONLY if we are on the public view
  useEffect(() => {
    if (currentRoute === '#admin') return;

    const fetchBracketData = async () => {
      const { data, error } = await supabase
      .from('bracket_slots')
      .select(`slot_code, ro16_teams (name, flag_url)`);

      if (error) {
        console.error("Error fetching bracket data:", error);
        return;
      }

      const liveBracketMap = {};
      data.forEach(slot => {
        liveBracketMap[slot.slot_code] = slot.ro16_teams ? {
          name: slot.ro16_teams.name,
          flag: slot.ro16_teams.flag_url
        } : null;
      });

      setSlots(liveBracketMap);
    };

    fetchBracketData();
  }, [currentRoute]);

  // 4. ROUTER INTERCEPT: Render the Admin Panel if URL is #admin
  if (currentRoute === '#admin') {
    return <Admin />
  }

  // 5. Default Render: Public Bracket View
  return (
    <>
    <header className="header-container">
    <a href="#admin" className="admin-link-btn">Admin Login</a>
    <h1 className="main-title">BFK FIFA WC 2026</h1>
    <h2 className="sub-title">Knockout Bracket</h2>
    </header>

    <div className="landscape-prompt">
    <div className="prompt-content">
    <span className="rotate-icon">↻</span>
    <h2>Rotate Device</h2>
    <p>Please flip your phone to landscape mode for the best viewing experience.</p>
    </div>
    </div>

    <main className="bracket-board">

    {/* === WHITE PATH (LEFT) === */}
    <section className="bracket-col ro16">
    <div className="matchup">
    <BracketSlot teamName={slots.WA1?.name} flagUrl={slots.WA1?.flag} variantClass="white-slot" placeholder="WA1" />
    <BracketSlot teamName={slots.WA2?.name} flagUrl={slots.WA2?.flag} variantClass="white-slot" placeholder="WA2" />
    </div>
    <div className="matchup">
    <BracketSlot teamName={slots.WB1?.name} flagUrl={slots.WB1?.flag} variantClass="white-slot" placeholder="WB1" />
    <BracketSlot teamName={slots.WB2?.name} flagUrl={slots.WB2?.flag} variantClass="white-slot" placeholder="WB2" />
    </div>
    <div className="matchup">
    <BracketSlot teamName={slots.WC1?.name} flagUrl={slots.WC1?.flag} variantClass="white-slot" placeholder="WC1" />
    <BracketSlot teamName={slots.WC2?.name} flagUrl={slots.WC2?.flag} variantClass="white-slot" placeholder="WC2" />
    </div>
    <div className="matchup">
    <BracketSlot teamName={slots.WD1?.name} flagUrl={slots.WD1?.flag} variantClass="white-slot" placeholder="WD1" />
    <BracketSlot teamName={slots.WD2?.name} flagUrl={slots.WD2?.flag} variantClass="white-slot" placeholder="WD2" />
    </div>
    </section>

    <section className="bracket-col ro8">
    <BracketSlot teamName={slots.WA?.name} flagUrl={slots.WA?.flag} variantClass="white-slot" placeholder="A" />
    <BracketSlot teamName={slots.WB?.name} flagUrl={slots.WB?.flag} variantClass="white-slot" placeholder="B" />
    <BracketSlot teamName={slots.WC?.name} flagUrl={slots.WC?.flag} variantClass="white-slot" placeholder="C" />
    <BracketSlot teamName={slots.WD?.name} flagUrl={slots.WD?.flag} variantClass="white-slot" placeholder="D" />
    </section>

    <section className="bracket-col semis">
    <BracketSlot teamName={slots.WAB?.name} flagUrl={slots.WAB?.flag} variantClass="white-slot" placeholder="AB" />
    <BracketSlot teamName={slots.WCD?.name} flagUrl={slots.WCD?.flag} variantClass="white-slot" placeholder="CD" />
    </section>

    <section className="bracket-col finals">
    <BracketSlot teamName={slots.WF?.name} flagUrl={slots.WF?.flag} variantClass="white-slot" placeholder="W-Final" />
    </section>


    {/* === CENTER PATH (FINALS) === */}
    <section className="center-col">
    <BracketSlot teamName={slots.Winner?.name} flagUrl={slots.Winner?.flag} variantClass="winner-slot" placeholder="Winner" />
    <BracketSlot teamName={slots.RunnerUp?.name} flagUrl={slots.RunnerUp?.flag} variantClass="runner-slot" placeholder="Runner Up" />
    <BracketSlot teamName={slots.ThirdPlace?.name} flagUrl={slots.ThirdPlace?.flag} variantClass="bronze-slot" placeholder="Third Place" />
    </section>


    {/* === BLUE PATH (RIGHT) === */}
    <section className="bracket-col finals">
    <BracketSlot teamName={slots.BF?.name} flagUrl={slots.BF?.flag} variantClass="blue-slot" placeholder="B-Final" />
    </section>

    <section className="bracket-col semis">
    <BracketSlot teamName={slots.BAB?.name} flagUrl={slots.BAB?.flag} variantClass="blue-slot" placeholder="AB" />
    <BracketSlot teamName={slots.BCD?.name} flagUrl={slots.BCD?.flag} variantClass="blue-slot" placeholder="CD" />
    </section>

    <section className="bracket-col ro8">
    <BracketSlot teamName={slots.BA?.name} flagUrl={slots.BA?.flag} variantClass="blue-slot" placeholder="A" />
    <BracketSlot teamName={slots.BB?.name} flagUrl={slots.BB?.flag} variantClass="blue-slot" placeholder="B" />
    <BracketSlot teamName={slots.BC?.name} flagUrl={slots.BC?.flag} variantClass="blue-slot" placeholder="C" />
    <BracketSlot teamName={slots.BD?.name} flagUrl={slots.BD?.flag} variantClass="blue-slot" placeholder="D" />
    </section>

    <section className="bracket-col ro16">
    <div className="matchup">
    <BracketSlot teamName={slots.BA1?.name} flagUrl={slots.BA1?.flag} variantClass="blue-slot" placeholder="BA1" />
    <BracketSlot teamName={slots.BA2?.name} flagUrl={slots.BA2?.flag} variantClass="blue-slot" placeholder="BA2" />
    </div>
    <div className="matchup">
    <BracketSlot teamName={slots.BB1?.name} flagUrl={slots.BB1?.flag} variantClass="blue-slot" placeholder="BB1" />
    <BracketSlot teamName={slots.BB2?.name} flagUrl={slots.BB2?.flag} variantClass="blue-slot" placeholder="BB2" />
    </div>
    <div className="matchup">
    <BracketSlot teamName={slots.BC1?.name} flagUrl={slots.BC1?.flag} variantClass="blue-slot" placeholder="BC1" />
    <BracketSlot teamName={slots.BC2?.name} flagUrl={slots.BC2?.flag} variantClass="blue-slot" placeholder="BC2" />
    </div>
    <div className="matchup">
    <BracketSlot teamName={slots.BD1?.name} flagUrl={slots.BD1?.flag} variantClass="blue-slot" placeholder="BD1" />
    <BracketSlot teamName={slots.BD2?.name} flagUrl={slots.BD2?.flag} variantClass="blue-slot" placeholder="BD2" />
    </div>
    </section>

    </main>
    </>
  )
}
