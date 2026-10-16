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
  Award,
  KeyRound,
  Copy,
  Check,
  Lock,
  X,
  Play,
  Pause,
  Square,
  Radio,
  ToggleLeft,
  ToggleRight,
  Eye,
  Flame,
  Clock,
  MapPin,
  Save
} from 'lucide-react';
import { invalidateClientCache } from '@/lib/clientCache';

interface TeamItem {
  id: string;
  name: string;
  short: string;
  owner: string;
  ownerEmail?: string;
  captain: string;
  viceCaptain: string;
  budget: number;
  squadCount: number;
}

interface MatchItem {
  id: string;
  matchNumber: number;
  stage?: string;
  group?: string | null;
  title?: string;
  teamA: string;
  teamB: string;
  round: string;
  venue: string;
  overs: number;
  matchDate?: string | null;
  matchTime?: string | null;
  status: 'upcoming' | 'live' | 'completed' | 'postponed' | 'abandoned';
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
  const [selectedTournament, setSelectedTournament] = useState<string>('ddpl');
  const [selectedSeason, setSelectedSeason] = useState('2026');
  const [tournamentsList, setTournamentsList] = useState<any[]>([
    { slug: 'ddpl', name: 'DDPL', shortName: 'DDPL', fullName: 'Desk to Dugout Premier League (DDPL)', season: '2026', status: 'open' },
    { slug: 'game-of-run', name: 'Game of RUN', shortName: 'GOR', fullName: 'Game of RUN Championship', season: '2026', status: 'upcoming' },
  ]);
  const [isCreateTournamentModalOpen, setIsCreateTournamentModalOpen] = useState(false);
  const [isCreatingTournament, setIsCreatingTournament] = useState(false);
  const [newTournamentForm, setNewTournamentForm] = useState({
    name: '',
    shortName: '',
    fullName: '',
    tagline: '',
    season: '2027',
    format: 'ddpl' as 'ddpl' | 'game-of-run',
    overs: 10,
    pursePerTeam: 10000,
    ownerBasePrice: 500,
    maxSquad: 11,
    minSquad: 7,
    startDate: '',
    endDate: '',
    status: 'open' as any,
  });

