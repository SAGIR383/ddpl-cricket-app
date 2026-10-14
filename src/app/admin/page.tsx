'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Users, 
  Calendar, 
  Gavel, 
  PlusCircle, 
  Sparkles, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Settings, 
  Trophy, 
  DollarSign, 
  FileText,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  UserCheck,
  Award
} from 'lucide-react';

interface TeamItem {
  id: string;
  name: string;
  short: string;
  owner: string;
  captain: string;
  viceCaptain: string;
  budget: number;
  squadCount: number;
}

interface MatchItem {
  id: string;
  matchNumber: number;
  teamA: string;
  teamB: string;
  round: string;
  venue: string;
  overs: number;
  status: 'upcoming' | 'live' | 'completed';
}

interface PlayerItem {
  id: string;
  name: string;
  role: string;
  batting: string;
  bowling: string;
  basePrice: number;
  status: 'approved' | 'pending' | 'rejected';
}

interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'organizer' | 'scorer' | 'user';
  joinedDate: string;
}

import { useAuth } from '@/contexts/AuthContext';

export default function AdminDashboardPage() {
  const { isOrganizer, isSuperAdmin, role, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'teams' | 'fixtures' | 'players' | 'rules' | 'roles'>('teams');
  const [selectedTournament, setSelectedTournament] = useState<'ddpl' | 'game-of-run'>('ddpl');
  const [selectedSeason, setSelectedSeason] = useState('2026');

  // Success Notification banner
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };


  // --- 1. TEAMS STATE ---
  const [teams, setTeams] = useState<TeamItem[]>([
    { id: 't1', name: 'Teoco Knight Riders', short: 'TKR', owner: 'Gour Singha Roy', captain: 'Gour Singha Roy', viceCaptain: 'To be assigned', budget: 10000, squadCount: 1 },
    { id: 't2', name: 'Aircom Avengers', short: 'AA', owner: 'Yubaraj Roy', captain: 'Yubaraj Roy', viceCaptain: 'To be assigned', budget: 10000, squadCount: 1 },
    { id: 't3', name: 'Teoco Blues', short: 'TB', owner: 'Sunam Banerjee', captain: 'Sunam Banerjee', viceCaptain: 'To be assigned', budget: 10000, squadCount: 1 },
    { id: 't4', name: 'Aircom Superstar', short: 'AS', owner: 'Surojit Das', captain: 'Surojit Das', viceCaptain: 'To be assigned', budget: 10000, squadCount: 1 },
  ]);

  const [soldTransactions, setSoldTransactions] = useState<any[]>([]);
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);
  const [savingLeadership, setSavingLeadership] = useState<string | null>(null);

  // Leadership & Player Role Edit Handlers
  const handleUpdateCaptain = async (teamId: string, captainName: string) => {
    const team = teams.find((t) => t.id === teamId);
    if (!team) return;

    setSavingLeadership(teamId);
    try {
      const updatedTeams = teams.map((t) =>
        t.id === teamId ? { ...t, captain: captainName } : t
      );
      setTeams(updatedTeams);

      await fetch(`/api/auction/data?tournament=${selectedTournament}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updateTeamLeadership: {
            teamId,
            captain: captainName,
            viceCaptain: team.viceCaptain,
          },
        }),
      });
      showNotification(`Captain updated to "${captainName}" for ${team.name}`);
    } catch (err: any) {
      alert(`Error updating captain: ${err.message}`);
    } finally {
      setSavingLeadership(null);
    }
  };

  const handleUpdateViceCaptain = async (teamId: string, viceCaptainName: string) => {
    const team = teams.find((t) => t.id === teamId);
    if (!team) return;

    setSavingLeadership(teamId);
    try {
      const updatedTeams = teams.map((t) =>
        t.id === teamId ? { ...t, viceCaptain: viceCaptainName } : t
      );
      setTeams(updatedTeams);

      await fetch(`/api/auction/data?tournament=${selectedTournament}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updateTeamLeadership: {
            teamId,
            captain: team.captain,
            viceCaptain: viceCaptainName,
          },
        }),
      });
      showNotification(`Vice-Captain updated to "${viceCaptainName}" for ${team.name}`);
    } catch (err: any) {
      alert(`Error updating vice-captain: ${err.message}`);
    } finally {
      setSavingLeadership(null);
    }
  };

  const handleUpdateSquadPlayerRole = async (playerName: string, newRole: string) => {
    try {
      const updatedSold = soldTransactions.map((tx: any) =>
        tx.player.toLowerCase() === playerName.toLowerCase()
          ? { ...tx, role: newRole }
          : tx
      );
      setSoldTransactions(updatedSold);

      await fetch(`/api/auction/data?tournament=${selectedTournament}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updatePlayerRole: {
            playerName,
            newRole,
          },
        }),
      });
      showNotification(`Playing role updated to "${newRole}" for ${playerName}`);
    } catch (err: any) {
      alert(`Error updating player role: ${err.message}`);
    }
  };

  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamShort, setNewTeamShort] = useState('');
  const [newTeamOwner, setNewTeamOwner] = useState('');

  const handleAddTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim() || !newTeamShort.trim()) return;

    const newTeam: TeamItem = {
      id: `t-${Date.now()}`,
      name: newTeamName.trim(),
      short: newTeamShort.trim().toUpperCase(),
      owner: newTeamOwner.trim() || 'Team Management',
      captain: 'To be assigned',
      viceCaptain: 'To be assigned',
      budget: 10000,
      squadCount: 0,
    };

    setTeams([...teams, newTeam]);
    setNewTeamName('');
    setNewTeamShort('');
    setNewTeamOwner('');
    showNotification(`Franchise "${newTeam.name}" successfully created!`);
  };

  const handleDeleteTeam = (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    setTeams(teams.filter((t) => t.id !== id));
    showNotification(`Team "${name}" deleted.`);
  };

  // --- 2. MATCH FIXTURES STATE ---
  const [matches, setMatches] = useState<MatchItem[]>([
    { id: 'm1', matchNumber: 1, teamA: 'Teoco Knight Riders', teamB: 'Aircom Avengers', round: 'League Match 1', venue: 'Arena Ground 1', overs: 10, status: 'live' },
    { id: 'm2', matchNumber: 2, teamA: 'Teoco Blues', teamB: 'Aircom Superstar', round: 'League Match 2', venue: 'Arena Ground 1', overs: 10, status: 'upcoming' },
    { id: 'm3', matchNumber: 3, teamA: 'Teoco Knight Riders', teamB: 'Teoco Blues', round: 'League Match 3', venue: 'Arena Ground 1', overs: 10, status: 'upcoming' },
    { id: 'm4', matchNumber: 4, teamA: 'Aircom Avengers', teamB: 'Aircom Superstar', round: 'League Match 4', venue: 'Arena Ground 1', overs: 10, status: 'upcoming' },
  ]);

  const [manualTeamA, setManualTeamA] = useState('');
  const [manualTeamB, setManualTeamB] = useState('');
  const [manualVenue, setManualVenue] = useState('Arena Ground 1');
  const [manualOvers, setManualOvers] = useState(10);

  // Auto Fixture Generator (Round Robin)
  const handleAutoGenerateFixtures = () => {
    if (teams.length < 2) {
      alert('You need at least 2 teams to generate fixtures.');
      return;
    }

    const generated: MatchItem[] = [];
    let matchCount = 1;

    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        generated.push({
          id: `gen-${matchCount}`,
          matchNumber: matchCount,
          teamA: teams[i].name,
          teamB: teams[j].name,
          round: `League Match ${matchCount}`,
          venue: 'Arena Ground 1',
          overs: selectedTournament === 'ddpl' ? 10 : 12,
          status: 'upcoming',
        });
        matchCount++;
      }
    }

    setMatches(generated);
    showNotification(`Generated ${generated.length} round-robin league fixtures successfully!`);
  };

  const handleAddManualMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTeamA || !manualTeamB) {
      alert('Please select both teams.');
      return;
    }
    if (manualTeamA === manualTeamB) {
      alert('Team A and Team B cannot be the same.');
      return;
    }

    const newMatch: MatchItem = {
      id: `m-${Date.now()}`,
      matchNumber: matches.length + 1,
      teamA: manualTeamA,
      teamB: manualTeamB,
      round: `Match ${matches.length + 1}`,
      venue: manualVenue,
      overs: manualOvers,
      status: 'upcoming',
    };

    setMatches([...matches, newMatch]);
    showNotification(`Fixture added: ${newMatch.teamA} vs ${newMatch.teamB}`);
  };

  const handleDeleteMatch = (id: string) => {
    setMatches(matches.filter((m) => m.id !== id));
    showNotification('Fixture removed.');
  };

  // --- 3. PLAYERS & REGISTRATIONS STATE (19 Official Tournament Players) ---
  const [players, setPlayers] = useState<PlayerItem[]>([
    { id: 'p1', name: 'Gour Singha Roy', role: 'All-rounder', batting: 'Right-hand bat', bowling: 'Right-arm medium', basePrice: 500, status: 'approved' },
    { id: 'p2', name: 'Arinday Roy', role: 'Bowler', batting: 'Right-hand bat', bowling: 'Right-arm fast', basePrice: 500, status: 'approved' },
    { id: 'p3', name: 'Md Sagir Hossain', role: 'All-rounder', batting: 'Right-hand bat', bowling: 'Right-arm medium', basePrice: 500, status: 'approved' },
    { id: 'p4', name: 'Akash Chakraborty', role: 'Batter', batting: 'Right-hand bat', bowling: 'None', basePrice: 500, status: 'approved' },
    { id: 'p5', name: 'Aman Manna', role: 'Bowler', batting: 'Right-hand bat', bowling: 'Right-arm medium', basePrice: 500, status: 'approved' },
    { id: 'p6', name: 'Apurba Mukherjee', role: 'All-rounder', batting: 'Right-hand bat', bowling: 'Right-arm off-spin', basePrice: 500, status: 'approved' },
    { id: 'p7', name: 'Chanchal Chakraborty', role: 'Batter', batting: 'Right-hand bat', bowling: 'None', basePrice: 500, status: 'approved' },
    { id: 'p8', name: 'Mritin Ghosh', role: 'Batter', batting: 'Right-hand bat', bowling: 'None', basePrice: 500, status: 'approved' },
    { id: 'p9', name: 'Partha Roy', role: 'Batter', batting: 'Right-hand bat', bowling: 'None', basePrice: 500, status: 'approved' },
    { id: 'p10', name: 'Yubaraj Roy', role: 'Batter', batting: 'Right-hand bat', bowling: 'None', basePrice: 500, status: 'approved' },
    { id: 'p11', name: 'Prantik Bose', role: 'Batter', batting: 'Right-hand bat', bowling: 'None', basePrice: 500, status: 'approved' },
    { id: 'p12', name: 'Samaresh Das', role: 'Bowler', batting: 'Right-hand bat', bowling: 'Right-arm fast', basePrice: 500, status: 'approved' },
    { id: 'p13', name: 'Sudipto Chowdhury', role: 'Batter', batting: 'Right-hand bat', bowling: 'None', basePrice: 500, status: 'approved' },
    { id: 'p14', name: 'Sunam Banerjee', role: 'Wicket-keeper', batting: 'Right-hand bat', bowling: 'None', basePrice: 500, status: 'approved' },
    { id: 'p15', name: 'Surojit Das', role: 'Batter', batting: 'Right-hand bat', bowling: 'None', basePrice: 500, status: 'approved' },
    { id: 'p16', name: 'Wali Haider', role: 'Bowler', batting: 'Right-hand bat', bowling: 'Right-arm medium', basePrice: 500, status: 'approved' },
    { id: 'p17', name: 'Zeeshan', role: 'Bowler', batting: 'Right-hand bat', bowling: 'Right-arm fast', basePrice: 500, status: 'approved' },
    { id: 'p18', name: 'Saikat Das', role: 'Batter', batting: 'Right-hand bat', bowling: 'None', basePrice: 500, status: 'approved' },
    { id: 'p19', name: 'Ranjit', role: 'Batter', batting: 'Right-hand bat', bowling: 'None', basePrice: 500, status: 'approved' },
  ]);

  const handleUpdatePlayerStatus = (id: string, newStatus: 'approved' | 'rejected') => {
    setPlayers(players.map((p) => (p.id === id ? { ...p, status: newStatus } : p)));
    showNotification(`Player registration ${newStatus}!`);
  };

  // Quick Player Addition
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerRole, setNewPlayerRole] = useState('All-rounder');
  const [newPlayerBase, setNewPlayerBase] = useState(500);

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;

    const newP: PlayerItem = {
      id: `p-${Date.now()}`,
      name: newPlayerName.trim(),
      role: newPlayerRole,
      batting: 'Right-hand bat',
      bowling: 'Right-arm medium',
      basePrice: newPlayerBase,
      status: 'approved',
    };

    setPlayers([...players, newP]);
    setNewPlayerName('');
    showNotification(`Player "${newP.name}" added to auction pool.`);
  };

  // --- 4. USER ROLES & PERMISSIONS MANAGEMENT STATE ---
  const [userAccounts, setUserAccounts] = useState<UserAccount[]>([]);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<'organizer' | 'scorer' | 'user'>('scorer');

  // Tournament Rules & Playing Conditions State (Controlled by Super Admin & Organizer)
  const [auctionRules, setAuctionRules] = useState({
    basePurse: 10000,
    ownerBlockedPrice: 500,
    defaultPlayerBasePrice: 500,
    maxSquadSize: 11,
    minSquadSize: 7,
    matchOvers: 10,
    maxBowlerOvers: 2,
    wideBallPenalty: '+1 Run & Extra Ball',
    noBallPenalty: '+1 Run + Free Hit',
    pointsPerWin: 2,
    bidSteps: [50, 100, 200, 500],
  });
  const [isSavingRules, setIsSavingRules] = useState(false);

  // Fetch real registered users, backend auction rules, and tournament teams
  useEffect(() => {
    async function loadAdminData() {
      try {
        const [rolesRes, rulesRes, auctionRes] = await Promise.all([
          fetch('/api/admin/roles'),
          fetch(`/api/admin/rules?tournament=${selectedTournament}`),
          fetch(`/api/auction/data?tournament=${selectedTournament}`),
        ]);

        if (rolesRes.ok) {
          const data = await rolesRes.json();
          if (data.users && data.users.length > 0) {
            setUserAccounts(data.users);
          }
        }

        if (rulesRes.ok) {
          const data = await rulesRes.json();
          if (data.success && data.rules) {
            const rOvers = data.rules.matchOvers || 10;
            const rBowlerLimit = data.rules.maxBowlerOvers !== undefined
              ? data.rules.maxBowlerOvers
              : Math.max(1, Math.ceil(rOvers / 5));
            setAuctionRules({
              basePurse: data.rules.basePurse || 10000,
              ownerBlockedPrice: data.rules.ownerBlockedPrice || 500,
              defaultPlayerBasePrice: data.rules.defaultPlayerBasePrice || 500,
              maxSquadSize: data.rules.maxSquadSize || 11,
              minSquadSize: data.rules.minSquadSize || 7,
              matchOvers: rOvers,
              maxBowlerOvers: rBowlerLimit,
              wideBallPenalty: data.rules.wideBallPenalty || '+1 Run & Extra Ball',
              noBallPenalty: data.rules.noBallPenalty || '+1 Run + Free Hit',
              pointsPerWin: data.rules.pointsPerWin || 2,
              bidSteps: data.rules.bidSteps || [50, 100, 200, 500],
            });
          }
        }

        if (auctionRes.ok) {
          const aData = await auctionRes.json();
          if (aData.data) {
            // 1. Sync Franchise Teams
            if (aData.data.teams && aData.data.teams.length > 0) {
              const soldTransactionsList = aData.data.soldTransactions || [];
              setSoldTransactions(soldTransactionsList);

              const mappedTeams: TeamItem[] = aData.data.teams.map((t: any) => ({
                id: t.id,
                name: t.name,
                short: t.short,
                owner: t.owner || 'Franchise Owner',
                captain: t.captain || `${t.owner || t.name} (C)`,
                viceCaptain: t.viceCaptain || 'To be assigned',
                budget: t.allocated || 10000,
                squadCount: soldTransactionsList.filter((tx: any) => tx.team === t.name).length || t.playersBought || 1,
              }));
              setTeams(mappedTeams);

              // Auto-generate fresh clean fixtures from real auction teams
              const generatedMatches: MatchItem[] = [];
              let count = 1;
              for (let i = 0; i < mappedTeams.length; i++) {
                for (let j = i + 1; j < mappedTeams.length; j++) {
                  generatedMatches.push({
                    id: `gen-match-${count}`,
                    matchNumber: count,
                    teamA: mappedTeams[i].name,
                    teamB: mappedTeams[j].name,
                    round: `League Match ${count}`,
                    venue: 'Arena Ground 1',
                    overs: selectedTournament === 'ddpl' ? (auctionRules.matchOvers || 10) : 12,
                    status: 'upcoming',
                  });
                  count++;
                }
              }
              setMatches(generatedMatches);
            }

            // 2. Sync Registered Players Queue (Auction Pool) directly from active auction state
            if (aData.data.playerPool && Array.isArray(aData.data.playerPool)) {
              const mappedPoolPlayers: PlayerItem[] = aData.data.playerPool.map((p: any) => ({
                id: p.id,
                name: p.name,
                role: p.role || 'All-rounder',
                batting: 'Right-hand bat',
                bowling: 'Right-arm medium',
                basePrice: p.basePrice || 500,
                status: 'approved',
              }));
              setPlayers(mappedPoolPlayers);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load admin data', err);
      }
    }
    loadAdminData();
  }, [selectedTournament]);

  const handleSaveAuctionRules = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOrganizer && !isSuperAdmin) {
      alert('Access Restricted: Only Super Admin and Tournament Organizers can modify tournament rules and match playing conditions.');
      return;
    }

    setIsSavingRules(true);
    try {
      const res = await fetch(`/api/admin/rules?tournament=${selectedTournament}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...auctionRules,
          tournament: selectedTournament,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification(`Rules & Playing Conditions for "${selectedTournament.toUpperCase()}" saved successfully!`);
      } else {
        alert(data.error || 'Failed to save rules');
      }
    } catch (err: any) {
      alert(err.message || 'Error saving rules');
    } finally {
      setIsSavingRules(false);
    }
  };

  const handleUpdateUserRole = async (email: string, newRole: 'super_admin' | 'organizer' | 'scorer' | 'user') => {
    try {
      const res = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role: newRole }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUserAccounts(userAccounts.map(u => u.email.toLowerCase() === email.toLowerCase() ? { ...u, role: newRole } : u));
        showNotification(`Success: ${email} is now ${newRole.toUpperCase()}! Automatically reflected in backend.`);
      } else {
        alert(data.error || 'Failed to update user role');
      }
    } catch (err: any) {
      alert(err.message || 'Network error updating role');
    }
  };

  const handleAddUserPrivilege = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail.trim()) return;
    await handleUpdateUserRole(newUserEmail.trim(), newUserRole);
    setNewUserEmail('');
    setNewUserName('');
  };

  // If user does not have Organizer or Super Admin privileges, block access with RBAC shield
  if (!isOrganizer) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-2xl">
          <ShieldCheck className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h1 className="font-display font-black text-3xl sm:text-4xl text-white">
            Super Admin Access Required
          </h1>
          <p className="text-sm text-gray-300 max-w-md mx-auto leading-relaxed">
            The Admin Command Center is reserved for authorized <span className="text-amber-400 font-bold">Super Admins</span> and appointed <span className="text-cricket-teal font-bold">Organizers</span>. Your current role is <code className="px-2 py-0.5 rounded bg-cricket-card text-rose-300 font-mono font-bold text-xs">{role}</code>.
          </p>
        </div>

        <div className="glass-card p-6 border border-cricket-border max-w-md mx-auto space-y-4">
          <p className="text-xs text-gray-400">
            Please log in with your dedicated Super Admin credentials to proceed:
          </p>
          <Link
            href="/admin/login"
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-cricket-dark font-display font-extrabold text-sm shadow-xl hover:brightness-110 transition-all flex items-center justify-center gap-2"
          >
            Log In to Super Admin Portal
          </Link>
          <Link
            href="/"
            className="block text-xs font-bold text-cricket-teal hover:underline pt-2"
          >
            ← Return to Tournament Hub
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative z-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-cricket-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-cricket-teal" />
            <h1 className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight">
              Organizer Admin Command Center
            </h1>
          </div>
          <p className="text-sm text-cricket-muted mt-1">
            Centrally manage franchises, auto-generate tournament fixtures, approve player rosters, and configure cricket rules.
          </p>
        </div>

        {/* Tournament & Season Selector & Super Admin Status */}
        <div className="flex flex-wrap items-center gap-3">
          {isSuperAdmin && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold">
              <span>👑 Super Admin</span>
              <button
                onClick={async () => {
                  await signOut();
                  window.location.href = '/admin/login';
                }}
                className="ml-2 text-rose-400 hover:text-rose-300 hover:underline text-[11px] cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          )}
          <select
            value={selectedTournament}
            onChange={(e) => setSelectedTournament(e.target.value as any)}
            className="px-4 py-2.5 rounded-xl bg-cricket-dark border border-cricket-border text-white text-xs font-bold"
          >
            <option value="ddpl">DDPL Tournament</option>
            <option value="game-of-run">Game of RUN Championship</option>
          </select>
          <select
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-cricket-dark border border-cricket-border text-white text-xs font-bold"
          >
            <option value="2026">Season 2026 (Active)</option>
            <option value="2025">Season 2025 (Archive)</option>
          </select>
        </div>
      </div>

      {/* Real-time Notification Banner */}
      {notification && (
        <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-bold text-sm flex items-center gap-3 shadow-lg shadow-emerald-500/10 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Admin KPI Quick Counters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 border-l-4 border-l-blue-500 space-y-1">
          <div className="text-xs text-cricket-muted font-bold uppercase">Franchises</div>
          <div className="font-display font-black text-3xl text-white">{teams.length} Teams</div>
        </div>
        <div className="glass-card p-5 border-l-4 border-l-emerald-500 space-y-1">
          <div className="text-xs text-cricket-muted font-bold uppercase">Scheduled Fixtures</div>
          <div className="font-display font-black text-3xl text-white">{matches.length} Matches</div>
        </div>
        <div className="glass-card p-5 border-l-4 border-l-cricket-gold space-y-1">
          <div className="text-xs text-cricket-muted font-bold uppercase">Auction Player Pool</div>
          <div className="font-display font-black text-3xl text-white">{players.filter(p => p.status === 'approved').length} Players</div>
        </div>
        <div className="glass-card p-5 border-l-4 border-l-purple-500 space-y-1">
          <div className="text-xs text-cricket-muted font-bold uppercase">Pending Registrations</div>
          <div className="font-display font-black text-3xl text-purple-400">{players.filter(p => p.status === 'pending').length} Pending</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-cricket-border text-sm font-bold overflow-x-auto">
        <button
          onClick={() => setActiveTab('teams')}
          className={`flex items-center gap-2 px-6 py-3.5 border-b-2 font-display text-lg tracking-wide transition-all whitespace-nowrap ${
            activeTab === 'teams'
              ? 'border-cricket-teal text-cricket-teal'
              : 'border-transparent text-cricket-muted hover:text-white'
          }`}
        >
          <Users className="w-5 h-5" />
          <span>Franchise &amp; Teams ({teams.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('fixtures')}
          className={`flex items-center gap-2 px-6 py-3.5 border-b-2 font-display text-lg tracking-wide transition-all whitespace-nowrap ${
            activeTab === 'fixtures'
              ? 'border-cricket-teal text-cricket-teal'
              : 'border-transparent text-cricket-muted hover:text-white'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span>Fixtures &amp; Scheduling ({matches.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('players')}
          className={`flex items-center gap-2 px-6 py-3.5 border-b-2 font-display text-lg tracking-wide transition-all whitespace-nowrap ${
            activeTab === 'players'
              ? 'border-cricket-teal text-cricket-teal'
              : 'border-transparent text-cricket-muted hover:text-white'
          }`}
        >
          <Gavel className="w-5 h-5" />
          <span>Player Pool &amp; Approvals ({players.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('rules')}
          className={`flex items-center gap-2 px-6 py-3.5 border-b-2 font-display text-lg tracking-wide transition-all whitespace-nowrap ${
            activeTab === 'rules'
              ? 'border-cricket-teal text-cricket-teal'
              : 'border-transparent text-cricket-muted hover:text-white'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span>Tournament Rules</span>
        </button>

        <button
          onClick={() => setActiveTab('roles')}
          className={`flex items-center gap-2 px-6 py-3.5 border-b-2 font-display text-lg tracking-wide transition-all whitespace-nowrap ${
            activeTab === 'roles'
              ? 'border-cricket-teal text-cricket-teal'
              : 'border-transparent text-cricket-muted hover:text-white'
          }`}
        >
          <ShieldCheck className="w-5 h-5" />
          <span>User Roles &amp; Permissions ({userAccounts.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: FRANCHISE & TEAMS MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'teams' && (
        <div className="space-y-8">
          {/* Add New Team Form */}
          <div className="glass-card p-6 sm:p-8 space-y-5 border border-cricket-teal/30">
            <h3 className="font-display font-bold text-2xl text-white flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-cricket-teal" />
              <span>Create New Franchise / Team</span>
            </h3>

            <form onSubmit={handleAddTeam} className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-sm">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-gray-300">Team Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Strikers CC"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-cricket-dark border border-cricket-border text-white text-sm focus:outline-none focus:border-cricket-teal"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">Short Code (2-4 Letters)</label>
                <input
                  type="text"
                  required
                  maxLength={4}
                  placeholder="e.g. RS"
                  value={newTeamShort}
                  onChange={(e) => setNewTeamShort(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-cricket-dark border border-cricket-border text-white text-sm uppercase focus:outline-none focus:border-cricket-teal"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">Franchise Owner</label>
                <input
                  type="text"
                  placeholder="e.g. Tariq Ahmed"
                  value={newTeamOwner}
                  onChange={(e) => setNewTeamOwner(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-cricket-dark border border-cricket-border text-white text-sm focus:outline-none focus:border-cricket-teal"
                />
              </div>

              <div className="sm:col-span-4 flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-cricket-dark font-display font-extrabold text-base tracking-wide shadow-lg shadow-teal-500/20 active:scale-95 transition-all"
                >
                  + Add Franchise
                </button>
              </div>
            </form>
          </div>

          {/* Teams Table */}
          <div className="glass-card overflow-hidden border border-cricket-border shadow-2xl">
            <div className="p-4 bg-cricket-card/80 border-b border-cricket-border flex items-center justify-between">
              <span className="font-display font-bold text-xl text-white">Registered Teams in {selectedTournament.toUpperCase()}</span>
              <span className="text-xs text-cricket-muted font-bold">Default Purse: ₹10,000</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm table-nums">
                <thead className="bg-cricket-dark/80 text-xs font-semibold text-cricket-muted uppercase border-b border-cricket-border">
                  <tr>
                    <th className="px-4 py-3.5">Code</th>
                    <th className="px-4 py-3.5">Team Name (Click to Edit Squad &amp; Leaders)</th>
                    <th className="px-4 py-3.5">Owner</th>
                    <th className="px-4 py-3.5">Captain</th>
                    <th className="px-4 py-3.5">Vice-Captain</th>
                    <th className="px-4 py-3.5 text-right">Budget</th>
                    <th className="px-4 py-3.5 text-center">Squad</th>
                    <th className="px-4 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cricket-border">
                  {teams.map((t) => {
                    const isExpanded = expandedTeamId === t.id;
                    const teamSquad = soldTransactions.filter((tx) => tx.team === t.name);

                    return (
                      <React.Fragment key={t.id}>
                        <tr 
                          onClick={() => setExpandedTeamId(isExpanded ? null : t.id)}
                          className={`cursor-pointer transition-colors ${
                            isExpanded ? 'bg-cricket-card/80 border-l-4 border-l-cricket-teal' : 'hover:bg-cricket-card/40'
                          }`}
                        >
                          <td className="px-4 py-3.5 font-display font-bold text-base text-cricket-teal">{t.short}</td>
                          <td className="px-4 py-3.5 font-bold text-white flex items-center gap-2">
                            <span>{t.name}</span>
                            <span className="text-xs text-cricket-muted font-normal flex items-center">
                              {isExpanded ? <ChevronUp className="w-4 h-4 text-cricket-teal" /> : <ChevronDown className="w-4 h-4" />}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-xs text-gray-300">{t.owner}</td>
                          <td className="px-4 py-3.5 text-xs font-semibold text-emerald-400">
                            {t.captain || `${t.owner || t.name} (C)`}
                          </td>
                          <td className="px-4 py-3.5 text-xs text-cyan-300">
                            {t.viceCaptain || 'To be assigned'}
                          </td>
                          <td className="px-4 py-3.5 text-right font-display font-bold text-cricket-gold">₹{t.budget.toLocaleString('en-IN')}</td>
                          <td className="px-4 py-3.5 text-center">
                            <span className="inline-block px-2 py-0.5 rounded-full bg-cricket-dark text-xs font-bold text-gray-200 border border-cricket-border">
                              {t.squadCount}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleDeleteTeam(t.id, t.name)}
                              className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors"
                              title="Delete Team"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>

                        {/* Expandable Squad Roster & Leadership Editing Panel */}
                        {isExpanded && (
                          <tr className="bg-cricket-dark/95 border-b border-cricket-teal/30">
                            <td colSpan={8} className="p-5 sm:p-6 space-y-5">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-cricket-border pb-4">
                                <div>
                                  <div className="text-xs font-bold uppercase tracking-wider text-cricket-teal flex items-center gap-1.5">
                                    <Award className="w-4 h-4" />
                                    <span>Squad Leadership &amp; Player Roles Control</span>
                                  </div>
                                  <h4 className="font-display font-extrabold text-xl text-white">
                                    {t.name} — Squad Roster ({teamSquad.length} Players)
                                  </h4>
                                </div>

                                <div className="flex flex-wrap items-center gap-3">
                                  {/* Select Captain */}
                                  <div className="flex items-center gap-2 bg-cricket-card px-3 py-1.5 rounded-xl border border-cricket-border text-xs">
                                    <span className="font-bold text-emerald-400 flex items-center gap-1">
                                      <UserCheck className="w-3.5 h-3.5" />
                                      Captain:
                                    </span>
                                    <select
                                      value={t.captain.replace(' (C)', '')}
                                      onChange={(e) => handleUpdateCaptain(t.id, e.target.value)}
                                      disabled={savingLeadership === t.id}
                                      className="bg-cricket-dark border border-cricket-border rounded-lg px-2 py-1 text-white font-medium focus:outline-none focus:border-cricket-teal"
                                    >
                                      <option value="">Select Captain...</option>
                                      {t.owner && <option value={t.owner}>{t.owner} (Owner)</option>}
                                      {teamSquad.map((p: any) => (
                                        <option key={p.id || p.player} value={p.player}>
                                          {p.player}
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  {/* Select Vice-Captain */}
                                  <div className="flex items-center gap-2 bg-cricket-card px-3 py-1.5 rounded-xl border border-cricket-border text-xs">
                                    <span className="font-bold text-cyan-400 flex items-center gap-1">
                                      <UserCheck className="w-3.5 h-3.5" />
                                      Vice-Captain:
                                    </span>
                                    <select
                                      value={t.viceCaptain.replace(' (VC)', '')}
                                      onChange={(e) => handleUpdateViceCaptain(t.id, e.target.value)}
                                      disabled={savingLeadership === t.id}
                                      className="bg-cricket-dark border border-cricket-border rounded-lg px-2 py-1 text-white font-medium focus:outline-none focus:border-cyan-400"
                                    >
                                      <option value="To be assigned">To be assigned</option>
                                      {t.owner && <option value={t.owner}>{t.owner} (Owner)</option>}
                                      {teamSquad.map((p: any) => (
                                        <option key={p.id || p.player} value={p.player}>
                                          {p.player}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                              </div>

                              {/* Squad Players Table with Role Editors */}
                              {teamSquad.length === 0 ? (
                                <div className="text-center py-6 text-xs text-cricket-muted italic">
                                  No players acquired in the auction yet for {t.name}.
                                </div>
                              ) : (
                                <div className="overflow-x-auto">
                                  <table className="w-full text-xs">
                                    <thead className="text-cricket-muted border-b border-cricket-border font-semibold uppercase">
                                      <tr>
                                        <th className="py-2 px-3 text-left">#</th>
                                        <th className="py-2 px-3 text-left">Player Name</th>
                                        <th className="py-2 px-3 text-left">Acquisition Type</th>
                                        <th className="py-2 px-3 text-left">Winning Bid / Price</th>
                                        <th className="py-2 px-3 text-left">Current Playing Role</th>
                                        <th className="py-2 px-3 text-left">Edit Role</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-cricket-border/40">
                                      {teamSquad.map((player: any, pIdx: number) => {
                                        const isCap = t.captain.includes(player.player);
                                        const isVC = t.viceCaptain.includes(player.player);
                                        const isOwner = player.player.toLowerCase() === (t.owner || '').toLowerCase();

                                        return (
                                          <tr key={player.id || pIdx} className="hover:bg-cricket-card/30">
                                            <td className="py-2.5 px-3 text-cricket-muted">{pIdx + 1}</td>
                                            <td className="py-2.5 px-3 font-bold text-white flex items-center gap-2">
                                              <span>{player.player}</span>
                                              {isCap && (
                                                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold border border-emerald-500/40">
                                                  CAPTAIN
                                                </span>
                                              )}
                                              {isVC && (
                                                <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 text-[10px] font-extrabold border border-cyan-500/40">
                                                  VICE-CAPTAIN
                                                </span>
                                              )}
                                              {isOwner && (
                                                <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-extrabold border border-purple-500/40">
                                                  OWNER
                                                </span>
                                              )}
                                            </td>
                                            <td className="py-2.5 px-3 text-gray-300">
                                              {isOwner ? 'Retained Franchise Owner' : 'Auction Hammer Acquisition'}
                                            </td>
                                            <td className="py-2.5 px-3 font-display font-bold text-cricket-gold">
                                              ₹{player.price?.toLocaleString('en-IN')}
                                            </td>
                                            <td className="py-2.5 px-3 text-white font-medium">
                                              {player.role}
                                            </td>
                                            <td className="py-2.5 px-3">
                                              <select
                                                value={
                                                  player.role.includes('Batter') || player.role.includes('Batsman')
                                                    ? 'Batter'
                                                    : player.role.includes('Bowler')
                                                    ? 'Bowler'
                                                    : player.role.includes('Wicket')
                                                    ? 'Wicket Keeper'
                                                    : 'All Rounder'
                                                }
                                                onChange={(e) => {
                                                  const newR = e.target.value;
                                                  const suffix = isOwner ? ' (Franchise Owner)' : '';
                                                  handleUpdateSquadPlayerRole(player.player, `${newR}${suffix}`);
                                                }}
                                                className="bg-cricket-dark border border-cricket-border rounded-lg px-2 py-1 text-white text-xs focus:outline-none focus:border-cricket-teal"
                                              >
                                                <option value="Batter">Batter</option>
                                                <option value="Bowler">Bowler</option>
                                                <option value="All Rounder">All Rounder</option>
                                                <option value="Wicket Keeper">Wicket Keeper</option>
                                              </select>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: FIXTURE GENERATION & SCHEDULING */}
      {/* ========================================================================= */}
      {activeTab === 'fixtures' && (
        <div className="space-y-8">
          {/* Action Row: Auto Generator + Manual Add */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Auto Generate Button Card */}
            <div className="glass-card p-6 flex flex-col justify-between border-t-4 border-t-cricket-teal space-y-4">
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase">
                  <Sparkles className="w-3.5 h-3.5" />
                  Smart Scheduler
                </span>
                <h3 className="font-display font-bold text-2xl text-white">Auto-Generate Round Robin</h3>
                <p className="text-xs text-cricket-muted leading-relaxed">
                  Automatically pair all {teams.length} registered teams against each other in a fair league matrix without duplicate match-ups.
                </p>
              </div>

              <button
                onClick={handleAutoGenerateFixtures}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-cricket-dark font-display font-extrabold text-base tracking-wide shadow-lg shadow-teal-500/20 active:scale-95 transition-all"
              >
                ⚡ Generate All Fixtures ({teams.length * (teams.length - 1) / 2} Matches)
              </button>
            </div>

            {/* Manual Match Creator Form */}
            <div className="glass-card p-6 md:col-span-2 space-y-4 border border-cricket-border">
              <h3 className="font-display font-bold text-xl text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-cricket-teal" />
                <span>Create Match Manually</span>
              </h3>

              <form onSubmit={handleAddManualMatch} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300">Team A</label>
                  <select
                    value={manualTeamA}
                    onChange={(e) => setManualTeamA(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-cricket-dark border border-cricket-border text-white text-sm"
                  >
                    <option value="">-- Choose Team A --</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300">Team B</label>
                  <select
                    value={manualTeamB}
                    onChange={(e) => setManualTeamB(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-cricket-dark border border-cricket-border text-white text-sm"
                  >
                    <option value="">-- Choose Team B --</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300">Venue</label>
                  <input
                    type="text"
                    value={manualVenue}
                    onChange={(e) => setManualVenue(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-cricket-dark border border-cricket-border text-white text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300">Overs Limit</label>
                  <input
                    type="number"
                    value={manualOvers}
                    onChange={(e) => setManualOvers(+e.target.value)}
                    min={1}
                    max={50}
                    className="w-full px-3 py-2 rounded-xl bg-cricket-dark border border-cricket-border text-white text-sm"
                  />
                </div>

                <div className="sm:col-span-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-cricket-card hover:bg-cricket-cardHover border border-cricket-teal/40 text-cricket-teal font-bold text-sm transition-all"
                  >
                    + Schedule Match
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Matches List */}
          <div className="glass-card overflow-hidden border border-cricket-border shadow-2xl">
            <div className="p-4 bg-cricket-card/80 border-b border-cricket-border flex items-center justify-between">
              <span className="font-display font-bold text-xl text-white">Scheduled Matches ({matches.length})</span>
              <span className="text-xs text-cricket-muted font-bold">Click Scorer to live-score any match</span>
            </div>

            <div className="divide-y divide-cricket-border">
              {matches.map((m) => (
                <div key={m.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-cricket-card/30 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold text-xs text-cricket-gold uppercase">{m.round}</span>
                      <span className="text-xs text-cricket-muted">• Venue: {m.venue} • {m.overs} Overs</span>
                      {m.status === 'live' && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase animate-pulse">
                          Live Now
                        </span>
                      )}
                    </div>
                    <div className="font-display font-extrabold text-2xl text-white">
                      {m.teamA} <span className="text-cricket-muted font-normal text-lg">vs</span> {m.teamB}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Link
                      href={`/matches/match-1`}
                      className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs border border-emerald-500/40 transition-all"
                    >
                      Open Live Console
                    </Link>
                    <button
                      onClick={() => handleDeleteMatch(m.id)}
                      className="p-2 rounded-xl text-red-400 hover:bg-red-500/20 transition-colors"
                      title="Delete Match"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PLAYER REGISTRATIONS & AUCTION POOL */}
      {/* ========================================================================= */}
      {activeTab === 'players' && (
        <div className="space-y-8">
          {/* Add Player to Pool */}
          <div className="glass-card p-6 sm:p-8 space-y-4 border border-cricket-border">
            <h3 className="font-display font-bold text-2xl text-white flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-cricket-teal" />
              <span>Add Player to Auction Pool</span>
            </h3>

            <form onSubmit={handleAddPlayer} className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-sm">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-gray-300">Player Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shakil Anowar"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-cricket-dark border border-cricket-border text-white text-sm focus:outline-none focus:border-cricket-teal"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">Playing Role</label>
                <select
                  value={newPlayerRole}
                  onChange={(e) => setNewPlayerRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-cricket-dark border border-cricket-border text-white text-sm"
                >
                  <option value="Batter">Batter</option>
                  <option value="Bowler">Bowler</option>
                  <option value="All-rounder">All-rounder</option>
                  <option value="Wicket-keeper">Wicket-keeper</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">Base Price (₹)</label>
                <input
                  type="number"
                  value={newPlayerBase}
                  onChange={(e) => setNewPlayerBase(+e.target.value)}
                  step={50}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-cricket-dark border border-cricket-border text-white text-sm"
                />
              </div>

              <div className="sm:col-span-4 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-cricket-dark font-display font-extrabold text-base tracking-wide shadow transition-all active:scale-95"
                >
                  + Add to Auction Pool
                </button>
              </div>
            </form>
          </div>

          {/* Players Approval Table */}
          <div className="glass-card overflow-hidden border border-cricket-border shadow-2xl">
            <div className="p-4 bg-cricket-card/80 border-b border-cricket-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <span className="font-display font-bold text-xl text-white">
                  Registered Players Queue ({players.length} in Auction Pool)
                </span>
                <span className="block text-xs text-cricket-teal font-semibold">
                  Excludes {teams.length} Retained Franchise Owners (Owner-players are assigned under Franchise &amp; Teams)
                </span>
              </div>
              <span className="text-xs text-cricket-muted font-bold">
                Synced with active tournament auction roster
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm table-nums">
                <thead className="bg-cricket-dark/80 text-xs font-semibold text-cricket-muted uppercase border-b border-cricket-border">
                  <tr>
                    <th className="px-4 py-3.5">Player Name</th>
                    <th className="px-4 py-3.5">Role</th>
                    <th className="px-4 py-3.5">Style</th>
                    <th className="px-4 py-3.5 text-right">Base Price</th>
                    <th className="px-4 py-3.5 text-center">Status</th>
                    <th className="px-4 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cricket-border">
                  {players.map((p) => (
                    <tr key={p.id} className="hover:bg-cricket-card/40 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-white">{p.name}</td>
                      <td className="px-4 py-3.5 text-xs text-cricket-teal font-semibold">{p.role}</td>
                      <td className="px-4 py-3.5 text-xs text-gray-300">{p.batting} • {p.bowling}</td>
                      <td className="px-4 py-3.5 text-right font-display font-bold text-cricket-gold">₹{p.basePrice}</td>
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                            p.status === 'approved'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : p.status === 'pending'
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        {p.status === 'pending' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleUpdatePlayerStatus(p.id, 'approved')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 font-bold text-xs transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleUpdatePlayerStatus(p.id, 'rejected')}
                              className="px-2.5 py-1 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 font-bold text-xs transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-cricket-muted italic">Ready</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: TOURNAMENT RULES & CONFIGURATION */}
      {/* ========================================================================= */}
      {activeTab === 'rules' && (
        <div className="space-y-8">
          {/* Super Admin Auction Purse & Bidding Rules Form */}
          <div className="glass-card p-6 sm:p-8 space-y-6 border border-cricket-teal/30 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-cricket-border pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-6 h-6 text-cricket-gold" />
                  <h3 className="font-display font-bold text-2xl text-white">
                    Franchise Purse &amp; Auction Point Rules
                  </h3>
                </div>
                <p className="text-xs text-cricket-muted mt-1">
                  Configure starting budgets, franchise owner blocked deductions, and player base points.
                </p>
              </div>

              {isSuperAdmin ? (
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold uppercase flex items-center gap-1.5 self-start sm:self-auto">
                  <span>👑 Super Admin Authority</span>
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold uppercase flex items-center gap-1.5 self-start sm:self-auto">
                  <span>🔒 Read-Only (Super Admin Required)</span>
                </span>
              )}
            </div>

            {/* Rule Explanatory Banner */}
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-200 text-xs space-y-1.5">
              <div className="font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-cricket-teal" />
                <span>Active Tournament Rule Protocol:</span>
              </div>
              <p className="text-gray-300 leading-relaxed">
                Franchise owners participate directly as team players. Therefore, the owner base price (<strong className="text-amber-400">₹{auctionRules.ownerBlockedPrice} pts</strong>) is blocked and automatically deducted from the total purse (<strong className="text-white">₹{auctionRules.basePurse.toLocaleString('en-IN')} pts</strong>), providing each franchise with an effective starting purse of <strong className="text-cricket-teal">₹{(auctionRules.basePurse - auctionRules.ownerBlockedPrice).toLocaleString('en-IN')} pts</strong>.
              </p>
            </div>

            <form onSubmit={handleSaveAuctionRules} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* Total Franchise Base Purse */}
                <div className="p-4 rounded-2xl bg-cricket-dark/80 border border-cricket-border space-y-2">
                  <label className="text-xs font-bold text-gray-300 uppercase block">
                    Franchise Base Purse (Points)
                  </label>
                  <input
                    type="number"
                    disabled={!isSuperAdmin}
                    value={auctionRules.basePurse}
                    onChange={(e) => setAuctionRules({ ...auctionRules, basePurse: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-cricket-card border border-cricket-border text-white font-display font-extrabold text-xl focus:outline-none focus:border-cricket-teal disabled:opacity-60"
                  />
                  <p className="text-[11px] text-cricket-muted">Total budget allocated to each franchise.</p>
                </div>

                {/* Franchise Owner Blocked Base Price */}
                <div className="p-4 rounded-2xl bg-cricket-dark/80 border border-cricket-border space-y-2">
                  <label className="text-xs font-bold text-gray-300 uppercase block">
                    Owner Blocked Base Price (Points)
                  </label>
                  <input
                    type="number"
                    disabled={!isSuperAdmin}
                    value={auctionRules.ownerBlockedPrice}
                    onChange={(e) => setAuctionRules({ ...auctionRules, ownerBlockedPrice: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-cricket-card border border-cricket-border text-amber-400 font-display font-extrabold text-xl focus:outline-none focus:border-amber-400 disabled:opacity-60"
                  />
                  <p className="text-[11px] text-cricket-muted">Automatically reserved for owner retention.</p>
                </div>

                {/* Effective Starting Purse (Live Calculation) */}
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                  <span className="text-xs font-bold text-emerald-400 uppercase block">
                    Effective Remaining Purse
                  </span>
                  <div className="font-display font-black text-3xl text-emerald-300">
                    ₹{(auctionRules.basePurse - auctionRules.ownerBlockedPrice).toLocaleString('en-IN')}
                  </div>
                  <p className="text-[11px] text-emerald-200/70">
                    Formula: ₹{auctionRules.basePurse} - ₹{auctionRules.ownerBlockedPrice} = Starting points.
                  </p>
                </div>

                {/* Default Player Base Price */}
                <div className="p-4 rounded-2xl bg-cricket-dark/80 border border-cricket-border space-y-2">
                  <label className="text-xs font-bold text-gray-300 uppercase block">
                    Default Player Base Price (Points)
                  </label>
                  <input
                    type="number"
                    disabled={!isSuperAdmin}
                    value={auctionRules.defaultPlayerBasePrice}
                    onChange={(e) => setAuctionRules({ ...auctionRules, defaultPlayerBasePrice: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-cricket-card border border-cricket-border text-white font-display font-extrabold text-xl focus:outline-none focus:border-cricket-teal disabled:opacity-60"
                  />
                  <p className="text-[11px] text-cricket-muted">Starting bid for all auction lot players.</p>
                </div>

                {/* Max Squad Size */}
                {/* Maximum Squad Capacity */}
                <div className="p-4 rounded-2xl bg-cricket-dark/80 border border-cricket-border space-y-2">
                  <label className="text-xs font-bold text-gray-300 uppercase block">
                    Maximum Squad Capacity
                  </label>
                  <input
                    type="number"
                    min={4}
                    max={30}
                    disabled={!isOrganizer && !isSuperAdmin}
                    value={auctionRules.maxSquadSize}
                    onChange={(e) => setAuctionRules({ ...auctionRules, maxSquadSize: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-cricket-card border border-cricket-border text-white font-display font-extrabold text-xl focus:outline-none focus:border-cricket-teal disabled:opacity-60"
                  />
                  <p className="text-[11px] text-cricket-muted">Cap on total roster size per franchise (e.g. 7, 11, 15, 20).</p>
                </div>

                {/* Minimum Squad Size */}
                <div className="p-4 rounded-2xl bg-cricket-dark/80 border border-cricket-border space-y-2">
                  <label className="text-xs font-bold text-gray-300 uppercase block">
                    Minimum Squad Threshold
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={25}
                    disabled={!isOrganizer && !isSuperAdmin}
                    value={auctionRules.minSquadSize}
                    onChange={(e) => setAuctionRules({ ...auctionRules, minSquadSize: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-cricket-card border border-cricket-border text-white font-display font-extrabold text-xl focus:outline-none focus:border-cricket-teal disabled:opacity-60"
                  />
                  <p className="text-[11px] text-cricket-muted">Required minimum players to complete roster.</p>
                </div>

                {/* Match Overs per Innings */}
                <div className="p-4 rounded-2xl bg-cricket-dark/80 border border-cricket-border space-y-2">
                  <label className="text-xs font-bold text-gray-300 uppercase block">
                    Match Overs (Innings Length)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={50}
                      disabled={!isOrganizer && !isSuperAdmin}
                      value={auctionRules.matchOvers}
                      onChange={(e) => {
                        const newOvers = Number(e.target.value);
                        setAuctionRules({
                          ...auctionRules,
                          matchOvers: newOvers,
                          maxBowlerOvers: Math.max(1, Math.ceil(newOvers / 5)),
                        });
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-cricket-card border border-cricket-border text-cricket-teal font-display font-extrabold text-xl focus:outline-none focus:border-cricket-teal disabled:opacity-60"
                    />
                    {/* Quick Preset Buttons */}
                    <div className="flex gap-1 shrink-0">
                      {[6, 8, 10, 12, 15, 20].map((ov) => (
                        <button
                          key={ov}
                          type="button"
                          disabled={!isOrganizer && !isSuperAdmin}
                          onClick={() =>
                            setAuctionRules({
                              ...auctionRules,
                              matchOvers: ov,
                              maxBowlerOvers: Math.max(1, Math.ceil(ov / 5)),
                            })
                          }
                          className={`px-2 py-1.5 rounded-lg text-xs font-extrabold border transition-all ${
                            auctionRules.matchOvers === ov
                              ? 'bg-cricket-teal text-cricket-dark border-cricket-teal shadow'
                              : 'bg-cricket-dark border-cricket-border text-cricket-muted hover:text-white'
                          }`}
                        >
                          {ov}
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="text-[11px] text-cricket-muted">Supports 6, 8, 10, 12, 15, 20 overs or custom overs.</p>
                </div>

                {/* Max Bowler Overs Limit */}
                <div className="p-4 rounded-2xl bg-cricket-dark/80 border border-cricket-border space-y-2">
                  <label className="text-xs font-bold text-gray-300 uppercase block">
                    Max Bowler Overs (Quota)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={auctionRules.matchOvers || 20}
                    disabled={!isOrganizer && !isSuperAdmin}
                    value={auctionRules.maxBowlerOvers}
                    onChange={(e) => setAuctionRules({ ...auctionRules, maxBowlerOvers: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-cricket-card border border-cricket-border text-emerald-400 font-display font-extrabold text-xl focus:outline-none focus:border-emerald-400 disabled:opacity-60"
                  />
                  <p className="text-[11px] text-cricket-muted">Maximum bowling quota per individual bowler in an innings.</p>
                </div>

                {/* Wide Ball Penalty Rule */}
                <div className="p-4 rounded-2xl bg-cricket-dark/80 border border-cricket-border space-y-2">
                  <label className="text-xs font-bold text-gray-300 uppercase block">
                    Wide Ball Penalty
                  </label>
                  <input
                    type="text"
                    disabled={!isOrganizer && !isSuperAdmin}
                    value={auctionRules.wideBallPenalty}
                    onChange={(e) => setAuctionRules({ ...auctionRules, wideBallPenalty: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-cricket-card border border-cricket-border text-white font-medium text-sm focus:outline-none focus:border-cricket-teal disabled:opacity-60"
                  />
                  <p className="text-[11px] text-cricket-muted">Protocol for deliveries outside the legal wide guideline.</p>
                </div>

                {/* No-Ball Penalty Rule */}
                <div className="p-4 rounded-2xl bg-cricket-dark/80 border border-cricket-border space-y-2">
                  <label className="text-xs font-bold text-gray-300 uppercase block">
                    No-Ball Penalty
                  </label>
                  <input
                    type="text"
                    disabled={!isOrganizer && !isSuperAdmin}
                    value={auctionRules.noBallPenalty}
                    onChange={(e) => setAuctionRules({ ...auctionRules, noBallPenalty: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-cricket-card border border-cricket-border text-white font-medium text-sm focus:outline-none focus:border-cricket-teal disabled:opacity-60"
                  />
                  <p className="text-[11px] text-cricket-muted">Protocol and bonus for crease or height violations.</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-cricket-border">
                <div className="text-xs text-cricket-muted">
                  {isOrganizer || isSuperAdmin ? (
                    <span>💡 Saving will dynamically update the Tournament Portal, Matches Center, Scorecard limits, and Live Auction Room.</span>
                  ) : (
                    <span className="text-amber-400 font-semibold">🔒 Sign in as Super Admin or Organizer to modify tournament rules &amp; overs.</span>
                  )}
                </div>

                {(isOrganizer || isSuperAdmin) && (
                  <button
                    type="submit"
                    disabled={isSavingRules}
                    className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-cricket-dark font-display font-black text-sm shadow-xl hover:brightness-110 transition-all active:scale-95 disabled:opacity-60"
                  >
                    {isSavingRules ? 'Saving Rules & Overs...' : 'Save & Publish Playing Conditions'}
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Playing Conditions & Rules */}
          <div className="glass-card p-6 sm:p-8 space-y-6 border border-cricket-border shadow-xl">
            <div className="flex items-center justify-between border-b border-cricket-border pb-4">
              <h3 className="font-display font-bold text-2xl text-white">
                Match Playing Conditions ({selectedTournament.toUpperCase()} {selectedSeason})
              </h3>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase">
                Active Protocol
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 text-sm">
              <div className="p-4 rounded-xl bg-cricket-dark/80 border border-cricket-border space-y-1">
                <span className="text-xs font-semibold text-cricket-muted uppercase">Innings Overs</span>
                <div className="font-display font-black text-2xl text-white">
                  {auctionRules.matchOvers} Overs
                </div>
                <p className="text-[11px] text-gray-400">Fixed overs per side for regular matches.</p>
              </div>

              <div className="p-4 rounded-xl bg-cricket-dark/80 border border-cricket-border space-y-1">
                <span className="text-xs font-semibold text-cricket-muted uppercase">Squad Size Limits</span>
                <div className="font-display font-black text-2xl text-white">
                  {auctionRules.minSquadSize} - {auctionRules.maxSquadSize} Players
                </div>
                <p className="text-[11px] text-gray-400">Strictly enforced in auction and roster validation.</p>
              </div>

              <div className="p-4 rounded-xl bg-cricket-dark/80 border border-cricket-border space-y-1">
                <span className="text-xs font-semibold text-cricket-muted uppercase">Max Bowler Overs</span>
                <div className="font-display font-black text-2xl text-white">
                  {auctionRules.maxBowlerOvers} Overs / Bowler
                </div>
                <p className="text-[11px] text-gray-400">Maximum spell quota per bowler.</p>
              </div>

              <div className="p-4 rounded-xl bg-cricket-dark/80 border border-cricket-border space-y-1">
                <span className="text-xs font-semibold text-cricket-muted uppercase">Wide Ball Penalty</span>
                <div className="font-display font-black text-2xl text-white">
                  {auctionRules.wideBallPenalty}
                </div>
                <p className="text-[11px] text-gray-400">Does not count as a legal ball in over.</p>
              </div>

              <div className="p-4 rounded-xl bg-cricket-dark/80 border border-cricket-border space-y-1">
                <span className="text-xs font-semibold text-cricket-muted uppercase">No-Ball Penalty</span>
                <div className="font-display font-black text-2xl text-white">
                  {auctionRules.noBallPenalty}
                </div>
                <p className="text-[11px] text-gray-400">Next delivery is an official Free Hit.</p>
              </div>

              <div className="p-4 rounded-xl bg-cricket-dark/80 border border-cricket-border space-y-1">
                <span className="text-xs font-semibold text-cricket-muted uppercase">Points per Win</span>
                <div className="font-display font-black text-2xl text-cricket-gold">
                  {auctionRules.pointsPerWin} Points
                </div>
                <p className="text-[11px] text-gray-400">Win: {auctionRules.pointsPerWin} pts, Tie / No Result: {Math.max(1, Math.floor(auctionRules.pointsPerWin / 2))} pt, Loss: 0 pts.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: USER ROLES & ACCESS MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'roles' && (
        <div className="space-y-6">
          {/* Information & Explanation Box */}
          <div className="p-5 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-200 text-sm space-y-2">
            <div className="flex items-center gap-2 font-bold text-white text-base">
              <ShieldCheck className="w-5 h-5 text-cricket-teal" />
              <span>How Role Assignment Works for Any Email (Gmail, Yahoo, Outlook, etc.)</span>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              When any employee or tournament participant registers using their personal Gmail or email address, they are <strong className="text-white">automatically created with the safe default role: Spectator / Player (<code>user</code>)</strong>. They can view matches, follow live auctions, and manage their player profile, but they cannot score matches or modify tournament configurations.
            </p>
            <p className="text-xs text-gray-300 leading-relaxed">
              As an Administrator, you can promote any registered Gmail user below into an <strong className="text-cricket-teal">Organizer</strong> (giving full admin and auction hammer access) or a <strong className="text-emerald-400">Scorer</strong> (giving live touch scoring dial access for matches).
            </p>
          </div>

          {/* Quick Grant Privilege Form */}
          <div className="glass-card p-6 border border-cricket-border shadow-xl space-y-4">
            <h3 className="font-display font-bold text-xl text-white flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-cricket-teal" />
              <span>Grant Role Privileges to Email</span>
            </h3>

            <form onSubmit={handleAddUserPrivilege} className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-sm">
              <div className="space-y-1.5 sm:col-span-1">
                <label className="text-xs font-semibold text-gray-300">User Full Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-cricket-dark border border-cricket-border text-white text-sm"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-gray-300">Registered Email Address (Gmail, Yahoo, etc.) *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. colleague.cricket@gmail.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-cricket-dark border border-cricket-border text-white text-sm focus:outline-none focus:border-cricket-teal"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-1">
                <label className="text-xs font-semibold text-gray-300">Assign Role</label>
                <div className="flex gap-2">
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as any)}
                    className="flex-1 px-3 py-2 rounded-xl bg-cricket-dark border border-cricket-border text-white text-sm font-bold"
                  >
                    <option value="organizer">Organizer</option>
                    <option value="scorer">Official Scorer</option>
                    <option value="user">Spectator / Player</option>
                  </select>
                  <button
                    type="submit"
                    disabled={!isSuperAdmin}
                    className={`px-4 py-2 rounded-xl text-cricket-dark font-extrabold text-xs shadow shrink-0 ${
                      isSuperAdmin
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:brightness-110 cursor-pointer'
                        : 'bg-gray-600 opacity-50 cursor-not-allowed text-gray-300'
                    }`}
                    title={!isSuperAdmin ? 'Only Master Super Admin can grant roles' : 'Assign role'}
                  >
                    {isSuperAdmin ? 'Assign' : 'Admin Only'}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* User Roster Table */}
          <div className="glass-card overflow-hidden border border-cricket-border shadow-2xl">
            <div className="p-4 bg-cricket-card/80 border-b border-cricket-border flex items-center justify-between">
              <div>
                <span className="font-display font-bold text-xl text-white">Registered Users &amp; Active Roles ({userAccounts.length})</span>
                <p className="text-xs text-cricket-muted">Manage roles across all registered Gmail / personal email accounts</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-cricket-dark/80 text-xs font-semibold text-cricket-muted uppercase border-b border-cricket-border">
                  <tr>
                    <th className="px-5 py-3">User Name</th>
                    <th className="px-5 py-3">Registered Email</th>
                    <th className="px-5 py-3">Joined Date</th>
                    <th className="px-5 py-3">Current System Role</th>
                    <th className="px-5 py-3 text-right">Change Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cricket-border/60">
                  {userAccounts.map((u) => {
                    const roleBadgeClass =
                      u.role === 'super_admin'
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                        : u.role === 'organizer'
                        ? 'bg-cricket-teal/20 text-cricket-teal border-cricket-teal/40'
                        : u.role === 'scorer'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-gray-500/20 text-gray-300 border-gray-500/30';

                    return (
                      <tr key={u.id} className="hover:bg-cricket-card/40 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-white flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-cricket-teal/20 text-cricket-teal flex items-center justify-center font-bold text-xs">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <span>{u.name}</span>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-xs text-gray-300">
                          {u.email}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-cricket-muted">
                          {u.joinedDate}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`px-2.5 py-1 rounded-full border text-xs font-bold uppercase tracking-wider ${roleBadgeClass}`}>
                            {u.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <select
                            value={u.role}
                            disabled={!isSuperAdmin}
                            onChange={(e) => handleUpdateUserRole(u.email, e.target.value as any)}
                            className={`px-3 py-1.5 rounded-lg bg-cricket-dark border border-cricket-border text-white text-xs font-bold ${
                              isSuperAdmin ? 'cursor-pointer hover:border-cricket-teal' : 'opacity-60 cursor-not-allowed'
                            }`}
                            title={!isSuperAdmin ? 'Only Master Super Admin can change user roles' : 'Change role'}
                          >
                            <option value="organizer">Promote to Organizer</option>
                            <option value="scorer">Assign as Scorer</option>
                            <option value="user">Demote to Spectator</option>
                            <option value="super_admin">Set Super Admin</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
