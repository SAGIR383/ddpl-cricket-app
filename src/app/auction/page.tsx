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
  Square,
  Eye,
  Tv,
  Volume2,
  VolumeX,
  Flame,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import confetti from 'canvas-confetti';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { ParsedFranchise, ParsedPlayer } from '@/lib/auctionImport';
import type { MascotEventData } from '@/components/auction/AuctionMascotOverlay';
import { fetchWithCache } from '@/lib/clientCache';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { auctionAudio } from '@/lib/auctionAudio';

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

  // Audio, Projector & RTM State
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [isAcceleratedRound, setIsAcceleratedRound] = useState<boolean>(false);
  const [isRtmModalOpen, setIsRtmModalOpen] = useState<boolean>(false);
  const [rtmSelectedTeam, setRtmSelectedTeam] = useState<string>('');

  const currentTourneyMeta = tournamentsList.find((t) => t.slug === activeTournament);
  const currencySymbol = currentTourneyMeta?.currencySymbol || (activeTournament === 'game-of-run' ? 'د.إ' : '₹');

  useEffect(() => {
    setIsAudioMuted(auctionAudio.isMuted());
  }, []);

  const handleToggleSound = () => {
    const next = auctionAudio.toggleMute();
    setIsAudioMuted(next);
    showToast(next ? '🔇 Auction Sound Effects Muted' : '🔊 Auction Sound Effects Enabled');
  };

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
        if (prev <= 6 && prev > 1) {
          auctionAudio.playCountdownBeep(prev === 2);
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
      alert(`You already hold the highest bid of ${currencySymbol}${currentLot.currentBid.toLocaleString()}! Wait for another franchise to bid.`);
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
      alert(`Cannot bid: ${team.name} has insufficient remaining budget (${currencySymbol}${(team.allocated - team.spent).toLocaleString()} left)!`);
      return;
    }

    if (team.playersBought >= team.maxSquad) {
      alert(`Cannot bid: ${team.name} has reached maximum squad capacity (${team.maxSquad})!`);
      return;
    }

    // Play synthesized bell chime
    auctionAudio.playBidChime();

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

    showToast(`🔨 ${team.short} placed bid: ${currencySymbol}${nextBid.toLocaleString()} ${incrementLogged > 0 ? `(+${currencySymbol}${incrementLogged})` : '(Opening Base)'}`);
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

    // Play resonant gavel hammer sound effect
    auctionAudio.playGavelStrike();

    const msg = isAuto
      ? `⏰ 30s Up! AUTO-SOLD: ${soldPlayer} won by ${winningTeamName} for ${currencySymbol}${finalPrice.toLocaleString()}! Boarding next player in 4s...`
      : `🔨 HAMMER SOLD! ${soldPlayer} won by ${winningTeamName} for ${currencySymbol}${finalPrice.toLocaleString()}! Boarding next player in 4s...`;
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

    // Play unsold double buzzer sound effect
    auctionAudio.playUnsoldBuzzer();

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

  // Right to Match (RTM) Card Invocation
  function handleInvokeRTM(rtmTeamName: string) {
    if (!currentLot || !currentLot.leadingTeam) return;
    const rtmTeam = teams.find((t) => t.name === rtmTeamName);
    if (!rtmTeam) return;

    if (currentLot.leadingTeam === rtmTeam.name) {
      alert(`${rtmTeam.name} already holds the winning bid!`);
      return;
    }

    const currentPrice = currentLot.currentBid;
    const remaining = rtmTeam.allocated - rtmTeam.spent;
    if (remaining < currentPrice) {
      alert(`Insufficient purse: ${rtmTeam.name} has ${currencySymbol}${remaining.toLocaleString()} left, but matching bid requires ${currencySymbol}${currentPrice.toLocaleString()}.`);
      return;
    }

    if (confirm(`Invoke Right to Match (RTM)?\n\n${rtmTeam.name} will match the highest bid of ${currencySymbol}${currentPrice.toLocaleString()} and claim ${currentLot.name}!`)) {
      auctionAudio.playRtmFanfare();
      confetti({ particleCount: 150, spread: 90, colors: ['#D8AD55', '#10B981', '#3B82F6'] });
      executeSold(rtmTeam.name, currentPrice, currentLot.name, currentLot.role, false);
      showToast(`⚡ RIGHT TO MATCH INVOKED! ${rtmTeam.name} matched ${currencySymbol}${currentPrice.toLocaleString()} to retain ${currentLot.name}!`);
      setIsRtmModalOpen(false);
    }
  }

  // Enhanced Accelerated Unsold Round
  function handleStartAcceleratedRound(discount50Percent: boolean = false) {
    if (unsoldPlayers.length === 0) {
      alert('No unsold players available for accelerated round.');
      return;
    }

    const reAuctionPool: ParsedPlayer[] = unsoldPlayers.map((name, idx) => {
      const existing = playerPool.find((p) => p.name === name);
      const rawBase = existing?.basePrice || rules.defaultPlayerBasePrice || 500;
      const basePrice = discount50Percent ? Math.max(100, Math.floor(rawBase / 2)) : rawBase;
      return {
        id: `p-accel-${idx + 1}`,
        name,
        role: existing?.role || 'All Rounder',
        basePrice,
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

    setIsAcceleratedRound(true);
    setPlayerPool(reAuctionPool);
    setUnsoldPlayers([]);
    setCurrentLot(firstLot);
    setCountdown(15); // Fast 15s timer for accelerated round

    broadcastAuctionState({
      playerPool: reAuctionPool,
      unsoldPlayers: [],
      currentLot: firstLot,
      countdown: 15,
      isAcceleratedRound: true,
    });

    showToast(`⚡ Accelerated Round Started with ${reAuctionPool.length} players (15s fast timer)!`);
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
    handleStartAcceleratedRound(false);
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative z-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-[#D8AD55]/15 pb-6">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Gavel className="w-6 h-6 text-[#D8AD55]" />
              <h1 className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight">
                Player Auction Command Center
              </h1>
            </div>

            {/* Live Status Indicator */}
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/15 text-blue-300 text-xs font-bold border border-blue-500/30">
              <Radio className="w-3 h-3 text-blue-400 animate-pulse" />
              <span>Room: {syncStatus}</span>
            </span>

            {isAccessAllowed && (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D8AD55]/15 text-[#F2D69A] text-xs font-bold border border-[#D8AD55]/30">
                <Shield className="w-3 h-3 text-[#D8AD55]" />
                <span>Organizer Verified ({role})</span>
              </span>
            )}

            <span className="text-[11px] text-[#8793A5]">
              Sync: {lastSyncTime}
            </span>
          </div>

          <p className="text-sm text-[#8793A5] mt-1.5 max-w-2xl">
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
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-300 font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                title="Sync all self-registered players into this tournament auction pool"
              >
                <Users className="w-4 h-4 text-blue-400" />
                <span>Sync Registered Players</span>
              </button>

              {/* Import Button */}
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#0D1B2A] hover:bg-[#111D2D] border border-[#D8AD55]/30 hover:border-[#D8AD55] text-[#F2D69A] font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                title="Import tournament franchises and players from Excel (.xlsx) or CSV"
              >
                <UploadCloud className="w-4 h-4 text-[#D8AD55]" />
                <span>Import Sheet (.xlsx / .csv)</span>
              </button>

              {/* Export Button */}
              <button
                onClick={exportAuctionSquadsCSV}
                className="btn-press shimmer-btn flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] text-[#08111F] font-display font-black text-xs uppercase tracking-wider shadow-lg transition-all active:scale-95 cursor-pointer"
                title="Download full tournament squads and financial report as CSV"
              >
                <Download className="w-4 h-4 text-[#08111F]" />
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
          <div className="flex rounded-2xl bg-[#0D1B2A] border border-[#D8AD55]/30 p-1 text-xs font-bold shadow-md">
            {tournamentsList.map((t) => (
              <button
                key={t.slug}
                onClick={() => setActiveTournament(t.slug)}
                className={`px-3.5 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                  activeTournament === t.slug
                    ? 'bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] text-[#08111F] font-black shadow'
                    : 'text-[#8793A5] hover:text-white'
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
        {isAccessAllowed ? (
          <div className="p-5 rounded-3xl bg-[#0D1B2A]/95 backdrop-blur-md border border-[#D8AD55]/40 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#D8AD55]/15 border border-[#D8AD55]/30 text-[#D8AD55] flex items-center justify-center font-bold text-xl shadow-inner">
                👑
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display font-black text-lg text-white">
                    {isSuperAdmin ? 'Super Admin Auction Master Console' : 'Tournament Organizer Command Console'}
                  </span>
                  <span className={`px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                    auctionStatus === 'live'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40 animate-pulse'
                      : auctionStatus === 'paused'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  }`}>
                    ● Auction {auctionStatus.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-[#8793A5] mt-1">
                  Full hammer authority (Sold / Unsold), 30s auto-timer controls, live auction pause/stop toggles, and franchise bidding management.
                </p>
              </div>
            </div>

            {/* Super Admin / Organizer Master Live Toggles */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  const newStatus = auctionStatus === 'live' ? 'paused' : 'live';
                  setAuctionStatus(newStatus);
                  broadcastAuctionState({ auctionStatus: newStatus });
                  showToast(`Auction status changed to ${newStatus.toUpperCase()}`);
                }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
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
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#08111F] hover:bg-[#111D2D] border border-white/10 text-gray-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
              >
                <Square className="w-3.5 h-3.5" />
                <span>{auctionStatus === 'stopped' ? 'Start Auction' : 'Stop Auction'}</span>
              </button>

              <button
                onClick={() => advanceToNextPlayer()}
                className="btn-press shimmer-btn flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] text-[#08111F] font-display font-black text-xs uppercase tracking-wider shadow-md hover:brightness-110 transition-all cursor-pointer"
                title="Board next player from pool immediately"
              >
                <span>Board Next Player →</span>
              </button>

              <button
                onClick={() => {
                  setCountdown(30);
                  broadcastAuctionState({ countdown: 30 });
                  showToast('Timer reset to 30s');
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#08111F] hover:bg-[#111D2D] border border-[#D8AD55]/30 text-[#F2D69A] text-xs font-bold transition-all cursor-pointer"
                title="Reset 30-second live bidding timer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#D8AD55]" />
                <span>Reset 30s</span>
              </button>
            </div>
          </div>
        ) : isFranchiseOwner && userTeam ? (
          <div className="p-5 rounded-3xl bg-[#0D1B2A]/90 backdrop-blur-md border border-[#D8AD55]/30 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#08111F] text-[#F2D69A] flex items-center justify-center font-display font-black text-lg border border-[#D8AD55]/30 shadow-inner">
                {userTeam.short}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display font-black text-base text-white">Franchise Owner Bidding Mode</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                    canUserBidForTeam(userTeam)
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  }`}>
                    {canUserBidForTeam(userTeam) ? '✓ Bidding Allowed' : 'Bidding Locked'}
                  </span>
                </div>
                <p className="text-xs text-[#8793A5] mt-0.5">
                  Logged in as owner of <strong className="text-white">{userTeam.name}</strong>. Tap the button below to place live bids.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] text-[#8793A5] font-bold uppercase tracking-wider">Your Available Purse</span>
                <div className="font-display font-black text-2xl text-[#F2D69A]">
                  {currencySymbol}{(userTeam.allocated - userTeam.spent).toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-3xl bg-[#0D1B2A]/80 backdrop-blur-md border border-[#D8AD55]/20 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3 text-gray-300">
              <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center font-bold shrink-0">
                <Eye className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-white">Live Spectator Broadcast Mode: </span>
                <span className="text-[#8793A5]">Watch bids, timers, and sold/unsold celebrations in real time.</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/admin/login"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] text-[#08111F] font-display font-black text-xs uppercase tracking-wider shadow hover:brightness-110 transition-all cursor-pointer"
              >
                👑 Organizer / Admin Login
              </Link>
            </div>
          </div>
        )}

        {/* The Auction Console (100% visible to all without blur) */}
        <div>
          {/* Active Rules Snapshot Banner */}
          <div className="mb-6 p-4 sm:p-5 rounded-3xl bg-[#0D1B2A]/90 backdrop-blur-md border border-[#D8AD55]/25 shadow-xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-[#D8AD55]/15 border border-[#D8AD55]/30 flex items-center justify-center text-[#D8AD55] shadow-inner">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">
                  Active Auction Rule Set: Base Purse <span className="text-[#F2D69A] font-extrabold">{currencySymbol}{rules.basePurse.toLocaleString('en-IN')} pts</span> • {rules.matchOvers || 10} Overs Innings • Squad Cap {rules.maxSquadSize || 11} Players
                </div>
                <div className="text-[11px] text-[#8793A5] mt-0.5">
                  Franchise owner retention: <span className="text-[#F2D69A] font-bold">{currencySymbol}{rules.ownerBlockedPrice} pts</span> • Remaining Starting Purse: <span className="text-white font-bold">{currencySymbol}{(rules.basePurse - rules.ownerBlockedPrice).toLocaleString('en-IN')} pts</span> • Base Player Price: <span className="text-white font-bold">{currencySymbol}{rules.defaultPlayerBasePrice} pts</span>
                </div>
              </div>
            </div>

            {(isOrganizer || isSuperAdmin) && (
              <Link
                href="/admin"
                className="text-xs font-bold text-[#F2D69A] hover:underline flex items-center gap-1 cursor-pointer"
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
                <div className="bg-[#0D1B2A]/95 backdrop-blur-md rounded-3xl overflow-hidden border border-[#D8AD55]/40 shadow-2xl space-y-6">
                  {/* Lot Hero Header */}
                  <div className="p-6 sm:p-8 bg-gradient-to-r from-[#08111F] via-[#0D1B2A] to-[#111D2D] border-b border-[#D8AD55]/20 text-center space-y-5 relative">
                    <div className="flex items-center justify-between">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D8AD55]/15 text-[#F2D69A] border border-[#D8AD55]/30 text-xs font-bold uppercase tracking-wider animate-pulse">
                        <Sparkles className="w-3.5 h-3.5 text-[#D8AD55]" />
                        <span>Live on the Block</span>
                      </div>

                      {/* 30-Second Live Broadcast Circular Countdown Dial */}
                      <div className="flex items-center gap-3">
                        <div className="relative w-14 h-14 flex items-center justify-center">
                          {/* Circular SVG Ring */}
                          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 56 56">
                            <circle
                              cx="28"
                              cy="28"
                              r="23"
                              className="stroke-white/10"
                              strokeWidth="3.5"
                              fill="transparent"
                            />
                            <circle
                              cx="28"
                              cy="28"
                              r="23"
                              className={`transition-all duration-1000 ease-linear ${
                                countdown <= 8
                                  ? 'stroke-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]'
                                  : countdown <= 15
                                  ? 'stroke-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                                  : 'stroke-[#D8AD55] drop-shadow-[0_0_8px_rgba(216,173,85,0.8)]'
                              }`}
                              strokeWidth="3.5"
                              strokeDasharray={144.5}
                              strokeDashoffset={144.5 - (144.5 * Math.max(0, countdown)) / 30}
                              strokeLinecap="round"
                              fill="transparent"
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className={`font-mono font-black text-sm ${
                              countdown <= 8 ? 'text-rose-400 animate-pulse' : countdown <= 15 ? 'text-amber-300' : 'text-[#F2D69A]'
                            }`}>
                              {countdown}s
                            </span>
                          </div>
                        </div>

                        {isAccessAllowed && (
                          <button
                            onClick={() => {
                              setCountdown(30);
                              broadcastAuctionState({ countdown: 30 });
                              showToast('Timer reset to 30s');
                            }}
                            title="Reset Timer to 30s"
                            className="px-2.5 py-1.5 rounded-xl bg-[#08111F] hover:bg-[#111D2D] border border-[#D8AD55]/30 text-[#F2D69A] text-xs font-bold transition-all shadow-sm cursor-pointer"
                          >
                            ↺ 30s
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Transition / Auto-Boarding Banner */}
                    {transitionMessage && (
                      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950 via-[#0D1B2A] to-blue-950 border border-emerald-500/50 text-emerald-300 font-display font-bold text-sm text-center shadow-lg animate-pulse">
                        {transitionMessage}
                      </div>
                    )}

                    <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-tr from-[#D8AD55] via-[#F2D69A] to-[#0D1B2A] p-[2px] shadow-2xl">
                      <div className="w-full h-full bg-[#08111F] rounded-[22px] flex items-center justify-center font-display font-black text-3xl text-[#F2D69A]">
                        {currentLot.name.charAt(0)}
                      </div>
                    </div>

                    <div>
                      <h2 className="font-display font-black text-3xl sm:text-5xl text-white tracking-tight">
                        {currentLot.name}
                      </h2>
                      <div className="text-xs sm:text-sm font-bold text-[#D8AD55] uppercase tracking-wider mt-1">{currentLot.role}</div>
                    </div>

                    <div className="pt-3 border-t border-white/5 max-w-md mx-auto">
                      <div className="text-[11px] font-bold text-[#8793A5] uppercase tracking-widest">
                        Current Highest Bid
                      </div>
                      <div className="font-display font-black text-5xl sm:text-6xl text-[#D8AD55] drop-shadow-[0_0_25px_rgba(216,173,85,0.35)] mt-1">
                        {currencySymbol}{currentLot.currentBid.toLocaleString('en-IN')}
                      </div>
                      <div className="text-sm font-semibold text-gray-200 mt-1">
                        Leading Bidder:{' '}
                        <span className="text-[#F2D69A] font-black">
                          {currentLot.leadingTeam || `Opening Base Bid (${currencySymbol}${currentLot.basePrice})`}
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
                        <div className="p-5 rounded-2xl bg-[#08111F] border border-[#D8AD55]/30 space-y-3 shadow-inner">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <span className="text-xs font-black uppercase text-[#F2D69A] tracking-wider flex items-center gap-1.5">
                                <Zap className="w-4 h-4 text-[#D8AD55]" />
                                <span>{isOpeningRound ? 'Opening Bid Strategy' : 'Select Bid Increment'}</span>
                              </span>
                              <p className="text-[11px] text-[#8793A5] mt-0.5">
                                {isOpeningRound
                                  ? `Open bid at Base Price (${currencySymbol}${currentLot.basePrice}) or jump directly with +${currencySymbol}50, +${currencySymbol}100, +${currencySymbol}200:`
                                  : `Choose increment to top the current highest bid (${currencySymbol}${currentLot.currentBid.toLocaleString('en-IN')}):`}
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5">
                              {isOpeningRound && (
                                <button
                                  type="button"
                                  onClick={() => setIsOpeningAtBase(true)}
                                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                    isOpeningAtBase
                                      ? 'bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] text-[#08111F] font-black shadow-lg shadow-[#D8AD55]/20'
                                      : 'bg-[#0D1B2A] text-gray-300 hover:text-white border border-[#D8AD55]/20'
                                  }`}
                                >
                                  Base ({currencySymbol}{currentLot.basePrice})
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
                                      ? 'bg-gradient-to-r from-[#D8AD55] via-[#F2D69A] to-[#D8AD55] text-[#08111F] font-black shadow-lg shadow-[#D8AD55]/25 scale-105'
                                      : 'bg-[#0D1B2A] text-gray-300 hover:text-white border border-[#D8AD55]/20'
                                  }`}
                                >
                                  +{currencySymbol}{step}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Live Dynamic Calculation Preview Bar */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-semibold text-gray-300 bg-[#0D1B2A] p-3.5 rounded-xl border border-white/5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[#8793A5] uppercase text-[10px] tracking-wider font-bold">Calculation:</span>
                              {isOpeningRound ? (
                                isOpeningAtBase ? (
                                  <span className="font-mono text-[#F2D69A] font-bold">
                                    Base Price {currencySymbol}{currentLot.basePrice} (Opening Bid)
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1.5 font-mono">
                                    <span>Base {currencySymbol}{currentLot.basePrice}</span>
                                    <span className="text-[#D8AD55] font-bold">+</span>
                                    <span className="text-[#D8AD55] font-bold">{currencySymbol}{selectedIncrement} Jump</span>
                                    <span>=</span>
                                    <strong className="text-[#F2D69A] font-bold text-sm">{currencySymbol}{targetBidAmount.toLocaleString('en-IN')}</strong>
                                  </span>
                                )
                              ) : (
                                <span className="flex items-center gap-1.5 font-mono">
                                  <span>Current {currencySymbol}{currentLot.currentBid.toLocaleString('en-IN')}</span>
                                  <span className="text-[#D8AD55] font-bold">+</span>
                                  <span className="text-[#D8AD55] font-bold">{currencySymbol}{selectedIncrement}</span>
                                  <span>=</span>
                                  <strong className="text-[#F2D69A] font-bold text-sm">{currencySymbol}{targetBidAmount.toLocaleString('en-IN')}</strong>
                                </span>
                              )}
                            </div>

                            <span className="text-[11px] text-[#D8AD55] font-medium">
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
                        <div className="p-5 rounded-2xl bg-gradient-to-r from-[#08111F] via-[#0D1B2A] to-[#111D2D] border-2 border-[#D8AD55]/50 shadow-2xl space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <span className="w-10 h-10 rounded-xl bg-[#D8AD55]/15 text-[#D8AD55] border border-[#D8AD55]/40 font-display font-black flex items-center justify-center text-sm">
                                {userTeam.short}
                              </span>
                              <div>
                                <span className="font-display font-black text-base text-white block">{userTeam.name}</span>
                                <span className="text-[11px] text-[#8793A5]">Franchise Owner Console</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-mono font-bold text-[#D8AD55] block">
                                Purse: {currencySymbol}{userRemaining.toLocaleString('en-IN')}
                              </span>
                              <span className="text-[10px] text-[#8793A5]">
                                Squad: {userTeam.playersBought}/{userTeam.maxSquad}
                              </span>
                            </div>
                          </div>

                          {isAlreadyLeading ? (
                            <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 font-display font-bold text-center text-sm flex items-center justify-center gap-2 shadow-inner">
                              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                              <span>👑 You hold the WINNING BID of {currencySymbol}{currentLot.currentBid.toLocaleString('en-IN')}!</span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleBid(userTeam, isOpeningRound && isOpeningAtBase ? 0 : selectedIncrement)}
                              disabled={!canUserBidForTeam(userTeam) || !hasSufficientBudget || isSquadFull}
                              className="btn-press shimmer-btn w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#D8AD55] via-[#F2D69A] to-[#D8AD55] hover:brightness-110 text-[#08111F] font-display font-black text-base sm:text-lg tracking-wider uppercase shadow-2xl shadow-[#D8AD55]/25 transition-all flex flex-col sm:flex-row items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <div className="flex items-center gap-2">
                                <Gavel className="w-6 h-6" />
                                <span>
                                  PLACE BID: {currencySymbol}{targetBidAmount.toLocaleString('en-IN')} FOR {userTeam.short}
                                </span>
                              </div>
                              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-black/20 text-[#08111F]">
                                {isOpeningRound ? (isOpeningAtBase ? 'Base Price' : `+${currencySymbol}${selectedIncrement} Jump`) : `+${currencySymbol}${selectedIncrement}`}
                              </span>
                            </button>
                          )}
                        </div>
                      );
                    })()}

                    {/* Team Bidding Buttons Grid */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold text-[#8793A5] uppercase tracking-wider">
                        <span>All Franchises Bidding Grid</span>
                        <span className="text-[11px] font-normal text-[#8793A5]">
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
                              className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden ${
                                isLeading
                                  ? 'bg-[#D8AD55]/20 border-[#D8AD55] text-white shadow-xl shadow-[#D8AD55]/20 ring-1 ring-[#D8AD55]'
                                  : canBid
                                  ? 'bg-[#08111F] hover:bg-[#111D2D] border-[#D8AD55]/30 hover:border-[#D8AD55] text-white cursor-pointer active:scale-98'
                                  : 'bg-[#08111F]/40 border-white/5 text-gray-500 cursor-not-allowed opacity-50'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-display font-bold text-base truncate pr-2">
                                  {t.name}
                                </span>
                                <span className="text-xs px-2.5 py-0.5 rounded-md bg-[#0D1B2A] font-mono font-bold text-[#D8AD55] border border-[#D8AD55]/20">
                                  {t.short}
                                </span>
                              </div>

                              <div className="mt-2 flex items-center justify-between text-xs">
                                <span className="text-[#8793A5]">
                                  Purse: {currencySymbol}{remaining.toLocaleString('en-IN')}
                                </span>
                                <span className="font-bold text-[#F2D69A]">
                                  Squad: {t.playersBought}/{t.maxSquad}
                                </span>
                              </div>

                              <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between font-bold text-xs">
                                <span>
                                  {isLeading ? '👑 Leading Bidder' : canBid ? 'Bid This Amount:' : 'Status:'}
                                </span>
                                <span className="font-display font-extrabold text-sm text-[#D8AD55]">
                                  {isLeading
                                    ? `${currencySymbol}${currentLot.currentBid.toLocaleString('en-IN')}`
                                    : canBid
                                    ? `${currencySymbol}${targetBidAmount.toLocaleString('en-IN')} (+${currencySymbol}${isOpeningRound && isOpeningAtBase ? 0 : selectedIncrement})`
                                    : isSquadFull ? 'Squad Full' : remaining < targetBidAmount ? 'Low Purse' : 'Spectator'}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Live Bidding War Ledger */}
                    <div className="p-4 rounded-2xl bg-[#08111F] border border-[#D8AD55]/20 space-y-3">
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-[#D8AD55]" />
                          <span>Bidding War History ({currentLot.history.length} Bids on {currentLot.name})</span>
                        </span>
                        {currentLot.history.length > 0 && (
                          <span className="text-[11px] text-[#F2D69A] font-mono font-bold">
                            Latest: {currencySymbol}{currentLot.currentBid.toLocaleString('en-IN')} by {currentLot.leadingTeam}
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
                                  ? 'bg-[#D8AD55]/15 border-[#D8AD55]/40 text-[#F2D69A] font-bold shadow-sm'
                                  : 'bg-[#0D1B2A] border-white/5 text-gray-300'
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
                                  {currencySymbol}{h.bid.toLocaleString('en-IN')}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Master Hammer Controls: Only for Super Admin */}
                    {isSuperAdmin && (
                      <div className="pt-5 border-t border-white/5 flex flex-wrap items-center justify-between gap-4">
                        <button
                          onClick={handleUndo}
                          disabled={currentLot.history.length === 0}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                            currentLot.history.length > 0
                              ? 'bg-[#08111F] hover:bg-[#111D2D] border-[#D8AD55]/30 text-[#F2D69A] cursor-pointer'
                              : 'bg-[#08111F]/50 border-white/5 text-[#8793A5] cursor-not-allowed opacity-50'
                          }`}
                        >
                          <RotateCcw className="w-4 h-4 text-[#D8AD55]" />
                          <span>Undo Last Bid</span>
                        </button>

                        <div className="flex flex-wrap items-center gap-3">
                          {/* Right to Match (RTM) Trigger Button */}
                          {currentLot.leadingTeam && teams.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                setRtmSelectedTeam('');
                                setIsRtmModalOpen(true);
                              }}
                              className="btn-press px-4 py-2.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-bold text-xs border border-purple-500/40 transition-all cursor-pointer flex items-center gap-1.5"
                              title="Right to Match (RTM) Option"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                              <span>Invoke RTM</span>
                            </button>
                          )}

                          <button
                            onClick={handleUnsold}
                            className="btn-press px-5 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 font-bold text-xs border border-rose-500/40 transition-all cursor-pointer"
                          >
                            Pass as Unsold
                          </button>

                          <button
                            onClick={handleSold}
                            disabled={!currentLot.leadingTeam}
                            className={`btn-press shimmer-btn flex items-center gap-2 px-7 py-3 rounded-xl font-display font-black text-xs uppercase tracking-wider shadow-2xl transition-all cursor-pointer ${
                              currentLot.leadingTeam
                                ? 'bg-gradient-to-r from-[#D8AD55] via-[#F2D69A] to-[#D8AD55] text-[#08111F] hover:brightness-110 shadow-[#D8AD55]/30'
                                : 'bg-[#08111F] text-gray-500 border border-white/10 cursor-not-allowed'
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
                <div className="bg-[#0D1B2A]/95 backdrop-blur-md p-10 sm:p-14 text-center space-y-5 rounded-3xl border border-[#D8AD55]/40 shadow-2xl">
                  {unsoldPlayers.length > 0 ? (
                    <>
                      <div className="w-16 h-16 rounded-2xl bg-[#D8AD55]/15 text-[#D8AD55] flex items-center justify-center mx-auto border border-[#D8AD55]/30 shadow-xl">
                        <Gavel className="w-8 h-8" />
                      </div>
                      <div className="space-y-1">
                        <span className="px-3 py-1 rounded-full bg-[#D8AD55]/15 text-[#F2D69A] text-xs font-bold uppercase tracking-wider border border-[#D8AD55]/30">
                          {isAcceleratedRound ? 'Accelerated Pool' : 'Main Pool Completed'}
                        </span>
                        <h3 className="font-display font-black text-2xl sm:text-4xl text-white pt-2">
                          {unsoldPlayers.length} Unsold Players in Pool
                        </h3>
                        <p className="text-sm text-[#8793A5] max-w-md mx-auto">
                          Launch an <strong>Accelerated Round</strong> with fast 15-second timers and optional 50% base price discount so franchises can complete their squads!
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
                        {isAccessAllowed && (
                          <>
                            <button
                              onClick={() => handleStartAcceleratedRound(false)}
                              className="btn-press shimmer-btn px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] text-[#08111F] font-display font-black text-xs uppercase tracking-wider shadow-xl shadow-[#D8AD55]/20 hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                            >
                              <Zap className="w-4 h-4" />
                              <span>⚡ Start Accelerated Round (Regular Base Price)</span>
                            </button>

                            <button
                              onClick={() => handleStartAcceleratedRound(true)}
                              className="btn-press px-5 py-3.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-display font-black text-xs uppercase tracking-wider border border-purple-500/40 shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                            >
                              <Flame className="w-4 h-4 text-purple-400" />
                              <span>⚡ Accelerated Round (50% Base Price Discount)</span>
                            </button>
                          </>
                        )}
                        <button
                          onClick={handleSyncRegisteredPlayers}
                          className="px-5 py-3 rounded-xl bg-[#08111F] hover:bg-[#111D2D] border border-[#D8AD55]/30 text-[#F2D69A] font-bold text-xs transition-all cursor-pointer"
                        >
                          Sync Registered Players
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
                        <CheckCircle2 className="w-8 h-8" />
                      </div>
                      <h3 className="font-display font-black text-2xl sm:text-3xl text-white">
                        Auction Lot Completed
                      </h3>
                      <p className="text-sm text-[#8793A5] max-w-md mx-auto">
                        All players in the current queue have been processed. All teams and squads are finalized!
                      </p>
                      {isAccessAllowed && (
                        <div className="flex flex-wrap justify-center gap-3 pt-2">
                          <button
                            onClick={handleSyncRegisteredPlayers}
                            className="btn-press shimmer-btn px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] text-[#08111F] font-display font-black text-xs uppercase tracking-wider shadow-lg transition-all"
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
              <div className="bg-[#0D1B2A]/90 backdrop-blur-md rounded-3xl p-6 sm:p-7 space-y-4 border border-[#D8AD55]/30 shadow-2xl">
                <div className="flex items-center justify-between border-b border-[#D8AD55]/15 pb-3">
                  <h3 className="font-display font-black text-xl text-white flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>Completed Purchases ({soldTransactions.length})</span>
                  </h3>
                  <span className="text-xs font-bold text-[#8793A5]">
                    Auto-assigned to Squads
                  </span>
                </div>

                <div className="divide-y divide-white/5 text-sm max-h-80 overflow-y-auto pr-1">
                  {soldTransactions.length === 0 ? (
                    <div className="py-6 text-center text-xs text-[#8793A5]">
                      No players acquired yet. Players hammered as SOLD will appear here.
                    </div>
                  ) : (
                    soldTransactions.map((tx) => (
                      <div key={tx.id} className="py-3 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-white">{tx.player}</span>
                          <span className="text-xs text-[#8793A5] ml-2">({tx.role})</span>
                          <div className="text-xs text-[#D8AD55] font-semibold">{tx.team}</div>
                        </div>
                        <div className="font-display font-black text-lg text-[#F2D69A]">
                          {currencySymbol}{tx.price.toLocaleString('en-IN')}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Live Team Purse & Squad Capacity Tracker */}
            <div className="space-y-6">
              <div className="bg-[#0D1B2A]/90 backdrop-blur-md rounded-3xl p-6 sm:p-7 space-y-5 border border-[#D8AD55]/30 shadow-2xl">
                <div className="flex items-center justify-between border-b border-[#D8AD55]/15 pb-3">
                  <h3 className="font-display font-black text-xl text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#D8AD55]" />
                    <span>Team Purse Tracker</span>
                  </h3>
                  <span className="text-xs font-bold text-[#F2D69A] font-mono">
                    {currencySymbol}{rules.basePurse.toLocaleString('en-IN')} Budget
                  </span>
                </div>

                <div className="space-y-4">
                  {teams.length === 0 ? (
                    <div className="p-5 rounded-2xl bg-[#08111F] border border-dashed border-[#D8AD55]/30 text-center space-y-1">
                      <p className="text-sm font-semibold text-gray-200">No franchise teams registered yet</p>
                      <p className="text-xs text-[#8793A5]">
                        Assign franchise owners in Super Admin or click &apos;Import Sheet&apos; to load teams.
                      </p>
                    </div>
                  ) : (
                    teams.map((t) => {
                      const remaining = t.allocated - t.spent;
                      const percentSpent = (t.spent / t.allocated) * 100;
                      return (
                        <div key={t.id} className="p-4 rounded-2xl bg-[#08111F] border border-white/5 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-bold text-white text-sm">{t.name}</span>
                              {t.owner && (
                                <div className="text-[11px] text-[#D8AD55] font-semibold mt-0.5">
                                  Owner: {t.owner} (Blocked {currencySymbol}{rules.ownerBlockedPrice})
                                </div>
                              )}
                            </div>
                            <span className="text-xs font-bold text-[#8793A5]">
                              {t.playersBought} / {t.maxSquad} Players
                            </span>
                          </div>

                          {/* Purse Bar */}
                          <div className="w-full h-2 rounded-full bg-[#111D2D] overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[#D8AD55] via-[#F2D69A] to-[#D8AD55] transition-all duration-300"
                              style={{ width: `${Math.min(100, percentSpent)}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-xs pt-1">
                            <span className="text-[#8793A5]">
                              Spent: {currencySymbol}{t.spent.toLocaleString('en-IN')}
                            </span>
                            <span className="font-extrabold text-[#F2D69A]">
                              Remaining: {currencySymbol}{remaining.toLocaleString('en-IN')}
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
                <div className="bg-[#0D1B2A]/90 backdrop-blur-md rounded-3xl p-6 space-y-3 border border-[#D8AD55]/20 shadow-xl">
                  <h4 className="font-display font-bold text-lg text-white">
                    Unsold Player Pool ({unsoldPlayers.length})
                  </h4>
                  <p className="text-xs text-[#8793A5]">
                    These players can be reintroduced in subsequent rounds by the tournament organizer.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {unsoldPlayers.map((name) => (
                      <span
                        key={name}
                        className="px-3 py-1 rounded-xl bg-[#08111F] border border-[#D8AD55]/30 text-xs text-[#F2D69A] font-semibold"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="max-w-2xl w-full p-6 sm:p-8 rounded-3xl bg-[#0D1B2A] border border-[#D8AD55]/40 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-[#D8AD55]/15 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#D8AD55]/15 border border-[#D8AD55]/30 text-[#D8AD55] flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-black text-xl text-white">
                    Import Tournament Roster (.xlsx / .csv)
                  </h3>
                  <p className="text-xs text-[#8793A5] mt-0.5">
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
                className="p-2 rounded-xl text-gray-400 hover:text-white bg-[#08111F] hover:bg-[#111D2D] border border-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Rules explanation box */}
            <div className="p-4 rounded-2xl bg-[#08111F] border border-[#D8AD55]/20 text-xs space-y-2 leading-relaxed">
              <div className="font-bold text-white flex items-center gap-1.5">
                <Info className="w-4 h-4 text-[#D8AD55]" />
                <span>Automatic Budget &amp; Owner Retention Rules:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-[#8793A5]">
                <li>Total Base Points per Franchise: <strong className="text-white">{currencySymbol}{rules.basePurse.toLocaleString('en-IN')}</strong></li>
                <li>Franchise Owner Blocked Base Price: <strong className="text-[#F2D69A]">{currencySymbol}{rules.ownerBlockedPrice}</strong> (Retained in team squad)</li>
                <li>Effective Remaining Starting Purse: <strong className="text-[#D8AD55]">{currencySymbol}{(rules.basePurse - rules.ownerBlockedPrice).toLocaleString('en-IN')}</strong></li>
                <li>Player Base Price: <strong className="text-white">{currencySymbol}{rules.defaultPlayerBasePrice}</strong> (Added into live auction queue)</li>
              </ul>
            </div>

            {/* File Upload Drop Area */}
            <div className="border-2 border-dashed border-[#D8AD55]/30 hover:border-[#D8AD55] rounded-2xl p-6 text-center space-y-3 bg-[#08111F]/50 transition-colors">
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
                <UploadCloud className="w-10 h-10 text-[#D8AD55] mx-auto" />
                <div className="text-sm font-bold text-white">
                  {importFile ? importFile.name : 'Click to select tournament .xlsx or .csv workbook'}
                </div>
                <div className="text-xs text-[#8793A5]">
                  Supports multi-sheet or single sheet formats (e.g. DDPL_Tournament_Data.xlsx)
                </div>
              </label>
            </div>

            {/* Error Message */}
            {importError && (
              <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
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
                  <div className="p-3.5 rounded-2xl bg-[#08111F] border border-white/5 space-y-1">
                    <span className="font-bold text-white">Detected Franchises &amp; Owners:</span>
                    <ul className="space-y-1 text-gray-300 pt-1">
                      {parsedPreview.teams.map((t: any) => (
                        <li key={t.id} className="truncate">
                          🏏 <strong className="text-[#D8AD55]">{t.name}</strong> ({t.owner})
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#08111F] border border-white/5 space-y-1">
                    <span className="font-bold text-white">Sample Auction Pool Players:</span>
                    <ul className="space-y-1 text-gray-300 pt-1">
                      {parsedPreview.playerPool.slice(0, 4).map((p: any) => (
                        <li key={p.id} className="truncate">
                          👤 {p.name} <span className="text-[#8793A5]">({p.role} - {currencySymbol}{p.basePrice})</span>
                        </li>
                      ))}
                      {parsedPreview.playerPool.length > 4 && (
                        <li className="text-[#8793A5] italic">
                          + {parsedPreview.playerPool.length - 4} more players queued
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportFile(null);
                  setParsedPreview(null);
                }}
                className="px-4 py-2.5 rounded-xl text-[#8793A5] hover:text-white text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={!parsedPreview || isImporting}
                onClick={handleApplyImport}
                className={`btn-press shimmer-btn px-6 py-2.5 rounded-xl font-display font-black text-xs uppercase tracking-wider shadow-xl transition-all ${
                  parsedPreview && !isImporting
                    ? 'bg-gradient-to-r from-[#D8AD55] via-[#F2D69A] to-[#D8AD55] text-[#08111F] hover:brightness-110 active:scale-95'
                    : 'bg-[#08111F] text-gray-500 border border-white/5 cursor-not-allowed'
                }`}
              >
                {isImporting ? 'Importing Roster...' : 'Load & Reflect in Auction Room'}
              </button>
            </div>
          </div>
        </div>
      )}

            {/* ========================================================================= */}
      {/* RIGHT TO MATCH (RTM) SELECTION MODAL */}
      {/* ========================================================================= */}
      {isRtmModalOpen && currentLot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="max-w-lg w-full p-6 sm:p-8 rounded-3xl bg-[#0D1B2A] border-2 border-purple-500/50 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-purple-500/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-black text-lg text-white">Invoke Right to Match (RTM)</h3>
                  <p className="text-xs text-purple-300">Match highest winning bid to retain player</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRtmModalOpen(false)}
                className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-white/5 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[#08111F] border border-purple-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase font-bold tracking-wider text-purple-400">Target Player</div>
                  <div className="font-display font-black text-lg text-white">{currentLot.name}</div>
                  <div className="text-xs text-gray-400">{currentLot.role}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs uppercase font-bold tracking-wider text-gray-400">Highest Bid</div>
                  <div className="font-display font-black text-xl text-[#10B981]">
                    {currencySymbol}{currentLot.currentBid.toLocaleString('en-IN')}
                  </div>
                  <div className="text-xs text-gray-400">
                    Leader: <span className="text-white font-semibold">{currentLot.leadingTeam}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-300">
                Select Franchise Exercising RTM
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                {teams
                  .filter((t) => t.name !== currentLot.leadingTeam)
                  .map((t) => {
                    const remaining = t.allocated - t.spent;
                    const canAfford = remaining >= currentLot.currentBid;
                    const isSelected = rtmSelectedTeam === t.name;

                    return (
                      <button
                        key={t.name}
                        type="button"
                        disabled={!canAfford}
                        onClick={() => setRtmSelectedTeam(t.name)}
                        className={`p-3 rounded-2xl text-left border transition-all ${
                          isSelected
                            ? 'bg-purple-600/30 border-purple-400 ring-2 ring-purple-400/50'
                            : canAfford
                            ? 'bg-[#08111F] border-white/10 hover:border-purple-400/50'
                            : 'bg-white/5 border-transparent opacity-40 cursor-not-allowed'
                        }`}
                      >
                        <div className="font-bold text-white text-xs truncate">{t.name}</div>
                        <div className="text-[11px] text-gray-400 mt-0.5">
                          Purse: <span className={canAfford ? 'text-green-400 font-semibold' : 'text-red-400'}>{currencySymbol}{remaining.toLocaleString('en-IN')}</span>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsRtmModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-gray-400 hover:text-white text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!rtmSelectedTeam}
                onClick={() => {
                  if (rtmSelectedTeam) {
                    handleInvokeRTM(rtmSelectedTeam);
                  }
                }}
                className={`btn-press px-6 py-2.5 rounded-xl font-display font-black text-xs uppercase tracking-wider shadow-xl transition-all ${
                  rtmSelectedTeam
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:brightness-110 active:scale-95 shadow-purple-500/30'
                    : 'bg-white/10 text-gray-500 cursor-not-allowed'
                }`}
              >
                Match & Claim Player
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
