'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Gavel, 
  Users, 
  DollarSign, 
  AlertTriangle, 
  RotateCcw, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  Sparkles, 
  Download, 
  UploadCloud, 
  Radio, 
  Shield, 
  Lock, 
  FileSpreadsheet, 
  X, 
  ArrowRight,
  RefreshCw,
  Info,
  Zap,
  Play,
  Pause,
  Eye
} from 'lucide-react';
import dynamic from 'next/dynamic';
import confetti from 'canvas-confetti';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { ParsedFranchise, ParsedPlayer } from '@/lib/auctionImport';
import type { MascotEventData } from '@/components/auction/AuctionMascotOverlay';
import { fetchWithCache } from '@/lib/clientCache';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

const AuctionMascotOverlay = dynamic(() => import('@/components/auction/AuctionMascotOverlay'), {
  ssr: false,
});

interface PlayerLot {
  id: string;
  name: string;
  role: string;
  basePrice: number;
  currentBid: number;
  leadingTeam: string | null;
  history: { team: string; bid: number; increment?: number; timestamp?: string }[];
}

interface TeamBudget {
  id: string;
  name: string;
  short: string;
  owner?: string;
  allocated: number;
  spent: number;
  playersBought: number;
  maxSquad: number;
}

const DEFAULT_AUCTION_PLAYER_POOL: ParsedPlayer[] = [];