  // Success Notification banner
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Super Admin Password Management State
  const [resetModalUser, setResetModalUser] = useState<{ id: string; email: string; name: string } | null>(null);
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [adminResetLoading, setAdminResetLoading] = useState(false);
  const [generatedBypassLink, setGeneratedBypassLink] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTournamentForm.name.trim()) {
      alert('Please enter a tournament name (e.g. DDPL 2027, DDPL 2027 2.0, Game of RUN 2028).');
      return;
    }
    setIsCreatingTournament(true);
    try {
      const res = await fetch('/api/tournaments/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_tournament',
          ...newTournamentForm,
        }),
      });
      const data = await res.json();
      if (data.success && data.tournament) {
        if (data.tournamentsList) {
          setTournamentsList(data.tournamentsList);
        } else {
          setTournamentsList((prev) => [...prev, data.tournament]);
        }
        setSelectedTournament(data.tournament.slug);
        setIsCreateTournamentModalOpen(false);
        showNotification(`🎉 Tournament "${data.tournament.name}" created successfully! All modules initialized.`);
        setNewTournamentForm({
          name: '',
          shortName: '',
          fullName: '',
          tagline: '',
          season: '2027',
          format: 'ddpl',
          overs: 10,
          pursePerTeam: 10000,
          ownerBasePrice: 500,
          maxSquad: 11,
          minSquad: 7,
          startDate: '',
          endDate: '',
          status: 'open',
        });
      } else {
        alert(data.error || 'Failed to create tournament');
      }
    } catch (err: any) {
      alert(`Error creating tournament: ${err.message}`);
    } finally {
      setIsCreatingTournament(false);
    }
  };

  const handleDeleteTournament = async (slug: string, name: string) => {
    if (slug === 'ddpl' || slug === 'game-of-run') {
      alert('Default tournaments (DDPL, Game of RUN) cannot be deleted.');
      return;
    }
    if (!confirm(`Are you sure you want to permanently delete tournament "${name}"? This will delete all its data.`)) {
      return;
    }
    try {
      const res = await fetch('/api/tournaments/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_tournament',
          slug,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.tournamentsList) {
          setTournamentsList(data.tournamentsList);
        } else {
          setTournamentsList((prev) => prev.filter((t) => t.slug !== slug));
        }
        setSelectedTournament('ddpl');
        showNotification(`Tournament "${name}" deleted.`);
      } else {
        alert(data.error || 'Failed to delete tournament');
      }
    } catch (err: any) {
      alert(`Error deleting tournament: ${err.message}`);
    }
  };


  // --- 1. TEAMS STATE ---
  const [teams, setTeams] = useState<TeamItem[]>([]);

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
  const [tournamentStatus, setTournamentStatus] = useState<string>('open');
  const [tournamentRegistrations, setTournamentRegistrations] = useState<any[]>([]);

  const handleUpdateTournamentStatus = async (newStatus: string) => {
    try {
      const res = await fetch('/api/tournaments/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_status',
          tournament: selectedTournament,
          status: newStatus,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTournamentStatus(newStatus);
        showNotification(`Tournament status updated to "${newStatus.toUpperCase()}"!`);
      }
    } catch (err: any) {
      alert(`Error updating tournament status: ${err.message}`);
    }
  };

  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim() || !newTeamShort.trim()) return;

    // Check if owner was selected from registered players
    const selectedPlayer = tournamentRegistrations.find(
      (r) =>
        r.name.toLowerCase() === newTeamOwner.trim().toLowerCase() ||
        r.email.toLowerCase() === newTeamOwner.trim().toLowerCase()
    );

    const ownerName = selectedPlayer?.name || newTeamOwner.trim() || 'Team Management';
    const ownerEmail = selectedPlayer?.email || `${ownerName.toLowerCase().replace(/\s+/g, '')}@cricplus.com`;

    try {
      const res = await fetch('/api/tournaments/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'assign_franchise',
          tournament: selectedTournament,
          teamName: newTeamName.trim(),
          shortName: newTeamShort.trim().toUpperCase(),
          ownerName,
          ownerEmail,
        }),
      });

      const data = await res.json();
      if (data.success && data.teams) {
        setTeams(
          data.teams.map((t: any) => ({
            id: t.id,
            name: t.name,
            short: t.short,
            owner: t.owner,
            captain: t.owner ? `${t.owner} (C)` : `${t.name} (C)`,
            viceCaptain: 'To be assigned',
            budget: t.allocated || 10000,
            squadCount: t.playersBought || 1,
          }))
        );
        showNotification(
          `Franchise "${newTeamName.trim()}" created! ${ownerName} assigned as Owner & Player #1 (₹500 blocked, ₹9,500 purse).`
        );
      } else {
        const newTeam: TeamItem = {
          id: `t-${Date.now()}`,
          name: newTeamName.trim(),
          short: newTeamShort.trim().toUpperCase(),
          owner: ownerName,
          captain: `${ownerName} (C)`,
          viceCaptain: 'To be assigned',
          budget: 10000,
          squadCount: 1,
        };
        setTeams([...teams, newTeam]);
        showNotification(`Franchise "${newTeam.name}" created!`);
      }
    } catch {
      const newTeam: TeamItem = {
        id: `t-${Date.now()}`,
        name: newTeamName.trim(),
        short: newTeamShort.trim().toUpperCase(),
        owner: ownerName,
        captain: `${ownerName} (C)`,
        viceCaptain: 'To be assigned',
        budget: 10000,
        squadCount: 1,
      };
      setTeams([...teams, newTeam]);
    }

    invalidateClientCache();
    setNewTeamName('');
    setNewTeamShort('');
    setNewTeamOwner('');
  };

  const [isDeletingTeamId, setIsDeletingTeamId] = useState<string | null>(null);

  const handleDeleteTeam = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This will also remove the franchise from the auction, release its assigned owner, and clear its scheduled matches.`)) return;

    setIsDeletingTeamId(id);
    try {
      const res = await fetch('/api/tournaments/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_franchise',
          tournament: selectedTournament,
          teamId: id,
          teamName: name,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTeams((prev) => prev.filter((t) => t.id !== id));
        if (data.teams) {
          setTeams(
            data.teams.map((t: any) => ({
              id: t.id,
              name: t.name,
              short: t.short,
              owner: t.owner || 'Franchise Owner',
              ownerEmail: t.ownerEmail,
              captain: t.captain || `${t.owner || t.name} (C)`,
              viceCaptain: t.viceCaptain || 'To be assigned',
              budget: t.allocated || 10000,
              squadCount: t.playersBought || 1,
            }))
          );
        }
        // Refresh registered players to release owner badge
        const regRes = await fetch(`/api/tournaments/register?tournament=${selectedTournament}`);
        if (regRes.ok) {
          const regData = await regRes.json();
          if (regData.registrations) setTournamentRegistrations(regData.registrations);
        }
        invalidateClientCache();
        showNotification(`Franchise "${name}" and all related auction data deleted.`);
      } else {
        alert(data.error || 'Failed to delete franchise');
      }
    } catch (err: any) {
      alert(`Error deleting franchise: ${err.message}`);
    } finally {
      setIsDeletingTeamId(null);
    }
  };

  // --- Reset Tournament Data State & Handler ---
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetRegistrationsCheck, setResetRegistrationsCheck] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleResetTournamentData = async () => {
    setIsResetting(true);
    try {
      const res = await fetch('/api/tournaments/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset_tournament_data',
          tournament: selectedTournament,
          resetRegistrations: resetRegistrationsCheck,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTeams([]);
        setSoldTransactions([]);
        setMatches([]);
        if (resetRegistrationsCheck) {
          setTournamentRegistrations([]);
          setPlayers([]);
        } else {
          // Re-fetch registrations to show owners unlinked
          const regRes = await fetch(`/api/tournaments/register?tournament=${selectedTournament}`);
          if (regRes.ok) {
            const regData = await regRes.json();
            if (regData.registrations) setTournamentRegistrations(regData.registrations);
          }
        }
        invalidateClientCache();
        setIsResetModalOpen(false);
        showNotification(`Tournament data wiped cleanly! Ready for fresh entries or Excel sheet import.`);
      } else {
        alert(data.error || 'Failed to reset tournament data');
      }
    } catch (err: any) {
      alert(`Error resetting tournament data: ${err.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  // --- AUCTION LIVE CONTROLS & FRANCHISE BIDDING ACCESS ---
  const [auctionStatus, setAuctionStatus] = useState<'live' | 'paused' | 'stopped'>('live');
  const [biddingAccessEnabled, setBiddingAccessEnabled] = useState(true);
  const [teamBiddingAccess, setTeamBiddingAccess] = useState<Record<string, boolean>>({});

  const handleToggleMasterAuctionStatus = async (status: 'live' | 'paused' | 'stopped') => {
    try {
      setAuctionStatus(status);
      await fetch(`/api/auction/data?tournament=${selectedTournament}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auctionStatus: status,
          timerRunning: status === 'live',
        }),
      });
      showNotification(`Live Auction status updated to ${status.toUpperCase()}!`);
    } catch (err: any) {
      alert(`Failed to update auction status: ${err.message}`);
    }
  };

  const handleToggleMasterBidding = async (enabled: boolean) => {
    try {
      setBiddingAccessEnabled(enabled);
      await fetch(`/api/auction/data?tournament=${selectedTournament}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ biddingAccessEnabled: enabled }),
      });
      showNotification(enabled ? 'All Franchise Bidding Enabled!' : 'Franchise Bidding Globally Locked!');
    } catch (err: any) {
      alert(`Failed to update bidding access: ${err.message}`);
    }
  };

  const handleToggleTeamBidding = async (teamId: string, teamName: string) => {
    const currentAccess = teamBiddingAccess[teamId] !== false; // default true
    const newAccess = !currentAccess;
    const updated = { ...teamBiddingAccess, [teamId]: newAccess };
    setTeamBiddingAccess(updated);

    try {
      await fetch(`/api/auction/data?tournament=${selectedTournament}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamBiddingAccess: updated }),
      });
      showNotification(
        newAccess
          ? `Bidding access GRANTED for ${teamName}!`
          : `Bidding access REVOKED for ${teamName}!`
      );
    } catch (err: any) {
      alert(`Failed to update team bidding access: ${err.message}`);
    }
  };

  // --- 2. MATCH FIXTURES & TOURNAMENT SCHEDULING STATE ---
  const [tournamentStartDate, setTournamentStartDate] = useState<string>('');
  const [tournamentEndDate, setTournamentEndDate] = useState<string>('');
  const [matches, setMatches] = useState<MatchItem[]>([]);

  const [manualTeamA, setManualTeamA] = useState('');
  const [manualTeamB, setManualTeamB] = useState('');
  const [manualVenue, setManualVenue] = useState('Arena Ground 1');
  const [manualOvers, setManualOvers] = useState(10);
  const [manualDate, setManualDate] = useState('');
  const [manualTime, setManualTime] = useState('10:00 AM');
  const [savingMatchId, setSavingMatchId] = useState<string | null>(null);
  const [isGeneratingFixtures, setIsGeneratingFixtures] = useState(false);

  // Tournament Start / End Dates handlers (set, unset, rearrange)
  const handleSaveTournamentDates = async (start: string, end: string) => {
    try {
      await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_tournament_dates',
          tournament: selectedTournament,
          startDate: start || null,
          endDate: end || null,
        }),
      });
      setTournamentStartDate(start);
      setTournamentEndDate(end);
      showNotification(
        start && end
          ? `Tournament dates updated: ${start} to ${end}`
          : 'Tournament dates saved successfully!'
      );
    } catch (err: any) {
      alert(`Error updating tournament dates: ${err.message}`);
    }
  };

  const handleUnsetTournamentDates = async () => {
    await handleSaveTournamentDates('', '');
    showNotification('Tournament dates have been unset/cleared.');
  };

  // Smart Auto Fixture Generator based on Format (DDPL vs Game of RUN)
  const handleGenerateTournamentFixtures = async () => {
    if (teams.length < 2) {
      alert('You need at least 2 teams to generate fixtures.');
      return;
    }

    setIsGeneratingFixtures(true);
    try {
      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_schedule',
          tournament: selectedTournament,
          teams: teams.map((t) => ({ id: t.id, name: t.name, short: t.short })),
          overs: auctionRules.matchOvers || (selectedTournament === 'ddpl' ? 10 : 12),
        }),
      });

      const data = await res.json();
      if (data.success && data.schedule?.matches) {
        setMatches(
          data.schedule.matches.map((m: any) => ({
            id: m.id,
            matchNumber: m.matchNumber,
            stage: m.stage,
            group: m.group,
            title: m.title,
            teamA: m.teamA?.name || m.teamA,
            teamB: m.teamB?.name || m.teamB,
            round: m.stage || `Match ${m.matchNumber}`,
            venue: m.venue || 'Arena Ground 1',
            overs: selectedTournament === 'ddpl' ? (auctionRules.matchOvers || 10) : 12,
            matchDate: m.matchDate || null,
            matchTime: m.matchTime || '10:00 AM',
            status: m.status || 'upcoming',
          }))
        );
        showNotification(
          `Generated ${data.schedule.matches.length} fixtures for ${selectedTournament.toUpperCase()} format!`
        );
      } else {
        alert(data.error || 'Failed to generate fixtures');
      }
    } catch (err: any) {
      alert(`Error generating fixtures: ${err.message}`);
    } finally {
      setIsGeneratingFixtures(false);
    }
  };

  // Inline Match Update (Date, Time, Venue, Status)
  const handleSaveMatchUpdates = async (matchId: string, updates: Partial<MatchItem>) => {
    setSavingMatchId(matchId);
    try {
      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_match',
          tournament: selectedTournament,
          matchId,
          updates,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMatches((prev) =>
          prev.map((m) => (m.id === matchId ? { ...m, ...updates } : m))
        );
        showNotification(`Match updated successfully!`);
      } else {
        alert(data.error || 'Failed to update match');
      }
    } catch (err: any) {
      alert(`Error updating match: ${err.message}`);
    } finally {
      setSavingMatchId(null);
    }
  };

  const handleAddManualMatch = async (e: React.FormEvent) => {
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
      matchDate: manualDate || null,
      matchTime: manualTime || '10:00 AM',
      status: 'upcoming',
    };

    const updated = [...matches, newMatch];
    setMatches(updated);

    try {
      await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_all_matches',
          tournament: selectedTournament,
          matches: updated.map((m) => ({
            id: m.id,
            matchNumber: m.matchNumber,
            tournament: selectedTournament,
            stage: m.stage || 'League',
            group: m.group || null,
            title: m.title || `${m.teamA} vs ${m.teamB}`,
            teamA: { name: m.teamA, short: m.teamA.split(' ').map((w) => w[0]).join('') },
            teamB: { name: m.teamB, short: m.teamB.split(' ').map((w) => w[0]).join('') },
            venue: m.venue,
            matchDate: m.matchDate,
            matchTime: m.matchTime,
            status: m.status,
          })),
        }),
      });
      showNotification(`Fixture added: ${newMatch.teamA} vs ${newMatch.teamB}`);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleDeleteMatch = async (id: string) => {
    const updated = matches.filter((m) => m.id !== id);
    setMatches(updated);

    try {
      await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_all_matches',
          tournament: selectedTournament,
          matches: updated.map((m) => ({
            id: m.id,
            matchNumber: m.matchNumber,
            tournament: selectedTournament,
            stage: m.stage || 'League',
            group: m.group || null,
            title: m.title || `${m.teamA} vs ${m.teamB}`,
            teamA: { name: m.teamA, short: m.teamA.split(' ').map((w) => w[0]).join('') },
            teamB: { name: m.teamB, short: m.teamB.split(' ').map((w) => w[0]).join('') },
            venue: m.venue,
            matchDate: m.matchDate,
            matchTime: m.matchTime,
            status: m.status,
          })),
        }),
      });
      showNotification('Fixture removed.');
    } catch (err: any) {
      console.error(err);
    }
  };

  // --- 3. PLAYERS & REGISTRATIONS STATE ---
  const [players, setPlayers] = useState<PlayerItem[]>([]);

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

  // Fetch real registered users, backend auction rules, tournament teams, and fixtures schedule
  useEffect(() => {
    async function loadAdminData() {
      try {
        const [rolesRes, rulesRes, auctionRes, regRes, matchesRes] = await Promise.all([
          fetch('/api/admin/roles'),
          fetch(`/api/admin/rules?tournament=${selectedTournament}`),
          fetch(`/api/auction/data?tournament=${selectedTournament}`),
          fetch(`/api/tournaments/register?tournament=${selectedTournament}`),
          fetch(`/api/matches?tournament=${selectedTournament}`),
        ]);

        if (regRes.ok) {
          const regData = await regRes.json();
          if (regData.config?.status) setTournamentStatus(regData.config.status);
          if (regData.registrations) setTournamentRegistrations(regData.registrations);
          if (regData.tournamentsList && regData.tournamentsList.length > 0) {
            setTournamentsList(regData.tournamentsList);
          }
        }

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
            if (aData.data.auctionStatus) setAuctionStatus(aData.data.auctionStatus);
            if (aData.data.biddingAccessEnabled !== undefined) setBiddingAccessEnabled(aData.data.biddingAccessEnabled);
            if (aData.data.teamBiddingAccess) setTeamBiddingAccess(aData.data.teamBiddingAccess);

            // 1. Sync Franchise Teams
            if (aData.data.teams && aData.data.teams.length > 0) {
              const soldTransactionsList = aData.data.soldTransactions || [];
              setSoldTransactions(soldTransactionsList);

              const mappedTeams: TeamItem[] = aData.data.teams.map((t: any) => ({
                id: t.id,
                name: t.name,
                short: t.short,
                owner: t.owner || 'Franchise Owner',
                ownerEmail: t.ownerEmail,
                captain: t.captain || `${t.owner || t.name} (C)`,
                viceCaptain: t.viceCaptain || 'To be assigned',
                budget: t.allocated || 10000,
                squadCount: soldTransactionsList.filter((tx: any) => tx.team === t.name).length || t.playersBought || 1,
              }));
              setTeams(mappedTeams);
            } else {
              setTeams([]);
              setSoldTransactions([]);
            }

            // 2. Sync Registered Players Queue (Auction Pool) directly from active auction state
            if (aData.data.playerPool && Array.isArray(aData.data.playerPool) && aData.data.playerPool.length > 0) {
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
            } else {
              setPlayers([]);
            }
          } else {
            setTeams([]);
            setSoldTransactions([]);
            setPlayers([]);
          }
        }

        if (matchesRes.ok) {
          const mData = await matchesRes.json();
          if (mData.schedule) {
            setTournamentStartDate(mData.schedule.startDate || '');
            setTournamentEndDate(mData.schedule.endDate || '');
            if (mData.schedule.matches && mData.schedule.matches.length > 0) {
              setMatches(
                mData.schedule.matches.map((m: any) => ({
                  id: m.id,
                  matchNumber: m.matchNumber,
                  stage: m.stage,
                  group: m.group,
                  title: m.title,
                  teamA: m.teamA?.name || m.teamA,
                  teamB: m.teamB?.name || m.teamB,
                  round: m.stage || `Match ${m.matchNumber}`,
                  venue: m.venue || 'Arena Ground 1',
                  overs: selectedTournament === 'ddpl' ? 10 : 12,
                  matchDate: m.matchDate || null,
                  matchTime: m.matchTime || '10:00 AM',
                  status: m.status || 'upcoming',
                }))
              );
            } else {
              setMatches([]);
            }
          } else {
            setMatches([]);
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

  const handleAdminResetPassword = async (email: string, newPassword: string) => {
    if (!newPassword || newPassword.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }
    setAdminResetLoading(true);
    try {
      const res = await fetch('/api/admin/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification(data.message || `Password for ${email} reset successfully!`);
        setResetModalUser(null);
        setAdminNewPassword('');
        setGeneratedBypassLink(null);
      } else {
        alert(data.error || 'Failed to reset password');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating password');
    } finally {
      setAdminResetLoading(false);
    }
  };

  const handleAdminGenerateBypassLink = async (email: string) => {
    setAdminResetLoading(true);
    try {
      const res = await fetch('/api/admin/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, generateLinkOnly: true }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.actionLink) {
        setGeneratedBypassLink(data.actionLink);
        showNotification(`Bypass link generated for ${email}!`);
      } else {
        alert(data.error || 'Failed to generate bypass link');
      }
    } catch (err: any) {
      alert(err.message || 'Error generating link');
    } finally {
      setAdminResetLoading(false);
    }
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
          <div className="flex items-center gap-2">
            <select
              value={selectedTournament}
              onChange={(e) => setSelectedTournament(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-cricket-dark border border-cricket-border text-white text-xs font-bold"
            >
              {tournamentsList.map((t) => (
                <option key={t.slug} value={t.slug}>
                  {t.name} {t.season ? `(${t.season})` : ''}
                </option>
              ))}
            </select>
            {isSuperAdmin && (
              <button
                type="button"
                onClick={() => setIsCreateTournamentModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-300 text-xs font-bold shadow-md transition-all active:scale-95"
                title="Create a new custom tournament"
              >
                <PlusCircle className="w-4 h-4 text-emerald-400" />
                <span>New Tournament</span>
              </button>
            )}
            {isSuperAdmin && selectedTournament !== 'ddpl' && selectedTournament !== 'game-of-run' && (
              <button
                type="button"
                onClick={() => {
                  const curr = tournamentsList.find((t) => t.slug === selectedTournament);
                  handleDeleteTournament(selectedTournament, curr?.name || selectedTournament);
                }}
                className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold transition-all"
                title="Delete this custom tournament"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              </button>
            )}
          </div>
          <select
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-cricket-dark border border-cricket-border text-white text-xs font-bold"
          >
            <option value="2026">Season 2026 (Active)</option>
            <option value="2025">Season 2025 (Archive)</option>
          </select>

          {/* Tournament Registration Gatekeeper (Super Admin) */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-cricket-dark border border-cricket-border text-xs">
            <span className="text-cricket-muted font-bold">Status:</span>
            <select
              value={tournamentStatus}
              onChange={(e) => handleUpdateTournamentStatus(e.target.value)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                tournamentStatus === 'open'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                  : tournamentStatus === 'upcoming'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : 'bg-cricket-card text-gray-300 border-cricket-border'
              }`}
            >
              <option value="open">● Registration Open</option>
              <option value="upcoming">Upcoming Tournament</option>
              <option value="closed">Registration Closed</option>
              <option value="auction">● Auction Live</option>
              <option value="ongoing">● Tournament Ongoing</option>
              <option value="completed">Completed</option>
            </select>
          </div>
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
        <div className="rounded-3xl p-5 sm:p-6 bg-[#0D1B2A]/90 backdrop-blur-md border border-[#D8AD55]/25 shadow-xl space-y-1">
          <div className="text-xs text-[#8793A5] font-bold uppercase tracking-wider">Franchises</div>
          <div className="font-display font-black text-3xl sm:text-4xl text-white">{teams.length} <span className="text-xs text-[#8793A5] font-normal">Teams</span></div>
        </div>
        <div className="rounded-3xl p-5 sm:p-6 bg-[#0D1B2A]/90 backdrop-blur-md border border-emerald-500/30 shadow-xl space-y-1">
          <div className="text-xs text-[#8793A5] font-bold uppercase tracking-wider">Scheduled Fixtures</div>
          <div className="font-display font-black text-3xl sm:text-4xl text-white">{matches.length} <span className="text-xs text-emerald-400 font-normal">Matches</span></div>
        </div>
        <div className="rounded-3xl p-5 sm:p-6 bg-[#0D1B2A]/90 backdrop-blur-md border border-[#D8AD55]/40 shadow-xl space-y-1">
          <div className="text-xs text-[#8793A5] font-bold uppercase tracking-wider">Auction Player Pool</div>
          <div className="font-display font-black text-3xl sm:text-4xl text-[#F2D69A]">{players.filter(p => p.status === 'approved').length} <span className="text-xs text-[#D8AD55] font-normal">Ready</span></div>
        </div>
        <div className="rounded-3xl p-5 sm:p-6 bg-[#0D1B2A]/90 backdrop-blur-md border border-purple-500/30 shadow-xl space-y-1">
          <div className="text-xs text-[#8793A5] font-bold uppercase tracking-wider">Pending Registrations</div>
          <div className="font-display font-black text-3xl sm:text-4xl text-purple-300">{players.filter(p => p.status === 'pending').length} <span className="text-xs text-purple-400 font-normal">Queue</span></div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-[#D8AD55]/20 text-sm font-bold overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab('teams')}
          className={`flex items-center gap-2 px-6 py-4 border-b-2 font-display text-base sm:text-lg tracking-wide transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'teams'
              ? 'border-[#D8AD55] text-[#F2D69A] shadow-[0_2px_0_0_#D8AD55]'
              : 'border-transparent text-[#8793A5] hover:text-white'
          }`}
        >
          <Users className="w-5 h-5 text-[#D8AD55]" />
          <span>Franchises &amp; Teams ({teams.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('fixtures')}
          className={`flex items-center gap-2 px-6 py-4 border-b-2 font-display text-base sm:text-lg tracking-wide transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'fixtures'
              ? 'border-[#D8AD55] text-[#F2D69A] shadow-[0_2px_0_0_#D8AD55]'
              : 'border-transparent text-[#8793A5] hover:text-white'
          }`}
        >
          <Calendar className="w-5 h-5 text-[#D8AD55]" />
          <span>Fixtures &amp; Scheduling ({matches.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('players')}
          className={`flex items-center gap-2 px-6 py-4 border-b-2 font-display text-base sm:text-lg tracking-wide transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'players'
              ? 'border-[#D8AD55] text-[#F2D69A] shadow-[0_2px_0_0_#D8AD55]'
              : 'border-transparent text-[#8793A5] hover:text-white'
          }`}
        >
          <Gavel className="w-5 h-5 text-[#D8AD55]" />
          <span>Player Pool &amp; Approvals ({players.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('rules')}
          className={`flex items-center gap-2 px-6 py-4 border-b-2 font-display text-base sm:text-lg tracking-wide transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'rules'
              ? 'border-[#D8AD55] text-[#F2D69A] shadow-[0_2px_0_0_#D8AD55]'
              : 'border-transparent text-[#8793A5] hover:text-white'
          }`}
        >
          <Settings className="w-5 h-5 text-[#D8AD55]" />
          <span>Tournament Rules</span>
        </button>

        <button
          onClick={() => setActiveTab('roles')}
          className={`flex items-center gap-2 px-6 py-4 border-b-2 font-display text-base sm:text-lg tracking-wide transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'roles'
              ? 'border-[#D8AD55] text-[#F2D69A] shadow-[0_2px_0_0_#D8AD55]'
              : 'border-transparent text-[#8793A5] hover:text-white'
          }`}
        >
          <ShieldCheck className="w-5 h-5 text-[#D8AD55]" />
          <span>User Roles &amp; Permissions ({userAccounts.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: FRANCHISE & TEAMS MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'teams' && (
        <div className="space-y-8">
          {/* Master Live Auction & Franchise Bidding Controls */}
          <div className="glass-card p-6 sm:p-7 border border-cricket-teal/40 bg-gradient-to-r from-cricket-card via-cricket-dark to-cricket-card space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cricket-border pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                    <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                    Live Auction Command Center
                  </span>
                  <span
                    className={`px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider border ${
                      auctionStatus === 'live'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50 shadow-lg shadow-emerald-500/20 animate-pulse'
                        : auctionStatus === 'paused'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-red-500/20 text-red-300 border-red-500/40'
                    }`}
                  >
                    ● Status: {auctionStatus.toUpperCase()}
                  </span>
                </div>
                <h3 className="font-display font-extrabold text-2xl text-white">
                  Auction Controls &amp; Franchise Bidding Permission
                </h3>
                <p className="text-xs text-cricket-muted">
                  Super Admin controls live auction status, hammer, 30s auto-timer, and grants individual franchise owner bidding authorization.
                </p>
              </div>

              {/* Quick Link to Auction Room */}
              <Link
                href="/auction"
                target="_blank"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cricket-teal to-emerald-400 text-cricket-dark font-display font-bold text-sm shadow hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4" />
                <span>Launch Live Auction Room ↗</span>
              </Link>
            </div>

            {/* Auction Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-gray-300 mr-1">Live Auction Status:</span>
                <button
                  type="button"
                  onClick={() => handleToggleMasterAuctionStatus('live')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    auctionStatus === 'live'
                      ? 'bg-emerald-500 text-cricket-dark shadow-lg shadow-emerald-500/30'
                      : 'bg-cricket-dark text-gray-300 hover:text-white border border-cricket-border'
                  }`}
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start / Live Auction</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleMasterAuctionStatus('paused')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    auctionStatus === 'paused'
                      ? 'bg-amber-500 text-cricket-dark shadow-lg shadow-amber-500/30'
                      : 'bg-cricket-dark text-gray-300 hover:text-white border border-cricket-border'
                  }`}
                >
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>Pause Auction</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleMasterAuctionStatus('stopped')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    auctionStatus === 'stopped'
                      ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                      : 'bg-cricket-dark text-gray-300 hover:text-white border border-cricket-border'
                  }`}
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Stop Auction</span>
                </button>
              </div>

              {/* Master Global Bidding Switch */}
              <div className="flex items-center gap-3 bg-cricket-dark/80 px-4 py-2 rounded-xl border border-cricket-border">
                <span className="text-xs font-bold text-gray-300">Global Bidding Access:</span>
                <button
                  type="button"
                  onClick={() => handleToggleMasterBidding(!biddingAccessEnabled)}
                  className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    biddingAccessEnabled
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-red-500/20 text-red-300 border border-red-500/40'
                  }`}
                >
                  {biddingAccessEnabled ? (
                    <>
                      <ToggleRight className="w-4 h-4 text-emerald-400" />
                      <span>🟢 Bidding Enabled</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-4 h-4 text-red-400" />
                      <span>🔴 Bidding Locked</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

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
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-300">Franchise Owner</label>
                  <span className="text-[10px] text-amber-300 font-bold">Player #1 (₹500 blocked)</span>
                </div>
                {tournamentRegistrations.length > 0 ? (
                  <select
                    value={newTeamOwner}
                    onChange={(e) => setNewTeamOwner(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-cricket-dark border border-cricket-border text-white text-sm focus:outline-none focus:border-cricket-teal"
                  >
                    <option value="">-- Select from Registered Players --</option>
                    {tournamentRegistrations.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name} ({p.role}) {p.isOwner ? '• (Assigned)' : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="e.g. Tariq Ahmed"
                    value={newTeamOwner}
                    onChange={(e) => setNewTeamOwner(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-cricket-dark border border-cricket-border text-white text-sm focus:outline-none focus:border-cricket-teal"
                  />
                )}
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
            <div className="p-4 bg-cricket-card/80 border-b border-cricket-border flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="font-display font-bold text-xl text-white">Registered Teams in {selectedTournament.toUpperCase()}</span>
                <span className="block sm:inline sm:ml-3 text-xs text-cricket-muted font-bold">Default Purse: ₹10,000 • Owner Price: ₹500 Blocked</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                  title="Wipe tournament auction, teams, and matches data clean for fresh entry"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  <span>Reset Tournament Data</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm table-nums">
                <thead className="bg-cricket-dark/80 text-xs font-semibold text-cricket-muted uppercase border-b border-cricket-border">
                  <tr>
                    <th className="px-4 py-3.5">Code</th>
                    <th className="px-4 py-3.5">Team Name (Click to Edit Squad &amp; Leaders)</th>
                    <th className="px-4 py-3.5">Owner &amp; Login</th>
                    <th className="px-4 py-3.5 text-center">Bidding Access</th>
                    <th className="px-4 py-3.5">Captain</th>
                    <th className="px-4 py-3.5">Vice-Captain</th>
                    <th className="px-4 py-3.5 text-right">Budget</th>
                    <th className="px-4 py-3.5 text-center">Squad</th>
                    <th className="px-4 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cricket-border">
                  {teams.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-cricket-muted">
                        <div className="max-w-md mx-auto space-y-2">
                          <p className="text-base font-bold text-gray-300">No franchise teams registered yet</p>
                          <p className="text-xs">
                            Create teams above by assigning registered owners, or open the Live Auction room to import an entire tournament from an Excel sheet.
                          </p>
                          <div className="pt-2 flex justify-center gap-3">
                            <Link
                              href="/auction"
                              className="px-4 py-2 rounded-xl bg-cricket-teal/20 text-cricket-teal border border-cricket-teal/40 text-xs font-bold hover:bg-cricket-teal/30 transition-all"
                            >
                              📊 Import Excel Sheet in Auction Room
                            </Link>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    teams.map((t) => {
                    const isExpanded = expandedTeamId === t.id;
                    const teamSquad = soldTransactions.filter((tx) => tx.team === t.name);
                    const isBiddingAllowed = teamBiddingAccess[t.id] !== false && biddingAccessEnabled;

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
                          <td className="px-4 py-3.5 text-xs text-gray-300">
                            <div className="font-semibold text-white">{t.owner}</div>
                            {t.ownerEmail && (
                              <div className="text-[11px] text-cricket-muted">{t.ownerEmail}</div>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => handleToggleTeamBidding(t.id, t.name)}
                              className={`px-3 py-1 rounded-full text-xs font-bold transition-all border ${
                                isBiddingAllowed
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30 shadow-sm shadow-emerald-500/20'
                                  : 'bg-red-500/20 text-red-300 border-red-500/40 hover:bg-red-500/30'
                              }`}
                              title={isBiddingAllowed ? 'Click to revoke bidding access' : 'Click to grant bidding access'}
                            >
                              {isBiddingAllowed ? '🟢 Bidding Allowed' : '🔴 Locked'}
                            </button>
                          </td>
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
                              disabled={isDeletingTeamId === t.id}
                              className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50 cursor-pointer"
                              title="Delete Franchise"
                            >
                              {isDeletingTeamId === t.id ? (
                                <RefreshCw className="w-4 h-4 animate-spin text-red-400" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                        </tr>

                        {/* Expandable Squad Roster & Leadership Editing Panel */}
                        {isExpanded && (
                          <tr className="bg-cricket-dark/95 border-b border-cricket-teal/30">
                            <td colSpan={9} className="p-5 sm:p-6 space-y-5">
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
                  })
                )}
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
          {/* 1. Tournament Dates & Duration Manager */}
          <div className="glass-card p-6 sm:p-7 border border-cricket-teal/30 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cricket-border pb-4">
              <div>
                <span className="text-xs font-bold text-cricket-teal uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  Official Tournament Schedule Timeline
                </span>
                <h3 className="font-display font-extrabold text-2xl text-white">
                  {selectedTournament === 'ddpl' ? 'DDPL 2026' : 'Game of RUN 2026'} — Dates Management
                </h3>
                <p className="text-xs text-cricket-muted mt-1">
                  Set, unset, or reschedule the tournament starting date and closing date. These dates directly reflect across the public tournament cards and match fixtures.
                </p>
              </div>

              {tournamentStartDate && tournamentEndDate && (
                <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Scheduled: {tournamentStartDate} to {tournamentEndDate}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm items-end">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">Tournament Start Date</label>
                <input
                  type="date"
                  value={tournamentStartDate}
                  onChange={(e) => setTournamentStartDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-cricket-dark border border-cricket-border text-white text-sm focus:outline-none focus:border-cricket-teal"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">Tournament Closing / Final Date</label>
                <input
                  type="date"
                  value={tournamentEndDate}
                  onChange={(e) => setTournamentEndDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-cricket-dark border border-cricket-border text-white text-sm focus:outline-none focus:border-cricket-teal"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveTournamentDates(tournamentStartDate, tournamentEndDate)}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-cricket-dark font-display font-extrabold text-sm tracking-wide shadow active:scale-95 transition-all flex items-center justify-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Set / Update Dates</span>
                </button>
                <button
                  type="button"
                  onClick={handleUnsetTournamentDates}
                  className="px-4 py-2.5 rounded-xl bg-cricket-dark hover:bg-red-500/20 text-gray-400 hover:text-red-300 border border-cricket-border text-xs font-bold transition-all"
                  title="Unset tournament dates"
                >
                  Unset Dates
                </button>
              </div>
            </div>
          </div>

          {/* 2. Smart Auto-Scheduler according to Tournament Format */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card p-6 flex flex-col justify-between border-t-4 border-t-cricket-teal space-y-4">
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase">
                  <Sparkles className="w-3.5 h-3.5" />
                  Smart Tournament Format Generator
                </span>
                <h3 className="font-display font-bold text-2xl text-white">
                  {selectedTournament === 'ddpl' ? 'DDPL Format Auto-Scheduler' : 'Game of RUN Format Auto-Scheduler'}
                </h3>
                <p className="text-xs text-cricket-muted leading-relaxed">
                  {selectedTournament === 'ddpl'
                    ? `Generates Round-Robin league matches between all ${teams.length} franchise teams + Top 4 Playoffs (Qualifier 1, Eliminator, Qualifier 2, and Grand Final).`
                    : `Splits ${teams.length} teams into Group A & Group B, generating group round-robin clashes followed by Semi-Final 1, Semi-Final 2, and the Grand Final.`}
                </p>
              </div>

              <button
                type="button"
                disabled={isGeneratingFixtures || teams.length < 2}
                onClick={handleGenerateTournamentFixtures}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-cricket-dark font-display font-extrabold text-base tracking-wide shadow-lg shadow-teal-500/20 active:scale-95 transition-all disabled:opacity-50"
              >
                {isGeneratingFixtures
                  ? '⚡ Generating Tournament Schedule...'
                  : `⚡ Auto-Generate Schedule (${selectedTournament.toUpperCase()} Format)`}
              </button>
            </div>

            {/* Manual Match Creator Form */}
            <div className="glass-card p-6 md:col-span-2 space-y-4 border border-cricket-border">
              <h3 className="font-display font-bold text-xl text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-cricket-teal" />
                <span>Add Single Match Manually</span>
              </h3>

              <form onSubmit={handleAddManualMatch} className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
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
                    className="w-full px-3 py-2.5 rounded-xl bg-cricket-dark border border-cricket-border text-white text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300">Match Date</label>
                  <input
                    type="date"
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-cricket-dark border border-cricket-border text-white text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300">Match Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 10:00 AM"
                    value={manualTime}
                    onChange={(e) => setManualTime(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-cricket-dark border border-cricket-border text-white text-sm"
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
                    className="w-full px-3 py-2.5 rounded-xl bg-cricket-dark border border-cricket-border text-white text-sm"
                  />
                </div>

                <div className="sm:col-span-3 flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-cricket-card hover:bg-cricket-cardHover border border-cricket-teal/40 text-cricket-teal font-bold text-sm transition-all"
                  >
                    + Schedule Single Match
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* 3. Matches List with Inline Date, Time, and Venue Editors */}
          <div className="glass-card overflow-hidden border border-cricket-border shadow-2xl">
            <div className="p-4 bg-cricket-card/80 border-b border-cricket-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="font-display font-bold text-xl text-white">
                  Official Tournament Fixtures ({matches.length} Scheduled)
                </span>
                <span className="block text-xs text-cricket-muted">
                  Rearrange dates, times, and venues below. Changes sync instantly to the Match Center.
                </span>
              </div>
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Live Sync Enabled
              </span>
            </div>

            <div className="divide-y divide-cricket-border">
              {matches.length === 0 ? (
                <div className="p-10 text-center text-sm text-cricket-muted space-y-3">
                  <p>No fixtures generated yet for {selectedTournament.toUpperCase()}.</p>
                  <p className="text-xs">Click &ldquo;Auto-Generate Schedule&rdquo; above to generate all league matches and playoffs automatically.</p>
                </div>
              ) : (
                matches.map((m) => {
                  const isPlayoff = m.stage && m.stage !== 'League' && m.stage !== 'Group Stage';

                  return (
                    <div
                      key={m.id}
                      className={`p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-5 transition-colors ${
                        isPlayoff ? 'bg-amber-500/5 hover:bg-amber-500/10' : 'hover:bg-cricket-card/30'
                      }`}
                    >
                      {/* Match Header & Opponents */}
                      <div className="space-y-2 lg:max-w-md">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider border ${
                            isPlayoff
                              ? 'bg-amber-500/20 text-cricket-gold border-amber-500/40 shadow-sm'
                              : 'bg-cricket-dark text-cricket-teal border-cricket-teal/30'
                          }`}>
                            {m.stage || m.round}
                          </span>

                          {m.group && (
                            <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold">
                              {m.group}
                            </span>
                          )}

                          <span className="text-xs text-cricket-muted font-medium">Match #{m.matchNumber}</span>

                          {m.status === 'live' && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase animate-pulse border border-emerald-500/40">
                              Live Now
                            </span>
                          )}
                        </div>

                        <div className="font-display font-extrabold text-xl text-white">
                          {m.teamA} <span className="text-cricket-muted font-normal text-base">vs</span> {m.teamB}
                        </div>
                      </div>

                      {/* Inline Scheduling Controls (Date, Time, Venue, Status) */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs flex-1 lg:max-w-xl">
                        {/* Match Date */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-cricket-muted uppercase flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-cricket-teal" />
                            Date
                          </label>
                          <input
                            type="date"
                            value={m.matchDate || ''}
                            onChange={(e) => {
                              const newD = e.target.value;
                              setMatches((prev) =>
                                prev.map((item) => (item.id === m.id ? { ...item, matchDate: newD } : item))
                              );
                            }}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-cricket-dark border border-cricket-border text-white text-xs focus:outline-none focus:border-cricket-teal"
                          />
                        </div>

                        {/* Match Time */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-cricket-muted uppercase flex items-center gap-1">
                            <Clock className="w-3 h-3 text-cyan-400" />
                            Time
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. 10:00 AM"
                            value={m.matchTime || ''}
                            onChange={(e) => {
                              const newT = e.target.value;
                              setMatches((prev) =>
                                prev.map((item) => (item.id === m.id ? { ...item, matchTime: newT } : item))
                              );
                            }}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-cricket-dark border border-cricket-border text-white text-xs focus:outline-none focus:border-cricket-teal"
                          />
                        </div>

                        {/* Venue */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-cricket-muted uppercase flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-amber-400" />
                            Venue
                          </label>
                          <input
                            type="text"
                            value={m.venue || ''}
                            onChange={(e) => {
                              const newV = e.target.value;
                              setMatches((prev) =>
                                prev.map((item) => (item.id === m.id ? { ...item, venue: newV } : item))
                              );
                            }}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-cricket-dark border border-cricket-border text-white text-xs focus:outline-none focus:border-cricket-teal"
                          />
                        </div>

                        {/* Status */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-cricket-muted uppercase">Status</label>
                          <select
                            value={m.status || 'upcoming'}
                            onChange={(e) => {
                              const newS = e.target.value as any;
                              setMatches((prev) =>
                                prev.map((item) => (item.id === m.id ? { ...item, status: newS } : item))
                              );
                            }}
                            className="w-full px-2 py-1.5 rounded-lg bg-cricket-dark border border-cricket-border text-white text-xs focus:outline-none focus:border-cricket-teal"
                          >
                            <option value="upcoming">Upcoming</option>
                            <option value="live">Live Now</option>
                            <option value="completed">Completed</option>
                            <option value="postponed">Postponed</option>
                          </select>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          disabled={savingMatchId === m.id}
                          onClick={() =>
                            handleSaveMatchUpdates(m.id, {
                              matchDate: m.matchDate,
                              matchTime: m.matchTime,
                              venue: m.venue,
                              status: m.status,
                            })
                          }
                          className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold text-xs flex items-center gap-1.5 transition-all"
                          title="Save match schedule"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>{savingMatchId === m.id ? 'Saving...' : 'Save'}</span>
                        </button>

                        <Link
                          href={`/matches/${m.id}`}
                          target="_blank"
                          className="px-3 py-2 rounded-xl bg-cricket-card hover:bg-cricket-cardHover text-gray-300 hover:text-white border border-cricket-border text-xs font-semibold transition-all"
                          title="Open Match Scorer Console"
                        >
                          Console ↗
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
                  );
                })
              )}
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
                    <th className="px-5 py-3">Change Role</th>
                    <th className="px-5 py-3 text-right">Password Actions</th>
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
                        <td className="px-5 py-3.5">
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
                        <td className="px-5 py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setResetModalUser(u);
                              setAdminNewPassword('');
                              setGeneratedBypassLink(null);
                              setCopiedLink(false);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
                            title="Reset password or generate instant bypass link"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                            <span>Reset Password</span>
                          </button>
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

      {/* Super Admin Password Reset Modal */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md glass-card p-6 border border-amber-500/30 shadow-2xl space-y-5 rounded-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-cricket-border">
              <div className="flex items-center gap-2 text-amber-400">
                <KeyRound className="w-5 h-5" />
                <h3 className="font-display font-extrabold text-lg text-white">Reset User Password</h3>
              </div>
              <button
                onClick={() => setResetModalUser(null)}
                className="p-1 rounded-lg hover:bg-cricket-card text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-cricket-dark/80 border border-cricket-border space-y-1 text-xs">
              <div className="flex justify-between text-gray-400">
                <span>Target User:</span>
                <b className="text-white">{resetModalUser.name}</b>
              </div>
              <div className="flex justify-between text-gray-400 font-mono">
                <span>Email:</span>
                <b className="text-cricket-teal">{resetModalUser.email}</b>
              </div>
            </div>

            {/* Option 1: Direct Password Change */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-300 block">Set New Password (Instant Update):</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="e.g. Cricket@2026"
                    value={adminNewPassword}
                    onChange={(e) => setAdminNewPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-cricket-dark border border-cricket-border text-white text-xs font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
                <button
                  type="button"
                  disabled={adminResetLoading || !adminNewPassword.trim()}
                  onClick={() => handleAdminResetPassword(resetModalUser.email, adminNewPassword)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 text-cricket-dark font-display font-extrabold text-xs tracking-wide shadow disabled:opacity-40 cursor-pointer"
                >
                  {adminResetLoading ? 'Updating…' : 'Set Password'}
                </button>
              </div>
              <p className="text-[11px] text-gray-400">
                Instantly updates their password in the Supabase database. Zero email limits.
              </p>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-cricket-border"></div>
              <span className="flex-shrink mx-3 text-[10px] text-gray-400 uppercase font-mono tracking-widest">OR</span>
              <div className="flex-grow border-t border-cricket-border"></div>
            </div>

            {/* Option 2: 1-Click Bypass Link */}
            <div className="space-y-2">
              <button
                type="button"
                disabled={adminResetLoading}
                onClick={() => handleAdminGenerateBypassLink(resetModalUser.email)}
                className="w-full py-2.5 rounded-xl bg-cricket-card hover:bg-cricket-card/80 border border-cricket-teal/40 text-cricket-teal font-display font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>Generate 1-Click Recovery Link</span>
              </button>

              {generatedBypassLink && (
                <div className="p-3 rounded-xl bg-[#040814] border border-emerald-500/30 space-y-2 animate-fade-in">
                  <p className="text-[11px] text-emerald-400 font-bold">1-Click Link Ready (Bypasses all email rate limits):</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={generatedBypassLink}
                      className="flex-1 py-1 px-2 rounded-lg bg-cricket-dark border border-cricket-border text-gray-300 font-mono text-[10px] select-all truncate"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedBypassLink);
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 2000);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold shrink-0 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-400">
                    Send this link to the user on WhatsApp or Email. It bypasses all rate limits.
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setResetModalUser(null)}
                className="px-4 py-1.5 rounded-lg text-xs font-bold text-gray-400 hover:text-white cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Custom Tournament Modal (Super Admin) */}
      {isCreateTournamentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-gradient-to-b from-[#0c1631] to-[#070d1e] border border-cricket-teal/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsCreateTournamentModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-display font-extrabold text-2xl text-white">Create New Tournament</h3>
                <p className="text-xs text-cricket-muted">
                  Provision a new custom cricket tournament with live auction, fixtures, roster, and standings.
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateTournament} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">
                    Tournament Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DDPL 2027 or DDPL 2027 2.0"
                    value={newTournamentForm.name}
                    onChange={(e) => setNewTournamentForm({ ...newTournamentForm, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-cricket-dark border border-cricket-border text-white text-xs font-semibold focus:outline-none focus:border-cricket-teal"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Slug will be auto-generated for URLs.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">
                    Short Code / Acronym
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. DDPL27 or GOR28"
                    value={newTournamentForm.shortName}
                    onChange={(e) => setNewTournamentForm({ ...newTournamentForm, shortName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-cricket-dark border border-cricket-border text-white text-xs font-semibold focus:outline-none focus:border-cricket-teal"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">
                    Full Official Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Desk to Dugout Premier League 2027"
                    value={newTournamentForm.fullName}
                    onChange={(e) => setNewTournamentForm({ ...newTournamentForm, fullName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-cricket-dark border border-cricket-border text-white text-xs font-semibold focus:outline-none focus:border-cricket-teal"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">
                    Season Year
                  </label>
                  <input
                    type="text"
                    placeholder="2027"
                    value={newTournamentForm.season}
                    onChange={(e) => setNewTournamentForm({ ...newTournamentForm, season: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-cricket-dark border border-cricket-border text-white text-xs font-semibold focus:outline-none focus:border-cricket-teal"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">
                  Tagline / Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. High-octane inter-departmental corporate cricket championship"
                  value={newTournamentForm.tagline}
                  onChange={(e) => setNewTournamentForm({ ...newTournamentForm, tagline: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-cricket-dark border border-cricket-border text-white text-xs font-semibold focus:outline-none focus:border-cricket-teal"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">Tournament Format</label>
                  <select
                    value={newTournamentForm.format}
                    onChange={(e) => setNewTournamentForm({ ...newTournamentForm, format: e.target.value as any })}
                    className="w-full px-3 py-2.5 rounded-xl bg-cricket-dark border border-cricket-border text-white text-xs font-bold"
                  >
                    <option value="ddpl">DDPL (Single League + Top 4 Playoffs)</option>
                    <option value="game-of-run">Game of RUN (Group Stage + Playoffs)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">Match Overs</label>
                  <input
                    type="number"
                    min={5}
                    max={50}
                    value={newTournamentForm.overs}
                    onChange={(e) => setNewTournamentForm({ ...newTournamentForm, overs: Number(e.target.value) || 10 })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-cricket-dark border border-cricket-border text-white text-xs font-semibold focus:outline-none focus:border-cricket-teal"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">Registration Status</label>
                  <select
                    value={newTournamentForm.status}
                    onChange={(e) => setNewTournamentForm({ ...newTournamentForm, status: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-cricket-dark border border-cricket-border text-white text-xs font-bold"
                  >
                    <option value="open">● Registration Open</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="auction">● Auction Live</option>
                    <option value="ongoing">● Tournament Ongoing</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">Team Purse (₹ / Pts)</label>
                  <input
                    type="number"
                    step={500}
                    value={newTournamentForm.pursePerTeam}
                    onChange={(e) => setNewTournamentForm({ ...newTournamentForm, pursePerTeam: Number(e.target.value) || 10000 })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-cricket-dark border border-cricket-border text-white text-xs font-semibold focus:outline-none focus:border-cricket-teal"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">Owner Blocked Price</label>
                  <input
                    type="number"
                    step={100}
                    value={newTournamentForm.ownerBasePrice}
                    onChange={(e) => setNewTournamentForm({ ...newTournamentForm, ownerBasePrice: Number(e.target.value) || 500 })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-cricket-dark border border-cricket-border text-white text-xs font-semibold focus:outline-none focus:border-cricket-teal"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">Squad Range (Min - Max)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={newTournamentForm.minSquad}
                      onChange={(e) => setNewTournamentForm({ ...newTournamentForm, minSquad: Number(e.target.value) || 7 })}
                      className="w-1/2 px-2.5 py-2.5 rounded-xl bg-cricket-dark border border-cricket-border text-white text-xs font-semibold text-center"
                      placeholder="Min"
                    />
                    <span className="text-gray-400 text-xs">to</span>
                    <input
                      type="number"
                      value={newTournamentForm.maxSquad}
                      onChange={(e) => setNewTournamentForm({ ...newTournamentForm, maxSquad: Number(e.target.value) || 11 })}
                      className="w-1/2 px-2.5 py-2.5 rounded-xl bg-cricket-dark border border-cricket-border text-white text-xs font-semibold text-center"
                      placeholder="Max"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">Start Date (Optional)</label>
                  <input
                    type="date"
                    value={newTournamentForm.startDate}
                    onChange={(e) => setNewTournamentForm({ ...newTournamentForm, startDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-cricket-dark border border-cricket-border text-white text-xs font-semibold focus:outline-none focus:border-cricket-teal"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">End Date (Optional)</label>
                  <input
                    type="date"
                    value={newTournamentForm.endDate}
                    onChange={(e) => setNewTournamentForm({ ...newTournamentForm, endDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-cricket-dark border border-cricket-border text-white text-xs font-semibold focus:outline-none focus:border-cricket-teal"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-cricket-border">
                <button
                  type="button"
                  onClick={() => setIsCreateTournamentModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-cricket-card hover:bg-cricket-cardHover border border-cricket-border text-gray-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingTournament}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-cricket-dark font-display font-extrabold text-xs shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isCreatingTournament ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Creating Tournament...</span>
                    </>
                  ) : (
                    <>
                      <PlusCircle className="w-4 h-4" />
                      <span>Create Tournament</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Tournament Data Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-card max-w-md w-full p-6 space-y-5 border border-red-500/40 bg-cricket-dark/95 shadow-2xl relative">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/30">
                  <AlertCircle className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="font-display font-black text-xl text-white">Reset Tournament Data</h3>
                  <p className="text-xs text-red-300 font-bold uppercase tracking-wider">
                    {selectedTournament.toUpperCase()} • Clean Slate
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-gray-300 space-y-2 leading-relaxed bg-red-950/20 border border-red-500/20 p-4 rounded-xl">
              <p className="font-bold text-red-200">
                Are you sure you want to delete and reset tournament data?
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-300">
                <li>All franchise teams and squad allocations will be removed.</li>
                <li>All live auction bids, sold records, and unsold pools will be wiped.</li>
                <li>All match fixtures and schedule will be cleared.</li>
                <li>Franchise owners will be released from their team bindings.</li>
              </ul>
            </div>

            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-cricket-card border border-cricket-border hover:border-cricket-teal/50 cursor-pointer select-none transition-all">
              <input
                type="checkbox"
                checked={resetRegistrationsCheck}
                onChange={(e) => setResetRegistrationsCheck(e.target.checked)}
                className="w-4 h-4 rounded text-cricket-teal accent-cricket-teal focus:ring-0 cursor-pointer"
              />
              <span className="text-xs font-semibold text-gray-200">
                Also clear player registrations list completely
              </span>
            </label>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-cricket-border">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-cricket-card hover:bg-cricket-cardHover border border-cricket-border text-gray-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetTournamentData}
                disabled={isResetting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-display font-extrabold text-xs shadow-lg shadow-red-500/30 disabled:opacity-50 transition-all cursor-pointer"
              >
                {isResetting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Wiping Tournament Data...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Confirm Wipe &amp; Reset</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
