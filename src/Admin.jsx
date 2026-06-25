import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function Admin() {
    const [session, setSession] = useState(null)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const [teams, setTeams] = useState({})
    const [slots, setSlots] = useState({})
    const [matches, setMatches] = useState([])

    // 1. Auth Listener
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session))
        return () => subscription.unsubscribe()
    }, [])

    // 2. Fetch Tournament Data
    const fetchData = async () => {
        if (!session) return;

        const [teamsRes, slotsRes, matchesRes] = await Promise.all([
            supabase.from('ro16_teams').select('*'),
                                                                   supabase.from('bracket_slots').select('*'),
                                                                   supabase.from('knockout_matches').select('*')
        ]);

        // Map teams by ID for easy lookup
        const teamsMap = {};
        teamsRes.data?.forEach(t => teamsMap[t.id] = t);
        setTeams(teamsMap);

        // Map slots by slot_code
        const slotsMap = {};
        slotsRes.data?.forEach(s => slotsMap[s.slot_code] = s);
        setSlots(slotsMap);

        // Order matches logically
        const roundOrder = { 'Ro16': 1, 'Quarterfinal': 2, 'Semifinal': 3, 'Bronze': 4, 'Final': 5 };
        const sortedMatches = (matchesRes.data || []).sort((a, b) => roundOrder[a.round] - roundOrder[b.round]);
        setMatches(sortedMatches);
    }

    useEffect(() => {
        fetchData();
    }, [session]);

    const handleLogin = async (e) => {
        e.preventDefault();
        await supabase.auth.signInWithPassword({ email, password });
    }

    // 3. The Core Update Logic
    const handleSaveResult = async (match, homeScore, awayScore, winnerId) => {
        if (homeScore === '' || awayScore === '' || !winnerId) return alert('Fill all fields');

        // Determine the loser for mutual exclusion (RunnerUp / Bronze placement)
        const homeTeamId = slots[match.home_slot]?.team_id;
        const awayTeamId = slots[match.away_slot]?.team_id;
        const loserId = parseInt(winnerId) === homeTeamId ? awayTeamId : homeTeamId;

        // A. Update the match record
        await supabase.from('knockout_matches').update({
            home_score: parseInt(homeScore),
                                                       away_score: parseInt(awayScore),
                                                       winner_id: parseInt(winnerId)
        }).eq('id', match.id);

        // B. Push winner to target slot
        if (match.winner_target_slot) {
            await supabase.from('bracket_slots').update({ team_id: parseInt(winnerId) }).eq('slot_code', match.winner_target_slot);
        }

        // C. Push loser to target slot (Mutual exclusion for Final -> RunnerUp, or Semis -> ThirdPlace)
        if (match.loser_target_slot) {
            await supabase.from('bracket_slots').update({ team_id: loserId }).eq('slot_code', match.loser_target_slot);
        }

        fetchData();
    }

    // 4. The Revert Logic (Panic Button)
    const handleRevert = async (match) => {
        // Clear match record
        await supabase.from('knockout_matches').update({
            home_score: null, away_score: null, winner_id: null
        }).eq('id', match.id);

        // Clear target slots to automatically strip them from the downstream UI
        if (match.winner_target_slot) {
            await supabase.from('bracket_slots').update({ team_id: null }).eq('slot_code', match.winner_target_slot);
        }
        if (match.loser_target_slot) {
            await supabase.from('bracket_slots').update({ team_id: null }).eq('slot_code', match.loser_target_slot);
        }

        fetchData();
    }

    // --- RENDERING ---
    if (!session) {
        return (
            <div className="admin-auth">
            <h2>Admin Gateway</h2>
            <form onSubmit={handleLogin}>
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
            <button type="submit">Access Secure Panel</button>
            </form>
            </div>
        )
    }

    return (
        <div className="admin-panel">
        <div className="admin-header">
        <h2>Tournament Control Center</h2>
        <div className="admin-header-actions">
        {/* Changes the hash to jump back to the public view */}
        <a href="#" className="back-link-btn">View Bracket</a>

        <button onClick={() => supabase.auth.signOut()} className="logout-btn">Logout</button>
        </div>
        </div>

        <div className="matches-grid">
        {matches.map(match => {
            const homeTeamId = slots[match.home_slot]?.team_id;
            const awayTeamId = slots[match.away_slot]?.team_id;
            const homeTeam = teams[homeTeamId];
            const awayTeam = teams[awayTeamId];

            // Lock subsequent rounds if the feeder matches aren't resolved
            const isReady = homeTeam && awayTeam;
            const isCompleted = match.winner_id !== null;

            return (
                <div key={match.id} className={`admin-card ${isCompleted ? 'completed' : isReady ? 'ready' : 'locked'}`}>
                <h3>{match.round}: {match.id}</h3>

                {!isReady ? (
                    <p className="status-locked">🔒 Waiting on previous round results...</p>
                ) : (
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        const data = new FormData(e.target);
                        handleSaveResult(match, data.get('home_score'), data.get('away_score'), data.get('winner_id'));
                    }}>
                    <div className="matchup-inputs">
                    <div className="team-input">
                    <span>{homeTeam.name} ({match.home_slot})</span>
                    <input type="number" name="home_score" defaultValue={match.home_score} disabled={isCompleted} min="0" required />
                    </div>
                    <div className="team-input">
                    <span>{awayTeam.name} ({match.away_slot})</span>
                    <input type="number" name="away_score" defaultValue={match.away_score} disabled={isCompleted} min="0" required />
                    </div>
                    </div>

                    <div className="winner-select">
                    <label>Winner: </label>
                    <select name="winner_id" defaultValue={match.winner_id || ""} disabled={isCompleted} required>
                    <option value="" disabled>Select winner...</option>
                    <option value={homeTeam.id}>{homeTeam.name}</option>
                    <option value={awayTeam.id}>{awayTeam.name}</option>
                    </select>
                    </div>

                    <div className="admin-actions">
                    {!isCompleted ? (
                        <button type="submit" className="save-btn">Save & Advance</button>
                    ) : (
                        <button type="button" onClick={() => handleRevert(match)} className="revert-btn">Revert Match</button>
                    )}
                    </div>
                    </form>
                )}
                </div>
            )
        })}
        </div>
        </div>
    )
}