export default function AuctionPage() {
  const { isOrganizer, isSuperAdmin, role, user } = useAuth();
  const supabase = createClient();
  const channelRef = useRef<any>(null);

  const [activeTournament, setActiveTournament] = useState<string>('ddpl');
  const [tournamentsList, setTournamentsList] = useState<any[]>([
    { slug: 'ddpl', name: 'DDPL', season: '2026' },
    { slug: 'game-of-run', name: 'Game of RUN', season: '2026' },
  ]);
  const [bidStep, setBidStep] = useState(100);
  const [selectedIncrement, setSelectedIncrement] = useState<number>(100);
  const [isOpeningAtBase, setIsOpeningAtBase] = useState<boolean>(true);
  const [poolIndex, setPoolIndex] = useState(0);
  const [syncStatus, setSyncStatus] = useState<'connected' | 'syncing' | 'offline'>('connected');
  const [lastSyncTime, setLastSyncTime] = useState<string>('Just now');
  const [notification, setNotification] = useState<string | null>(null);

  // Dynamic Auction Rules (from /api/admin/rules)
  const [rules, setRules] = useState({
    basePurse: 10000,
    ownerBlockedPrice: 500,
    defaultPlayerBasePrice: 500,
    bidSteps: [50, 100, 200, 500],
    maxSquadSize: 11,
    matchOvers: 10,
    maxBowlerOvers: 2,
  });

  // Teams & Purse State (Clean Slate: empty until assigned or imported)
  const [teams, setTeams] = useState<TeamBudget[]>([]);
  const [playerPool, setPlayerPool] = useState<ParsedPlayer[]>([]);
  const [currentLot, setCurrentLot] = useState<PlayerLot | null>(null);
  const [soldTransactions, setSoldTransactions] = useState<any[]>([]);
  const [unsoldPlayers, setUnsoldPlayers] = useState<string[]>([]);

  // Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [parsedPreview, setParsedPreview] = useState<any>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // 3D Mascot Reaction Overlay State (12 SOLD + 12 UNSOLD Variations)
  const [activeMascotEvent, setActiveMascotEvent] = useState<MascotEventData | null>(null);

  // 30-Second Live Bidding Timer & Auction Automation State
  const [countdown, setCountdown] = useState<number>(30);
  const [auctionStatus, setAuctionStatus] = useState<'live' | 'paused' | 'stopped'>('live');
  const [biddingAccessEnabled, setBiddingAccessEnabled] = useState<boolean>(true);
  const [teamBiddingAccess, setTeamBiddingAccess] = useState<Record<string, boolean>>({});
  const [isAutoTransitioning, setIsAutoTransitioning] = useState<boolean>(false);
  const [transitionMessage, setTransitionMessage] = useState<string | null>(null);

  // Franchise Owner Detection
  const userTeam = teams.find((t) => {
    if (!user) return false;
    const userEmail = user.email?.toLowerCase();
    const ownerEmail = (t as any).ownerEmail?.toLowerCase();
    if (ownerEmail && userEmail && ownerEmail === userEmail) return true;
    const userName = (user as any).name?.toLowerCase() || (user as any).user_metadata?.full_name?.toLowerCase();
    const ownerName = t.owner?.toLowerCase();
    if (userName && ownerName && (ownerName === userName || ownerName.includes(userName) || userName.includes(ownerName))) return true;
    return false;
  });

  const isFranchiseOwner = Boolean(userTeam);

  const canUserBidForTeam = (team: TeamBudget) => {
    if (auctionStatus !== 'live' || isAutoTransitioning) return false;
    if (isSuperAdmin) return true;
    if (!isFranchiseOwner) return false;
    if (!biddingAccessEnabled) return false;
    if (teamBiddingAccess && teamBiddingAccess[team.id] === false) return false;
    return team.id === userTeam?.id;
  };

  // Toast Helper
  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // 1. Fetch Dynamic Rules, Tournaments, and Persistent Auction State on Mount & Tournament Switch
  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      try {
        const [regData, rulesData, auctionData] = await Promise.all([
          fetchWithCache<any>('/api/tournaments/register?tournament=ddpl', { ttlMs: 30000 }),
          fetchWithCache<any>(`/api/admin/rules?tournament=${activeTournament}`, { ttlMs: 30000 }),
          fetchWithCache<any>(`/api/auction/data?tournament=${activeTournament}`, { ttlMs: 3000 }),
        ]);

        if (!isMounted) return;

        if (regData?.tournamentsList && regData.tournamentsList.length > 0) {
          setTournamentsList(regData.tournamentsList);
        }

        if (rulesData?.success && rulesData.rules) {
          setRules({
            basePurse: rulesData.rules.basePurse || 10000,
            ownerBlockedPrice: rulesData.rules.ownerBlockedPrice || 500,
            defaultPlayerBasePrice: rulesData.rules.defaultPlayerBasePrice || 500,
            bidSteps: rulesData.rules.bidSteps || [50, 100, 200, 500],
            maxSquadSize: rulesData.rules.maxSquadSize || 11,
            matchOvers: rulesData.rules.matchOvers || (activeTournament === 'game-of-run' ? 12 : 10),
            maxBowlerOvers: rulesData.rules.maxBowlerOvers || (activeTournament === 'game-of-run' ? 3 : 2),
          });
        }

        if (auctionData?.success && auctionData.data) {
          const d = auctionData.data;
          setTeams(Array.isArray(d.teams) ? d.teams : []);
          setPlayerPool(Array.isArray(d.playerPool) ? d.playerPool : []);
          setSoldTransactions(Array.isArray(d.soldTransactions) ? d.soldTransactions : []);
          setUnsoldPlayers(Array.isArray(d.unsoldPlayers) ? d.unsoldPlayers : []);
          if (d.auctionStatus) setAuctionStatus(d.auctionStatus);
          if (d.biddingAccessEnabled !== undefined) setBiddingAccessEnabled(d.biddingAccessEnabled);
          if (d.teamBiddingAccess) setTeamBiddingAccess(d.teamBiddingAccess);
          if (d.timerSeconds !== undefined) setCountdown(d.timerSeconds);
          if (d.currentLot !== undefined) {
            setCurrentLot(d.currentLot);
          } else if (d.playerPool && d.playerPool.length > 0) {
            const p0 = d.playerPool[0];
            setCurrentLot({
              id: p0.id,
              name: p0.name,
              role: p0.role,
              basePrice: p0.basePrice || 500,
              currentBid: p0.basePrice || 500,
              leadingTeam: null,
              history: [],
            });
          } else {
            setCurrentLot(null);
          }
        } else {
          setTeams([]);
          setPlayerPool([]);
          setSoldTransactions([]);
          setUnsoldPlayers([]);
          setCurrentLot(null);
        }
      } catch (err) {
        console.error('Error loading initial auction state:', err);
      }
    }

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [activeTournament]);

  // 2. Realtime Broadcast Channel for Live Synchronized Bidding Room
  useEffect(() => {
    const channelName = `auction-${activeTournament}`;
    const channel = supabase.channel(channelName, {
      config: { broadcast: { self: false } },
    });

    channel
      .on('broadcast', { event: 'auction_update' }, (payload) => {
        const data = payload.payload;
        if (data) {
          if (data.currentLot !== undefined) setCurrentLot(data.currentLot);
          if (data.teams !== undefined) setTeams(data.teams);
          if (data.soldTransactions !== undefined) setSoldTransactions(data.soldTransactions);
          if (data.unsoldPlayers !== undefined) setUnsoldPlayers(data.unsoldPlayers);
          if (data.playerPool !== undefined) setPlayerPool(data.playerPool);
          if (data.countdown !== undefined) setCountdown(data.countdown);
          if (data.auctionStatus !== undefined) setAuctionStatus(data.auctionStatus);
          if (data.biddingAccessEnabled !== undefined) setBiddingAccessEnabled(data.biddingAccessEnabled);
          if (data.teamBiddingAccess !== undefined) setTeamBiddingAccess(data.teamBiddingAccess);
          if (data.transitionMessage !== undefined) setTransitionMessage(data.transitionMessage);
          if (data.mascotEvent) {
            setActiveMascotEvent({
              ...data.mascotEvent,
              id: data.mascotEvent.id || `${data.mascotEvent.type}-${data.mascotEvent.player}-${Date.now()}`,
            });
          }
          setLastSyncTime(new Date().toLocaleTimeString());
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setSyncStatus('connected');
        } else if (status === 'CHANNEL_ERROR') {
          setSyncStatus('offline');
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeTournament]);

  // Background fallback polling for 100% sync reliability across all devices
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/auction/data?tournament=${activeTournament}`);
        if (!res.ok) return;
        const json = await res.json();
        if (json.success && json.data) {
          const d = json.data;
          if (d.auctionStatus && d.auctionStatus !== auctionStatus) setAuctionStatus(d.auctionStatus);
          if (d.biddingAccessEnabled !== undefined) setBiddingAccessEnabled(d.biddingAccessEnabled);
          if (d.teamBiddingAccess) setTeamBiddingAccess(d.teamBiddingAccess);
        }
      } catch (e) {
        // quiet
      }
    }, 4000);

    return () => clearInterval(pollInterval);
  }, [activeTournament, auctionStatus]);

  // 30-Second Bidding Countdown Timer
  useEffect(() => {
    if (auctionStatus !== 'live' || !currentLot || isAutoTransitioning) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAutoTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [auctionStatus, currentLot?.id, currentLot?.currentBid, isAutoTransitioning]);

  function handleAutoTimeout() {
    if (!currentLot || isAutoTransitioning) return;
    if (currentLot.leadingTeam) {
      executeSold(currentLot.leadingTeam, currentLot.currentBid, currentLot.name, currentLot.role, true);
    } else {
      executeUnsold(currentLot.name, true);
    }
  }

  // Broadcast state changes and persist to server
  const broadcastAuctionState = (partialState: any) => {
    if (channelRef.current) {
      setSyncStatus('syncing');
      channelRef.current
        .send({
          type: 'broadcast',
          event: 'auction_update',
          payload: partialState,
        })
        .then(() => {
          setSyncStatus('connected');
          setLastSyncTime(new Date().toLocaleTimeString());
        })
        .catch(() => {
          setSyncStatus('connected');
        });
    }

    // Persist to server API in background
    fetch(`/api/auction/data?tournament=${activeTournament}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...partialState, tournament: activeTournament }),
    }).catch((e) => console.error('Failed to persist auction state:', e));
  };

  // Export Squads CSV
  function exportAuctionSquadsCSV() {
    if (!isOrganizer) {
      alert('Access Restricted: Only Tournament Organizers and Super Admin can export auction squads.');
      return;
    }

    const headers = ['Tournament', 'Franchise Name', 'Owner', 'Team Code', 'Allocated Budget (Points)', 'Spent (Points)', 'Remaining (Points)', 'Players Bought', 'Max Squad'];
    const rows = teams.map((t) => [
      activeTournament.toUpperCase(),
      `"${t.name}"`,
      `"${t.owner || 'Franchise Owner'}"`,
      t.short,
      t.allocated,
      t.spent,
      t.allocated - t.spent,
      t.playersBought,
      t.maxSquad,
    ]);

    const soldRows = soldTransactions.map((tx) => [
      'ACQUIRED PLAYER',
      `"${tx.team}"`,
      tx.price,
      `"${tx.player}"`,
      `"${tx.role}"`,
    ]);

    const csvContent = [
      '--- TOURNAMENT FRANCHISE SQUADS & PURSE SUMMARY ---',
      headers.join(','),
      ...rows.map((r) => r.join(',')),
      '',
      '--- SOLD PLAYERS LEDGER ---',
      'Transaction Type,Winning Franchise,Winning Bid (Points),Player Name,Role',
      ...soldRows.map((r) => r.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${activeTournament}-auction-squads-report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Auction squads CSV downloaded successfully!');
  }

  // Handle Placing a Bid with Dynamic Increments
  function handleBid(team: TeamBudget, customIncrement?: number) {
    if (!currentLot || auctionStatus !== 'live' || isAutoTransitioning) return;

    if (!canUserBidForTeam(team)) {
      alert(`Bidding Restricted: You can only bid for your assigned franchise (${userTeam?.name || 'Authorized Owners only'})!`);
      return;
    }

    if (currentLot.leadingTeam === team.name) {
      alert(`You already hold the highest bid of ₹${currentLot.currentBid.toLocaleString('en-IN')}! Wait for another franchise to bid.`);
      return;
    }

    const inc = customIncrement !== undefined ? customIncrement : selectedIncrement;

    let nextBid: number;
    let incrementLogged: number;

    if (!currentLot.leadingTeam) {
      // 1st Opening Bid: Can be base price or base price + chosen jump
      if (isOpeningAtBase && customIncrement === undefined) {
        nextBid = currentLot.basePrice;
        incrementLogged = 0;
      } else {
        nextBid = currentLot.basePrice + inc;
        incrementLogged = inc;
      }
    } else {
      // Subsequent counter-bids: Current Highest Bid + chosen increment
      nextBid = currentLot.currentBid + inc;
      incrementLogged = inc;
    }

    if (team.allocated - team.spent < nextBid) {
      alert(`Cannot bid: ${team.name} has insufficient remaining budget (₹${(team.allocated - team.spent).toLocaleString('en-IN')} left)!`);
      return;
    }

    if (team.playersBought >= team.maxSquad) {
      alert(`Cannot bid: ${team.name} has reached maximum squad capacity (${team.maxSquad})!`);
      return;
    }

    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const updatedHistory = [
      ...currentLot.history,
      {
        team: team.name,
        bid: nextBid,
        increment: incrementLogged,
        timestamp: nowStr,
      },
    ];

    const updatedLot = {
      ...currentLot,
      currentBid: nextBid,
      leadingTeam: team.name,
      history: updatedHistory,
    };

    setCurrentLot(updatedLot);
    setIsOpeningAtBase(false); // Bid has been initiated
    setCountdown(30); // RESET 30s TIMER ON EVERY NEW BID!
    broadcastAuctionState({ currentLot: updatedLot, countdown: 30 });

    // Persist active lot to server asynchronously
    fetch(`/api/auction/data?tournament=${activeTournament}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentLot: updatedLot,
        timerSeconds: 30,
        timerLastReset: new Date().toISOString(),
      }),
    }).catch((err) => console.warn('Failed to sync bid to server:', err));

    showToast(`🔨 ${team.short} placed bid: ₹${nextBid.toLocaleString('en-IN')} ${incrementLogged > 0 ? `(+₹${incrementLogged})` : '(Opening Base)'}`);
  }

  // Handle Undo Last Bid
  function handleUndo() {
    if (!currentLot || currentLot.history.length === 0 || !isSuperAdmin) return;

    const newHistory = [...currentLot.history];
    newHistory.pop();

    let updatedLot: PlayerLot;
    if (newHistory.length === 0) {
      updatedLot = {
        ...currentLot,
        currentBid: currentLot.basePrice,
        leadingTeam: null,
        history: [],
      };
      setIsOpeningAtBase(true);
    } else {
      const prev = newHistory[newHistory.length - 1];
      updatedLot = {
        ...currentLot,
        currentBid: prev.bid,
        leadingTeam: prev.team,
        history: newHistory,
      };
      setIsOpeningAtBase(false);
    }

    setCurrentLot(updatedLot);
    setCountdown(30);
    broadcastAuctionState({ currentLot: updatedLot, countdown: 30 });
  }

  // Next Player from Pool
  function advanceToNextPlayer(updatedSoldList = soldTransactions, updatedUnsoldList = unsoldPlayers) {
    const allProcessedNames = new Set([
      ...updatedSoldList.map((tx) => tx.player.toLowerCase()),
      ...updatedUnsoldList.map((name) => name.toLowerCase()),
    ]);

    const remaining = playerPool.filter(
      (p) => !allProcessedNames.has(p.name.toLowerCase())
    );

    if (remaining.length > 0) {
      const next = remaining[0];
      const newLot: PlayerLot = {
        id: next.id,
        name: next.name,
        role: next.role,
        basePrice: next.basePrice,
        currentBid: next.basePrice,
        leadingTeam: null,
        history: [],
      };
      setCurrentLot(newLot);
      setIsOpeningAtBase(true);
      setSelectedIncrement(100);
      setCountdown(30);
      broadcastAuctionState({ currentLot: newLot, countdown: 30 });
      return newLot;
    } else {
      setCurrentLot(null);
      setIsOpeningAtBase(true);
      broadcastAuctionState({ currentLot: null });
      return null;
    }
  }

  // Execute Sold (Manual or Auto-Timeout)
  function executeSold(winningTeamName: string, finalPrice: number, soldPlayer: string, playerRole: string, isAuto = false) {
    if (isAutoTransitioning) return;
    setIsAutoTransitioning(true);

    const winningTeam = teams.find((t) => t.name === winningTeamName);
    const updatedTeams = teams.map((t) =>
      winningTeam && t.id === winningTeam.id
        ? {
            ...t,
            spent: t.spent + finalPrice,
            playersBought: t.playersBought + 1,
          }
        : t
    );
    setTeams(updatedTeams);

    const newSold = [
      {
        id: `tx-${Date.now()}`,
        player: soldPlayer,
        team: winningTeamName,
        price: finalPrice,
        role: playerRole,
      },
      ...soldTransactions,
    ];
    setSoldTransactions(newSold);

    const soldEvent: MascotEventData = {
      id: `sold-${Date.now()}-${soldPlayer}`,
      type: 'sold',
      player: soldPlayer,
      team: winningTeamName,
      price: finalPrice,
      role: playerRole,
      timestamp: Date.now(),
    };
    setActiveMascotEvent(soldEvent);

    const msg = isAuto
      ? `⏰ 30s Up! AUTO-SOLD: ${soldPlayer} won by ${winningTeamName} for ₹${finalPrice.toLocaleString('en-IN')}! Boarding next player in 4s...`
      : `🔨 HAMMER SOLD! ${soldPlayer} won by ${winningTeamName} for ₹${finalPrice.toLocaleString('en-IN')}! Boarding next player in 4s...`;
    setTransitionMessage(msg);

    broadcastAuctionState({
      teams: updatedTeams,
      soldTransactions: newSold,
      mascotEvent: soldEvent,
      transitionMessage: msg,
    });

    // Automatic Boarding of Next Player after 4s celebration
    setTimeout(() => {
      advanceToNextPlayer(newSold, unsoldPlayers);
      setIsAutoTransitioning(false);
      setTransitionMessage(null);
      setCountdown(30);
    }, 4000);
  }

  // Execute Unsold (Manual or Auto-Timeout)
  function executeUnsold(unsoldPlayer: string, isAuto = false) {
    if (isAutoTransitioning) return;
    setIsAutoTransitioning(true);

    const newUnsold = [...unsoldPlayers, unsoldPlayer];
    setUnsoldPlayers(newUnsold);

    const unsoldEvent: MascotEventData = {
      id: `unsold-${Date.now()}-${unsoldPlayer}`,
      type: 'unsold',
      player: unsoldPlayer,
      timestamp: Date.now(),
    };
    setActiveMascotEvent(unsoldEvent);

    const msg = isAuto
      ? `⏰ 30s Expired with 0 bids! ${unsoldPlayer} marked as UNSOLD (moved to Phase 2 Pool). Boarding next player in 4s...`
      : `🔨 PASS AS UNSOLD: ${unsoldPlayer} moved to Phase 2 Pool. Boarding next player in 4s...`;
    setTransitionMessage(msg);

    broadcastAuctionState({
      unsoldPlayers: newUnsold,
      mascotEvent: unsoldEvent,
      transitionMessage: msg,
    });

    // Automatic Boarding of Next Player after 4s
    setTimeout(() => {
      advanceToNextPlayer(soldTransactions, newUnsold);
      setIsAutoTransitioning(false);
      setTransitionMessage(null);
      setCountdown(30);
    }, 4000);
  }

  // Manual Super Admin Hammer: Sold
  function handleSold() {
    if (!currentLot || !currentLot.leadingTeam) {
      alert('Cannot mark sold without any leading bid! If no bids, mark as Unsold.');
      return;
    }
    executeSold(currentLot.leadingTeam, currentLot.currentBid, currentLot.name, currentLot.role, false);
  }

  // Manual Super Admin Hammer: Unsold
  function handleUnsold() {
    if (!currentLot) return;
    executeUnsold(currentLot.name, false);
  }

  // Handle Phase 2: Accelerated Unsold Round
  function handleStartPhase2() {
    if (unsoldPlayers.length === 0) return;

    const reAuctionPool: ParsedPlayer[] = unsoldPlayers.map((name, idx) => {
      const existing = playerPool.find((p) => p.name === name);
      return {
        id: `p-phase2-${idx + 1}`,
        name,
        role: existing?.role || 'All Rounder',
        basePrice: existing?.basePrice || rules.defaultPlayerBasePrice || 500,
      };
    });

    const firstLot: PlayerLot = {
      id: reAuctionPool[0].id,
      name: reAuctionPool[0].name,
      role: reAuctionPool[0].role,
      basePrice: reAuctionPool[0].basePrice,
      currentBid: reAuctionPool[0].basePrice,
      leadingTeam: null,
      history: [],
    };

    setPlayerPool(reAuctionPool);
    setUnsoldPlayers([]);
    setCurrentLot(firstLot);

    broadcastAuctionState({
      playerPool: reAuctionPool,
      unsoldPlayers: [],
      currentLot: firstLot,
    });
  }

  // Handle Sync Registered Players from Tournament Registration
  async function handleSyncRegisteredPlayers() {
    try {
      const res = await fetch('/api/tournaments/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sync_to_auction',
          tournament: activeTournament,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        window.location.reload();
      } else {
        alert(data.error || 'Failed to sync registered players');
      }
    } catch (e: any) {
      alert(`Sync error: ${e.message}`);
    }
  }

  // Handle File Change in Import Modal
  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setImportError(null);

    try {
      const buffer = await file.arrayBuffer();
      const { parseAuctionWorkbook } = await import('@/lib/auctionImport');
      const parsed = parseAuctionWorkbook(buffer, {
        basePurse: rules.basePurse,
        ownerBlockedPrice: rules.ownerBlockedPrice,
        defaultPlayerBasePrice: rules.defaultPlayerBasePrice,
        maxSquadSize: rules.maxSquadSize,
      });

      if (parsed.teams.length === 0 && parsed.playerPool.length === 0) {
        setImportError('Could not detect franchises or players in the uploaded file. Ensure column names include "Players name" and "4 Franchise" / "Franchise".');
        setParsedPreview(null);
      } else {
        setParsedPreview(parsed);
      }
    } catch (err: any) {
      console.error('File parsing error:', err);
      setImportError(`Failed to parse file: ${err.message || 'Invalid format'}`);
      setParsedPreview(null);
    }
  }

  // Apply Imported Workbook
  async function handleApplyImport() {
    if (!parsedPreview) return;

    setIsImporting(true);
    try {
      const { teams: newTeams, playerPool: newPool, soldTransactions: newSold } = parsedPreview;

      setTeams(newTeams);
      setPlayerPool(newPool);
      setSoldTransactions(newSold);
      setUnsoldPlayers([]);

      let firstLot: PlayerLot | null = null;
      if (newPool.length > 0) {
        firstLot = {
          id: newPool[0].id,
          name: newPool[0].name,
          role: newPool[0].role,
          basePrice: newPool[0].basePrice,
          currentBid: newPool[0].basePrice,
          leadingTeam: null,
          history: [],
        };
      }
      setCurrentLot(firstLot);

      // Save to server
      await fetch(`/api/auction/data?tournament=${activeTournament}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournament: activeTournament,
          teams: newTeams,
          playerPool: newPool,
          soldTransactions: newSold,
          unsoldPlayers: [],
          currentLot: firstLot,
        }),
      });

      // Broadcast to all viewers
      broadcastAuctionState({
        teams: newTeams,
        playerPool: newPool,
        soldTransactions: newSold,
        unsoldPlayers: [],
        currentLot: firstLot,
      });

      confetti({ particleCount: 100, spread: 80 });
      showToast(`Successfully imported ${newTeams.length} Franchises and ${newPool.length} Players!`);
      setIsImportModalOpen(false);
      setImportFile(null);
      setParsedPreview(null);
    } catch (err: any) {
      alert(`Error applying import: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  }

  // =========================================================================
  // ACCESS RESTRICTED GUARD
  // Only Organizer and Super Admin can enter the auction room & export CSV.
  // Spectators (user), Scorers (scorer), and unauthenticated visitors are gated.
  // =========================================================================
  const isAccessAllowed = isOrganizer;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-cricket-border pb-6">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Gavel className="w-6 h-6 text-cricket-gold" />
              <h1 className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight">
                Player Auction Command Center
              </h1>
            </div>

            {/* Live Status Indicator */}
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-500/30">
              <Radio className="w-3 h-3 text-blue-400 animate-pulse" />
              <span>Room: {syncStatus}</span>
            </span>

            {isAccessAllowed && (
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                <Shield className="w-3 h-3 text-emerald-400" />
                <span>Organizer Verified ({role})</span>
              </span>
            )}

            <span className="text-[11px] text-cricket-muted">
              Sync: {lastSyncTime}
            </span>
          </div>

          <p className="text-sm text-cricket-muted mt-1">
            Live multi-franchise bidding engine with server-validated purse deductions and instant real-time synchronization.
          </p>
        </div>

        {/* Action Controls: Restricted to Organizer / Super Admin */}
        <div className="flex flex-wrap items-center gap-3">
          {isAccessAllowed ? (
            <>
              {/* Sync Registered Players */}
              <button
                onClick={handleSyncRegisteredPlayers}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/40 text-blue-300 font-bold text-xs shadow-md transition-all active:scale-95"
                title="Sync all self-registered players into this tournament auction pool"
              >
                <Users className="w-4 h-4 text-blue-400" />
                <span>Sync Registered Players</span>
              </button>

              {/* Import Button */}
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cricket-card hover:bg-cricket-cardHover border border-cricket-border hover:border-cricket-gold/50 text-cricket-gold font-bold text-xs shadow-md transition-all active:scale-95"
                title="Import tournament franchises and players from Excel (.xlsx) or CSV"
              >
                <UploadCloud className="w-4 h-4 text-cricket-gold" />
                <span>Import Sheet (.xlsx / .csv)</span>
              </button>

              {/* Export Button */}
              <button
                onClick={exportAuctionSquadsCSV}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cricket-card hover:bg-cricket-cardHover border border-cricket-border hover:border-cricket-teal/40 text-white font-bold text-xs shadow-md transition-all active:scale-95"
                title="Download full tournament squads and financial report as CSV"
              >
                <Download className="w-4 h-4 text-cricket-teal" />
                <span>Export Squads CSV</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold">
              <Lock className="w-3.5 h-3.5 text-rose-400" />
              <span>Controls &amp; Export Restricted</span>
            </div>
          )}

          {/* Tournament Switcher */}
          <div className="flex rounded-xl bg-cricket-dark border border-cricket-border p-1 text-xs font-bold overflow-x-auto max-w-xs sm:max-w-md">
            {tournamentsList.map((t) => (
              <button
                key={t.slug}
                onClick={() => setActiveTournament(t.slug)}
                className={`px-3 py-2 rounded-lg transition-all whitespace-nowrap ${
                  activeTournament === t.slug
                    ? 'bg-cricket-card text-cricket-teal border border-cricket-teal/30 shadow'
                    : 'text-cricket-muted hover:text-white'
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* AUCTION ROLE STATUS & MASTER CONTROLS BANNER */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        {/* Status Alert for Role */}
        {isSuperAdmin ? (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/70 via-cricket-card to-amber-950/70 border border-amber-500/40 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-cricket-gold flex items-center justify-center font-bold text-lg border border-amber-500/30">
                👑
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display font-extrabold text-base text-white">Super Admin Auction Master Console</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                    auctionStatus === 'live'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40 animate-pulse'
                      : auctionStatus === 'paused'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  }`}>
                    ● Auction {auctionStatus.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-cricket-muted">
                  Full hammer authority (Sold / Unsold), 30s auto-timer controls, live auction toggles, and franchise bidding management.
                </p>
              </div>
            </div>

            {/* Super Admin Master Live Toggles */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  const newStatus = auctionStatus === 'live' ? 'paused' : 'live';
                  setAuctionStatus(newStatus);
                  broadcastAuctionState({ auctionStatus: newStatus });
                  showToast(`Auction status changed to ${newStatus.toUpperCase()}`);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                  auctionStatus === 'live'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                }`}
              >
                {auctionStatus === 'live' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{auctionStatus === 'live' ? 'Pause Auction' : 'Resume Live'}</span>
              </button>

              <button
                onClick={() => {
                  const newStatus = auctionStatus === 'stopped' ? 'live' : 'stopped';
                  setAuctionStatus(newStatus);
                  broadcastAuctionState({ auctionStatus: newStatus });
                  showToast(newStatus === 'stopped' ? 'Auction Stopped' : 'Auction Live');
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cricket-card hover:bg-cricket-cardHover border border-cricket-border text-gray-300 text-xs font-bold transition-all"
              >
                <span>{auctionStatus === 'stopped' ? 'Start Auction' : 'Stop Auction'}</span>
              </button>

              <button
                onClick={() => advanceToNextPlayer()}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cricket-teal/15 hover:bg-cricket-teal/25 border border-cricket-teal/40 text-cricket-teal text-xs font-bold transition-all"
                title="Board next player from pool immediately"
              >
                <span>Board Next Player →</span>
              </button>
            </div>
          </div>
        ) : isFranchiseOwner && userTeam ? (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/70 via-cricket-card to-emerald-950/70 border border-cricket-teal/40 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cricket-teal/20 text-cricket-teal flex items-center justify-center font-display font-black text-lg border border-cricket-teal/40">
                {userTeam.short}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display font-extrabold text-base text-white">Franchise Owner Bidding Mode</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                    canUserBidForTeam(userTeam)
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  }`}>
                    {canUserBidForTeam(userTeam) ? '✓ Bidding Allowed' : 'Bidding Locked'}
                  </span>
                </div>
                <p className="text-xs text-cricket-muted">
                  Logged in as owner of <strong className="text-white">{userTeam.name}</strong>. Tap the button below to place live bids.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] text-cricket-muted font-bold uppercase">Your Available Purse</span>
                <div className="font-display font-extrabold text-xl text-cricket-gold">
                  ₹{(userTeam.allocated - userTeam.spent).toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-cricket-card/80 border border-cricket-border shadow-md flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-gray-300">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold shrink-0">
                <Eye className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-white">Live Spectator Broadcast Mode: </span>
                <span className="text-cricket-muted">Watch bids, timers, and sold/unsold 3D mascot celebrations in real time.</span>
              </div>
            </div>
            {!user ? (
              <Link href="/auth/login" className="px-3 py-1.5 rounded-lg bg-cricket-teal/15 hover:bg-cricket-teal/25 text-cricket-teal border border-cricket-teal/30 font-bold shrink-0">
                Sign In
              </Link>
            ) : (
              <span className="text-[11px] text-cricket-gold font-mono font-semibold shrink-0">
                Signed in: {user.email?.split('@')[0]}
              </span>
            )}
          </div>
        )}

        {/* The Auction Console (100% visible to all without blur) */}
        <div>
          {/* Active Rules Snapshot Banner */}
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-cricket-card to-cricket-dark border border-cricket-border flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cricket-teal/10 border border-cricket-teal/30 flex items-center justify-center text-cricket-teal">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">
                  Active Auction Rule Set: Base Purse ₹{rules.basePurse.toLocaleString('en-IN')} pts • {rules.matchOvers || 10} Overs Innings • Squad Cap {rules.maxSquadSize || 11} Players
                </div>
                <div className="text-[11px] text-cricket-muted">
                  Franchise owner retention: <span className="text-amber-400 font-bold">₹{rules.ownerBlockedPrice} pts</span> • Remaining Purse: <span className="text-cricket-teal font-bold">₹{(rules.basePurse - rules.ownerBlockedPrice).toLocaleString('en-IN')} pts</span> • Base Player Price: <span className="text-white font-bold">₹{rules.defaultPlayerBasePrice} pts</span>
                </div>
              </div>
            </div>

            {(isOrganizer || isSuperAdmin) && (
              <Link
                href="/admin"
                className="text-xs font-bold text-amber-400 hover:text-amber-300 hover:underline flex items-center gap-1"
              >
                <span>Edit Tournament Rules &amp; Overs</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Active Player on the Block & Bidding Keypad */}
            <div className="lg:col-span-2 space-y-6">
              {currentLot ? (
                <div className="glass-card overflow-hidden border-2 border-cricket-teal/40 shadow-2xl space-y-6">
                  {/* Lot Hero Header */}
                  <div className="p-6 sm:p-8 bg-gradient-to-r from-blue-950 via-cricket-card to-cricket-dark border-b border-cricket-border text-center space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold uppercase animate-pulse">
                        <Sparkles className="w-3.5 h-3.5" />
                        Currently on the Block
                      </div>

                      {/* 30-Second Live Synchronized Countdown Timer */}
                      <div className="flex items-center gap-2">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-mono font-black tracking-wider shadow-md ${
                          countdown <= 8
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse'
                            : countdown <= 15
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-cricket-teal/15 text-cricket-teal border-cricket-teal/40'
                        }`}>
                          <Clock className="w-3.5 h-3.5" />
                          <span>00:{countdown < 10 ? `0${countdown}` : countdown}s</span>
                          <span className="text-[10px] font-sans font-semibold uppercase text-gray-300 hidden sm:inline">
                            {countdown <= 8 ? 'Closing Soon!' : 'Timer'}
                          </span>
                        </div>

                        {isSuperAdmin && (
                          <button
                            onClick={() => {
                              setCountdown(30);
                              broadcastAuctionState({ countdown: 30 });
                            }}
                            title="Reset Timer to 30s"
                            className="px-2 py-1 rounded-lg bg-cricket-dark hover:bg-cricket-card border border-cricket-border text-gray-300 text-[11px] font-bold"
                          >
                            ↺ 30s
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Transition / Auto-Boarding Banner */}
                    {transitionMessage && (
                      <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-950 via-cricket-card to-blue-950 border border-cricket-teal text-emerald-300 font-display font-bold text-sm text-center shadow-lg animate-pulse">
                        {transitionMessage}
                      </div>
                    )}

                    <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-tr from-blue-600 to-cricket-teal p-1 shadow-xl">
                      <div className="w-full h-full bg-cricket-card rounded-full flex items-center justify-center font-display font-black text-3xl text-cricket-teal">
                        {currentLot.name.charAt(0)}
                      </div>
                    </div>

                    <div>
                      <h2 className="font-display font-black text-3xl sm:text-4xl text-white">
                        {currentLot.name}
                      </h2>
                      <div className="text-sm font-semibold text-cricket-muted mt-0.5">{currentLot.role}</div>
                    </div>

                    <div className="pt-2">
                      <div className="text-xs font-bold text-cricket-muted uppercase tracking-wider">
                        Current Highest Bid
                      </div>
                      <div className="font-display font-black text-5xl text-cricket-gold drop-shadow-md">
                        ₹{currentLot.currentBid.toLocaleString('en-IN')}
                      </div>
                      <div className="text-sm font-bold text-gray-200 mt-1">
                        Leading:{' '}
                        <span className="text-cricket-teal font-extrabold">
                          {currentLot.leadingTeam || `Opening Base Bid (₹${currentLot.basePrice})`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Step Modifier & Bid Controls */}
                  <div className="p-6 space-y-6">
                    {/* Dynamic Increment Selection & Live Math Strip */}
                    {(() => {
                      const isOpeningRound = !currentLot.leadingTeam;
                      const targetBidAmount = isOpeningRound
                        ? (isOpeningAtBase ? currentLot.basePrice : currentLot.basePrice + selectedIncrement)
                        : currentLot.currentBid + selectedIncrement;

                      return (
                        <div className="p-4 rounded-2xl bg-cricket-dark/90 border border-cricket-border/80 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <span className="text-xs font-black uppercase text-cricket-teal tracking-wider flex items-center gap-1.5">
                                <Zap className="w-4 h-4 text-cricket-gold" />
                                <span>{isOpeningRound ? '1st Opening Bid Selection' : 'Select Bid Increment'}</span>
                              </span>
                              <p className="text-[11px] text-gray-400">
                                {isOpeningRound
                                  ? `Open bid at Base Price (₹${currentLot.basePrice}) or jump directly with +₹50, +₹100, +₹200:`
                                  : `Choose increment to top the current highest bid (₹${currentLot.currentBid.toLocaleString('en-IN')}):`}
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5">
                              {isOpeningRound && (
                                <button
                                  type="button"
                                  onClick={() => setIsOpeningAtBase(true)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                    isOpeningAtBase
                                      ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-cricket-dark font-black shadow-lg shadow-amber-500/20'
                                      : 'bg-cricket-card text-gray-300 hover:text-white border border-cricket-border'
                                  }`}
                                >
                                  Base (₹{currentLot.basePrice})
                                </button>
                              )}
                              {[50, 100, 200, 500].map((step) => (
                                <button
                                  key={step}
                                  type="button"
                                  onClick={() => {
                                    setIsOpeningAtBase(false);
                                    setSelectedIncrement(step);
                                  }}
                                  className={`btn-press px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                    (!isOpeningRound && selectedIncrement === step) || (isOpeningRound && !isOpeningAtBase && selectedIncrement === step)
                                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-cricket-dark font-black shadow-lg shadow-emerald-500/20 scale-105'
                                      : 'bg-cricket-card text-gray-300 hover:text-white border border-cricket-border'
                                  }`}
                                >
                                  +₹{step}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Live Dynamic Calculation Preview Bar */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-semibold text-gray-300 bg-cricket-card/80 p-3 rounded-xl border border-cricket-border/60">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-cricket-muted uppercase text-[10px] tracking-wider font-bold">Calculation:</span>
                              {isOpeningRound ? (
                                isOpeningAtBase ? (
                                  <span className="font-mono text-amber-300 font-bold">
                                    Base Price ₹{currentLot.basePrice} (Opening Bid)
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1.5 font-mono">
                                    <span>Base ₹{currentLot.basePrice}</span>
                                    <span className="text-emerald-400 font-bold">+</span>
                                    <span className="text-emerald-400 font-bold">₹{selectedIncrement} Jump</span>
                                    <span>=</span>
                                    <strong className="text-cricket-gold font-bold text-sm">₹{targetBidAmount.toLocaleString('en-IN')}</strong>
                                  </span>
                                )
                              ) : (
                                <span className="flex items-center gap-1.5 font-mono">
                                  <span>Current ₹{currentLot.currentBid.toLocaleString('en-IN')}</span>
                                  <span className="text-emerald-400 font-bold">+</span>
                                  <span className="text-emerald-400 font-bold">₹{selectedIncrement}</span>
                                  <span>=</span>
                                  <strong className="text-cricket-gold font-bold text-sm">₹{targetBidAmount.toLocaleString('en-IN')}</strong>
                                </span>
                              )}
                            </div>

                            <span className="text-[11px] text-cricket-teal font-medium">
                              {isOpeningRound ? 'Ready for 1st Franchise' : 'Ready to Submit Bid'}
                            </span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Franchise Owner Dedicated 1-Tap Bidding Hero Card */}
                    {isFranchiseOwner && userTeam && (() => {
                      const isOpeningRound = !currentLot.leadingTeam;
                      const targetBidAmount = isOpeningRound
                        ? (isOpeningAtBase ? currentLot.basePrice : currentLot.basePrice + selectedIncrement)
                        : currentLot.currentBid + selectedIncrement;
                      const userRemaining = userTeam.allocated - userTeam.spent;
                      const hasSufficientBudget = userRemaining >= targetBidAmount;
                      const isSquadFull = userTeam.playersBought >= userTeam.maxSquad;
                      const isAlreadyLeading = currentLot.leadingTeam === userTeam.name;

                      return (
                        <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-950 via-cricket-card to-emerald-950 border-2 border-cricket-teal shadow-2xl space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <span className="w-9 h-9 rounded-xl bg-cricket-teal/20 text-cricket-teal border border-cricket-teal/40 font-display font-black flex items-center justify-center text-sm">
                                {userTeam.short}
                              </span>
                              <div>
                                <span className="font-display font-extrabold text-base text-white block">{userTeam.name}</span>
                                <span className="text-[11px] text-cricket-muted">Franchise Owner Console</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-mono font-bold text-cricket-gold block">
                                Purse: ₹{userRemaining.toLocaleString('en-IN')}
                              </span>
                              <span className="text-[10px] text-gray-400">
                                Squad: {userTeam.playersBought}/{userTeam.maxSquad}
                              </span>
                            </div>
                          </div>

                          {isAlreadyLeading ? (
                            <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-display font-bold text-center text-sm flex items-center justify-center gap-2 shadow-inner">
                              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                              <span>👑 You hold the WINNING BID of ₹{currentLot.currentBid.toLocaleString('en-IN')}! (Waiting for rival bids...)</span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleBid(userTeam, isOpeningRound && isOpeningAtBase ? 0 : selectedIncrement)}
                              disabled={!canUserBidForTeam(userTeam) || !hasSufficientBudget || isSquadFull}
                              className="btn-press shimmer-btn w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 hover:brightness-110 text-cricket-dark font-display font-black text-lg tracking-wide shadow-2xl shadow-emerald-500/30 transition-all flex flex-col sm:flex-row items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <div className="flex items-center gap-2">
                                <Gavel className="w-6 h-6" />
                                <span>
                                  PLACE BID: ₹{targetBidAmount.toLocaleString('en-IN')} FOR {userTeam.short}
                                </span>
                              </div>
                              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-black/20 text-cricket-dark">
                                {isOpeningRound ? (isOpeningAtBase ? 'Base Price' : `+₹${selectedIncrement} Jump`) : `+₹${selectedIncrement}`}
                              </span>
                            </button>
                          )}
                        </div>
                      );
                    })()}

                    {/* Team Bidding Buttons Grid */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-cricket-muted uppercase">
                        <span>All Franchises Bidding Grid</span>
                        <span className="text-[11px] font-normal text-gray-400">
                          {isSuperAdmin ? 'Super Admin: Tap any team to bid on their behalf' : 'Live Franchise Status'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {teams.map((t) => {
                          const remaining = t.allocated - t.spent;
                          const isOpeningRound = !currentLot.leadingTeam;
                          const targetBidAmount = isOpeningRound
                            ? (isOpeningAtBase ? currentLot.basePrice : currentLot.basePrice + selectedIncrement)
                            : currentLot.currentBid + selectedIncrement;
                          const isLeading = currentLot.leadingTeam === t.name;
                          const isSquadFull = t.playersBought >= t.maxSquad;
                          const canBid =
                            canUserBidForTeam(t) &&
                            remaining >= targetBidAmount &&
                            !isSquadFull &&
                            !isLeading;

                          return (
                            <button
                              key={t.id}
                              type="button"
                              disabled={!canBid}
                              onClick={() => handleBid(t, isOpeningRound && isOpeningAtBase ? 0 : selectedIncrement)}
                              className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden ${
                                isLeading
                                  ? 'bg-cricket-teal/20 border-cricket-teal text-white shadow-lg shadow-cricket-teal/20 ring-1 ring-cricket-teal'
                                  : canBid
                                  ? 'bg-cricket-dark/80 hover:bg-cricket-card border-cricket-border hover:border-cricket-teal/50 text-white cursor-pointer active:scale-98'
                                  : 'bg-cricket-dark/40 border-cricket-border/40 text-gray-500 cursor-not-allowed opacity-60'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-display font-bold text-base truncate pr-2">
                                  {t.name}
                                </span>
                                <span className="text-xs px-2 py-0.5 rounded bg-cricket-card font-mono font-bold text-cricket-gold">
                                  {t.short}
                                </span>
                              </div>

                              <div className="mt-2 flex items-center justify-between text-xs">
                                <span className="text-cricket-muted">
                                  Purse: ₹{remaining.toLocaleString('en-IN')}
                                </span>
                                <span className="font-bold text-cricket-teal">
                                  Squad: {t.playersBought}/{t.maxSquad}
                                </span>
                              </div>

                              <div className="mt-3 pt-2 border-t border-cricket-border/60 flex items-center justify-between font-bold text-xs">
                                <span>
                                  {isLeading ? '👑 Leading Bidder' : canBid ? 'Bid This Amount:' : 'Status:'}
                                </span>
                                <span className="font-display font-extrabold text-sm text-cricket-gold">
                                  {isLeading
                                    ? `₹${currentLot.currentBid.toLocaleString('en-IN')}`
                                    : canBid
                                    ? `₹${targetBidAmount.toLocaleString('en-IN')} (+₹${isOpeningRound && isOpeningAtBase ? 0 : selectedIncrement})`
                                    : isSquadFull ? 'Squad Full' : remaining < targetBidAmount ? 'Low Purse' : 'Spectator'}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Live Bidding War Ledger */}
                    <div className="p-4 rounded-2xl bg-cricket-dark/60 border border-cricket-border space-y-3">
                      <div className="flex items-center justify-between border-b border-cricket-border/60 pb-2">
                        <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-cricket-teal" />
                          <span>Bidding War History ({currentLot.history.length} Bids on {currentLot.name})</span>
                        </span>
                        {currentLot.history.length > 0 && (
                          <span className="text-[11px] text-emerald-400 font-mono font-bold">
                            Latest: ₹{currentLot.currentBid.toLocaleString('en-IN')} by {currentLot.leadingTeam}
                          </span>
                        )}
                      </div>

                      {currentLot.history.length === 0 ? (
                        <div className="py-4 text-center text-xs text-gray-400 italic">
                          No bids placed on {currentLot.name} yet. Select an increment (+50, +100, +200) and place the opening bid!
                        </div>
                      ) : (
                        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                          {[...currentLot.history].reverse().map((h, i) => (
                            <div
                              key={i}
                              className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                                i === 0
                                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200 font-bold shadow-sm'
                                  : 'bg-cricket-card/50 border-cricket-border/40 text-gray-300'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-md bg-cricket-dark flex items-center justify-center font-mono text-[10px] text-cricket-gold">
                                  #{currentLot.history.length - i}
                                </span>
                                <span className="font-semibold text-white">{h.team}</span>
                                {h.increment !== undefined && (
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                    h.increment === 0 ? 'bg-amber-500/20 text-amber-300' : 'bg-blue-500/20 text-blue-300'
                                  }`}>
                                    {h.increment === 0 ? 'Opening Base' : `+₹${h.increment}`}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3">
                                {h.timestamp && (
                                  <span className="text-[10px] text-gray-500 font-mono">{h.timestamp}</span>
                                )}
                                <span className="font-mono font-extrabold text-sm text-cricket-gold">
                                  ₹{h.bid.toLocaleString('en-IN')}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Master Hammer Controls: Only for Super Admin */}
                    {isSuperAdmin && (
                      <div className="pt-4 border-t border-cricket-border flex flex-wrap items-center justify-between gap-4">
                        <button
                          onClick={handleUndo}
                          disabled={currentLot.history.length === 0}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                            currentLot.history.length > 0
                              ? 'bg-cricket-card hover:bg-cricket-cardHover border-cricket-border text-gray-200'
                              : 'bg-cricket-dark border-cricket-border/40 text-gray-600 cursor-not-allowed'
                          }`}
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span>Undo Last Bid</span>
                        </button>

                        <div className="flex gap-3">
                          <button
                            onClick={handleUnsold}
                            className="btn-press px-5 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-bold text-xs border border-rose-500/30 transition-all cursor-pointer"
                          >
                            Pass as Unsold
                          </button>

                          <button
                            onClick={handleSold}
                            disabled={!currentLot.leadingTeam}
                            className={`btn-press shimmer-btn flex items-center gap-2 px-6 py-2.5 rounded-xl font-display font-black text-sm tracking-wide shadow-xl transition-all cursor-pointer ${
                              currentLot.leadingTeam
                                ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 text-cricket-dark hover:brightness-110 shadow-emerald-500/25'
                                : 'bg-cricket-card text-gray-500 border border-cricket-border cursor-not-allowed'
                            }`}
                          >
                            <Gavel className="w-4 h-4" />
                            <span>HAMMER: SOLD!</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="glass-card p-10 text-center space-y-5 border border-cricket-gold/40 shadow-2xl">
                  {unsoldPlayers.length > 0 ? (
                    <>
                      <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-cricket-gold flex items-center justify-center mx-auto border border-amber-500/30">
                        <Gavel className="w-8 h-8" />
                      </div>
                      <div className="space-y-1">
                        <span className="px-3 py-1 rounded-full bg-amber-500/20 text-cricket-gold text-xs font-bold uppercase tracking-wider border border-amber-500/30">
                          Phase 1 Completed
                        </span>
                        <h3 className="font-display font-black text-2xl sm:text-3xl text-white pt-2">
                          {unsoldPlayers.length} Unsold Players in Pool
                        </h3>
                        <p className="text-sm text-cricket-muted max-w-md mx-auto">
                          Phase 1 is complete! You can now start <strong>Phase 2: Accelerated Unsold Round</strong> to allow franchise owners with remaining purse to bid on the unsold pool.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                        {isAccessAllowed && (
                          <button
                            onClick={handleStartPhase2}
                            className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-cricket-dark font-display font-black text-sm shadow-xl shadow-amber-500/25 active:scale-95 transition-all flex items-center gap-2"
                          >
                            <Zap className="w-4 h-4" />
                            <span>Launch Phase 2: Unsold Players Round ({unsoldPlayers.length})</span>
                          </button>
                        )}
                        <button
                          onClick={handleSyncRegisteredPlayers}
                          className="px-5 py-3 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/40 text-blue-300 font-bold text-sm transition-all"
                        >
                          Sync Registered Players
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 rounded-2xl bg-cricket-teal/10 text-cricket-teal flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-8 h-8" />
                      </div>
                      <h3 className="font-display font-black text-2xl text-white">
                        Auction Lot Completed
                      </h3>
                      <p className="text-sm text-cricket-muted max-w-md mx-auto">
                        All players in the current queue have been processed. All teams and squads are finalized!
                      </p>
                      {isAccessAllowed && (
                        <div className="flex flex-wrap justify-center gap-3 pt-2">
                          <button
                            onClick={handleSyncRegisteredPlayers}
                            className="px-6 py-2.5 rounded-xl bg-cricket-card hover:bg-cricket-cardHover border border-cricket-teal/40 text-cricket-teal font-display font-bold text-sm transition-all"
                          >
                            Sync Newly Registered Players
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Acquired Players Ledger */}
              <div className="glass-card p-6 space-y-4 border border-cricket-border">
                <div className="flex items-center justify-between border-b border-cricket-border pb-3">
                  <h3 className="font-display font-bold text-xl text-white flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>Completed Purchases ({soldTransactions.length})</span>
                  </h3>
                  <span className="text-xs font-semibold text-cricket-muted">
                    Auto-assigned to Squads
                  </span>
                </div>

                <div className="divide-y divide-cricket-border text-sm max-h-80 overflow-y-auto pr-1">
                  {soldTransactions.length === 0 ? (
                    <div className="py-6 text-center text-xs text-cricket-muted">
                      No players acquired yet. Players hammered as SOLD will appear here.
                    </div>
                  ) : (
                    soldTransactions.map((tx) => (
                      <div key={tx.id} className="py-2.5 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-white">{tx.player}</span>
                          <span className="text-xs text-cricket-muted ml-2">({tx.role})</span>
                          <div className="text-xs text-blue-400 font-semibold">{tx.team}</div>
                        </div>
                        <div className="font-display font-bold text-lg text-cricket-gold">
                          ₹{tx.price.toLocaleString('en-IN')}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Live Team Purse & Squad Capacity Tracker */}
            <div className="space-y-6">
              <div className="glass-card p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-cricket-border pb-3">
                  <h3 className="font-display font-bold text-xl text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-cricket-teal" />
                    <span>Team Purse Tracker</span>
                  </h3>
                  <span className="text-xs font-bold text-cricket-muted">
                    ₹{rules.basePurse.toLocaleString('en-IN')} Budget
                  </span>
                </div>

                <div className="space-y-4">
                  {teams.length === 0 ? (
                    <div className="p-4 rounded-xl bg-cricket-dark/50 border border-dashed border-cricket-border/60 text-center space-y-1">
                      <p className="text-sm font-semibold text-gray-300">No franchise teams registered yet</p>
                      <p className="text-xs text-cricket-muted">
                        Assign franchise owners in Super Admin or click &apos;Import Sheet&apos; to load teams.
                      </p>
                    </div>
                  ) : (
                    teams.map((t) => {
                      const remaining = t.allocated - t.spent;
                      const percentSpent = (t.spent / t.allocated) * 100;
                      return (
                        <div key={t.id} className="p-3.5 rounded-xl bg-cricket-dark/80 border border-cricket-border space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-bold text-white text-sm">{t.name}</span>
                              {t.owner && (
                                <div className="text-[11px] text-amber-400 font-semibold">
                                  Owner: {t.owner} (Blocked ₹{rules.ownerBlockedPrice})
                                </div>
                              )}
                            </div>
                            <span className="text-xs font-semibold text-cricket-muted">
                              {t.playersBought} / {t.maxSquad} Players
                            </span>
                          </div>

                          {/* Purse Bar */}
                          <div className="w-full h-2 rounded-full bg-cricket-card overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-cricket-teal transition-all duration-300"
                              style={{ width: `${Math.min(100, percentSpent)}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-xs pt-1">
                            <span className="text-cricket-muted">
                              Spent: ₹{t.spent.toLocaleString('en-IN')}
                            </span>
                            <span className="font-bold text-cricket-teal">
                              Remaining: ₹{remaining.toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Unsold Pool */}
              {unsoldPlayers.length > 0 && (
                <div className="glass-card p-6 space-y-3 border border-cricket-border">
                  <h4 className="font-display font-bold text-lg text-white">
                    Unsold Player Pool ({unsoldPlayers.length})
                  </h4>
                  <p className="text-xs text-cricket-muted">
                    These players can be reintroduced in subsequent rounds by the tournament organizer.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {unsoldPlayers.map((name) => (
                      <span
                        key={name}
                        className="px-2.5 py-1 rounded-lg bg-cricket-dark border border-cricket-border text-xs text-gray-300"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* IMPORT WORKBOOK MODAL (.xlsx / .csv) */}
      {/* ========================================================================= */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="max-w-2xl w-full p-6 sm:p-8 rounded-3xl bg-cricket-dark border border-cricket-border shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-cricket-border pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cricket-gold/10 border border-cricket-gold/30 text-cricket-gold flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-xl text-white">
                    Import Tournament Roster (.xlsx / .csv)
                  </h3>
                  <p className="text-xs text-cricket-muted">
                    Upload your tournament excel with Franchise, Owner, and Player columns
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportFile(null);
                  setParsedPreview(null);
                  setImportError(null);
                }}
                className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-cricket-card"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Rules explanation box */}
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-200 text-xs space-y-1.5 leading-relaxed">
              <div className="font-bold text-white flex items-center gap-1.5">
                <Info className="w-4 h-4 text-cricket-teal" />
                <span>Automatic Budget &amp; Owner Retention Rules:</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-gray-300">
                <li>Total Base Points per Franchise: <strong className="text-white">₹{rules.basePurse.toLocaleString('en-IN')}</strong></li>
                <li>Franchise Owner Blocked Base Price: <strong className="text-amber-400">₹{rules.ownerBlockedPrice}</strong> (Retained in team squad)</li>
                <li>Effective Remaining Starting Purse: <strong className="text-cricket-teal">₹{(rules.basePurse - rules.ownerBlockedPrice).toLocaleString('en-IN')}</strong></li>
                <li>Player Base Price: <strong className="text-white">₹{rules.defaultPlayerBasePrice}</strong> (Added into live auction queue)</li>
              </ul>
            </div>

            {/* File Upload Drop Area */}
            <div className="border-2 border-dashed border-cricket-border hover:border-cricket-teal/50 rounded-2xl p-6 text-center space-y-3 bg-cricket-card/30">
              <input
                type="file"
                id="excel-upload"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelected}
                className="hidden"
              />
              <label
                htmlFor="excel-upload"
                className="cursor-pointer block space-y-2"
              >
                <UploadCloud className="w-10 h-10 text-cricket-teal mx-auto" />
                <div className="text-sm font-bold text-white">
                  {importFile ? importFile.name : 'Click to select tournament .xlsx or .csv workbook'}
                </div>
                <div className="text-xs text-cricket-muted">
                  Supports multi-sheet or single sheet formats (e.g. DDPL_Tournament_Data.xlsx)
                </div>
              </label>
            </div>

            {/* Error Message */}
            {importError && (
              <div className="p-3.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{importError}</span>
              </div>
            )}

            {/* Parsed Preview */}
            {parsedPreview && (
              <div className="space-y-4 max-h-60 overflow-y-auto pr-1">
                <div className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>
                    Successfully parsed: {parsedPreview.teams.length} Franchises and {parsedPreview.totalPlayersFound} Total Players ({parsedPreview.soldTransactions.length} Retained Owners + {parsedPreview.playerPool.length} in Auction Pool)!
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-cricket-card border border-cricket-border space-y-1">
                    <span className="font-bold text-white">Detected Franchises &amp; Owners:</span>
                    <ul className="space-y-1 text-gray-300 pt-1">
                      {parsedPreview.teams.map((t: any) => (
                        <li key={t.id} className="truncate">
                          🏏 <strong className="text-cricket-teal">{t.name}</strong> ({t.owner})
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 rounded-xl bg-cricket-card border border-cricket-border space-y-1">
                    <span className="font-bold text-white">Sample Auction Pool Players:</span>
                    <ul className="space-y-1 text-gray-300 pt-1">
                      {parsedPreview.playerPool.slice(0, 4).map((p: any) => (
                        <li key={p.id} className="truncate">
                          👤 {p.name} <span className="text-cricket-muted">({p.role} - ₹{p.basePrice})</span>
                        </li>
                      ))}
                      {parsedPreview.playerPool.length > 4 && (
                        <li className="text-cricket-muted italic">
                          + {parsedPreview.playerPool.length - 4} more players queued
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-cricket-border">
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportFile(null);
                  setParsedPreview(null);
                }}
                className="px-4 py-2 rounded-xl text-gray-400 hover:text-white text-xs font-bold"
              >
                Cancel
              </button>
              <button
                disabled={!parsedPreview || isImporting}
                onClick={handleApplyImport}
                className={`px-6 py-2.5 rounded-xl font-display font-extrabold text-sm shadow-xl transition-all ${
                  parsedPreview && !isImporting
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-cricket-dark hover:brightness-110 active:scale-95'
                    : 'bg-cricket-card text-gray-500 border border-cricket-border cursor-not-allowed'
                }`}
              >
                {isImporting ? 'Importing Roster...' : 'Load & Reflect in Auction Room'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3D LIVE AUCTION MASCOT TRANSPARENT OVERLAY (12 SOLD + 12 UNSOLD VARIATIONS) */}
      {/* ========================================================================= */}
      <ErrorBoundary fallback={null}>
        <AuctionMascotOverlay
          event={activeMascotEvent}
          onDismiss={() => setActiveMascotEvent(null)}
        />
      </ErrorBoundary>
    </div>
  );
}
