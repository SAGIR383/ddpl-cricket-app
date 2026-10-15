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
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { parseAuctionWorkbook, ParsedFranchise, ParsedPlayer } from '@/lib/auctionImport';
import AuctionMascotOverlay, { MascotEventData } from '@/components/auction/AuctionMascotOverlay';

interface PlayerLot {
  id: string;
  name: string;
  role: string;
  basePrice: number;
  currentBid: number;
  leadingTeam: string | null;
  history: { team: string; bid: number }[];
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

const DEFAULT_AUCTION_PLAYER_POOL = [
  { id: 'p1', name: 'Md Sagir Hossain', role: 'All Rounder', basePrice: 500 },
  { id: 'p2', name: 'Arinday Roy', role: 'Bowler', basePrice: 500 },
  { id: 'p3', name: 'Akash Chakraborty', role: 'Batsman', basePrice: 500 },
  { id: 'p4', name: 'Aman Manna', role: 'Bowler', basePrice: 500 },
  { id: 'p5', name: 'Apurba Mukherjee', role: 'All Rounder', basePrice: 500 },
  { id: 'p6', name: 'Chanchal Chakraborty', role: 'Batsman', basePrice: 500 },
  { id: 'p7', name: 'Mritin Ghosh', role: 'Batsman', basePrice: 500 },
  { id: 'p8', name: 'Partha Roy', role: 'Batsman', basePrice: 500 },
  { id: 'p9', name: 'Prantik Bose', role: 'Batsman', basePrice: 500 },
  { id: 'p10', name: 'Samaresh Das', role: 'Bowler', basePrice: 500 },
  { id: 'p11', name: 'Sudipto Chowdhury', role: 'Batsman', basePrice: 500 },
  { id: 'p12', name: 'Wali Haider', role: 'Bowler', basePrice: 500 },
  { id: 'p13', name: 'Zeeshan', role: 'Bowler', basePrice: 500 },
  { id: 'p14', name: 'Saikat Das', role: 'Batsman', basePrice: 500 },
  { id: 'p15', name: 'Ranjit', role: 'Batsman', basePrice: 500 },
];

export default function AuctionPage() {
  const { isOrganizer, isSuperAdmin, role, user } = useAuth();
  const supabase = createClient();
  const channelRef = useRef<any>(null);

  const [activeTournament, setActiveTournament] = useState<'ddpl' | 'game-of-run'>('ddpl');
  const [bidStep, setBidStep] = useState(50);
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

  // Teams & Purse State (Defaults: 10,000 - 500 owner deduction = 9,500 remaining)
  const [teams, setTeams] = useState<TeamBudget[]>([
    { id: 't1', name: 'Teoco Knight Riders', short: 'TKR', owner: 'Gour Singha Roy', allocated: 10000, spent: 500, playersBought: 1, maxSquad: 11 },
    { id: 't2', name: 'Aircom Avengers', short: 'AA', owner: 'Yubaraj Roy', allocated: 10000, spent: 500, playersBought: 1, maxSquad: 11 },
    { id: 't3', name: 'Teoco Blues', short: 'TB', owner: 'Sunam Banerjee', allocated: 10000, spent: 500, playersBought: 1, maxSquad: 11 },
    { id: 't4', name: 'Aircom Superstar', short: 'AS', owner: 'Surojit Das', allocated: 10000, spent: 500, playersBought: 1, maxSquad: 11 },
  ]);

  const [playerPool, setPlayerPool] = useState<ParsedPlayer[]>(DEFAULT_AUCTION_PLAYER_POOL);

  // Current Player on the Block
  const [currentLot, setCurrentLot] = useState<PlayerLot | null>({
    id: DEFAULT_AUCTION_PLAYER_POOL[0].id,
    name: DEFAULT_AUCTION_PLAYER_POOL[0].name,
    role: DEFAULT_AUCTION_PLAYER_POOL[0].role,
    basePrice: DEFAULT_AUCTION_PLAYER_POOL[0].basePrice,
    currentBid: DEFAULT_AUCTION_PLAYER_POOL[0].basePrice,
    leadingTeam: null,
    history: [],
  });

  // Sold Transactions (Franchise Owners initially retained with 500 blocked base price deducted)
  const [soldTransactions, setSoldTransactions] = useState<any[]>([
    { id: 'tx-owner-1', player: 'Gour Singha Roy', team: 'Teoco Knight Riders', price: 500, role: 'All Rounder (Franchise Owner)' },
    { id: 'tx-owner-2', player: 'Yubaraj Roy', team: 'Aircom Avengers', price: 500, role: 'Batsman (Franchise Owner)' },
    { id: 'tx-owner-3', player: 'Sunam Banerjee', team: 'Teoco Blues', price: 500, role: 'Batsman/WK (Franchise Owner)' },
    { id: 'tx-owner-4', player: 'Surojit Das', team: 'Aircom Superstar', price: 500, role: 'Batsman (Franchise Owner)' },
  ]);

  const [unsoldPlayers, setUnsoldPlayers] = useState<string[]>([]);

  // Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [parsedPreview, setParsedPreview] = useState<any>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // 3D Mascot Reaction Overlay State (12 SOLD + 12 UNSOLD Variations)
  const [activeMascotEvent, setActiveMascotEvent] = useState<MascotEventData | null>(null);

  // Toast Helper
  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // 1. Fetch Dynamic Rules and Persistent Auction State on Mount & Tournament Switch
  useEffect(() => {
    async function loadInitialData() {
      try {
        // Load Rules for active tournament
        const rulesRes = await fetch(`/api/admin/rules?tournament=${activeTournament}`);
        const rulesData = await rulesRes.json();
        if (rulesData.success && rulesData.rules) {
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

        // Load Persistent Auction State for current tournament
        const auctionRes = await fetch(`/api/auction/data?tournament=${activeTournament}`);
        const auctionData = await auctionRes.json();
        if (auctionData.success && auctionData.data) {
          const d = auctionData.data;
          if (d.teams && d.teams.length > 0) setTeams(d.teams);
          if (d.playerPool && d.playerPool.length > 0) setPlayerPool(d.playerPool);
          if (d.soldTransactions) setSoldTransactions(d.soldTransactions);
          if (d.unsoldPlayers) setUnsoldPlayers(d.unsoldPlayers);
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
          }
        }
      } catch (err) {
        console.error('Error loading initial auction state:', err);
      }
    }

    loadInitialData();
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

  // Handle Placing a Bid
  function handleBid(team: TeamBudget) {
    if (!currentLot) return;

    const nextBid = currentLot.leadingTeam
      ? currentLot.currentBid + bidStep
      : currentLot.basePrice;

    if (team.allocated - team.spent < nextBid) {
      alert(`Cannot bid: ${team.name} has insufficient remaining budget (₹${team.allocated - team.spent} left)!`);
      return;
    }

    if (team.playersBought >= team.maxSquad) {
      alert(`Cannot bid: ${team.name} has reached maximum squad capacity (${team.maxSquad})!`);
      return;
    }

    const updatedHistory = [
      ...currentLot.history,
      { team: team.name, bid: nextBid },
    ];

    const updatedLot = {
      ...currentLot,
      currentBid: nextBid,
      leadingTeam: team.name,
      history: updatedHistory,
    };

    setCurrentLot(updatedLot);
    broadcastAuctionState({ currentLot: updatedLot });
  }

  // Handle Undo Last Bid
  function handleUndo() {
    if (!currentLot || currentLot.history.length === 0) return;

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
    } else {
      const prev = newHistory[newHistory.length - 1];
      updatedLot = {
        ...currentLot,
        currentBid: prev.bid,
        leadingTeam: prev.team,
        history: newHistory,
      };
    }

    setCurrentLot(updatedLot);
    broadcastAuctionState({ currentLot: updatedLot });
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
      return newLot;
    } else {
      setCurrentLot(null);
      return null;
    }
  }

  // Handle Sold
  function handleSold() {
    if (!currentLot || !currentLot.leadingTeam) {
      alert('Cannot mark sold without any leading bid! If no bids, mark as Unsold.');
      return;
    }

    const soldPlayer = currentLot.name;
    const winningTeamName = currentLot.leadingTeam;
    const finalPrice = currentLot.currentBid;
    const playerRole = currentLot.role;

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
    const nextLot = advanceToNextPlayer(newSold, unsoldPlayers);

    // Trigger 3D Live Auction Mascot Celebration Overlay (12 SOLD Reactions)
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

    broadcastAuctionState({
      currentLot: nextLot,
      soldTransactions: newSold,
      teams: updatedTeams,
      mascotEvent: soldEvent,
    });

    showToast(`🔨 Sold! ${soldPlayer} acquired by ${winningTeamName} for ₹${finalPrice}!`);
  }

  // Handle Unsold
  function handleUnsold() {
    if (!currentLot) return;
    const passedPlayer = currentLot.name;
    const playerRole = currentLot.role;

    const newUnsold = [...unsoldPlayers, passedPlayer];
    setUnsoldPlayers(newUnsold);
    const nextLot = advanceToNextPlayer(soldTransactions, newUnsold);

    // Trigger 3D Live Auction Mascot Disappointment Overlay (12 UNSOLD Reactions)
    const unsoldEvent: MascotEventData = {
      id: `unsold-${Date.now()}-${passedPlayer}`,
      type: 'unsold',
      player: passedPlayer,
      role: playerRole,
      timestamp: Date.now(),
    };

    setActiveMascotEvent(unsoldEvent);

    broadcastAuctionState({
      currentLot: nextLot,
      unsoldPlayers: newUnsold,
      mascotEvent: unsoldEvent,
    });

    showToast(`Passed: ${passedPlayer} moved to Unsold pool.`);
  }

  // Handle File Change in Import Modal
  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setImportError(null);

    try {
      const buffer = await file.arrayBuffer();
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
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-cricket-dark/95 border border-cricket-teal/50 text-white font-bold text-sm shadow-2xl flex items-center gap-3 backdrop-blur-md animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-cricket-teal shrink-0" />
          <span>{notification}</span>
        </div>
      )}

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
          <div className="flex rounded-xl bg-cricket-dark border border-cricket-border p-1 text-xs font-bold">
            <button
              onClick={() => setActiveTournament('ddpl')}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeTournament === 'ddpl'
                  ? 'bg-cricket-card text-cricket-teal border border-cricket-teal/30 shadow'
                  : 'text-cricket-muted hover:text-white'
              }`}
            >
              DDPL 2026
            </button>
            <button
              onClick={() => setActiveTournament('game-of-run')}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeTournament === 'game-of-run'
                  ? 'bg-cricket-card text-cricket-teal border border-cricket-teal/30 shadow'
                  : 'text-cricket-muted hover:text-white'
              }`}
            >
              Game of RUN
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ACCESS GUARD WRAPPER */}
      {/* If unauthorized, the content below is blurred and overlaid with shield */}
      {/* ========================================================================= */}
      <div className="relative">
        {!isAccessAllowed && (
          <div className="absolute inset-0 z-30 flex items-center justify-center p-4">
            <div className="max-w-xl w-full p-8 rounded-3xl bg-cricket-dark/95 border-2 border-amber-500/40 shadow-2xl backdrop-blur-2xl text-center space-y-6 animate-fade-in">
              <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-2xl">
                <ShieldAlert className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <span className="inline-block px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-extrabold uppercase tracking-wider border border-amber-500/30">
                  Access Restricted • Organizer Only
                </span>
                <h2 className="font-display font-black text-2xl sm:text-3xl text-white">
                  Auction Room Restricted to Appointed Organizers
                </h2>
                <p className="text-sm text-gray-300 leading-relaxed max-w-md mx-auto">
                  {!user ? (
                    <>
                      The Live Auction Room, real-time purse ledger, and squad export are strictly reserved for appointed <strong className="text-white">Tournament Organizers</strong> and <strong className="text-amber-400">Super Admins</strong>.
                    </>
                  ) : (
                    <>
                      You are signed in as <span className="font-mono text-xs px-2 py-0.5 rounded bg-cricket-card text-rose-300 font-bold">{user.email}</span> with role <span className="text-amber-400 font-bold uppercase">{role}</span>. Spectators and Scorers cannot participate in or view live bidding operations.
                    </>
                  )}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                {!user ? (
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                      href="/admin/login"
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-cricket-dark font-display font-extrabold text-sm shadow-xl hover:brightness-110 transition-all flex items-center justify-center gap-2"
                    >
                      <span>👑 Super Admin Portal Login</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                      href="/auth/login"
                      className="px-6 py-3 rounded-xl bg-cricket-card hover:bg-cricket-cardHover border border-cricket-border text-white font-bold text-sm transition-all flex items-center justify-center"
                    >
                      Organizer Sign In
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-gray-400">
                      Need auctioneer clearance? Contact the Super Admin to elevate your role to <strong className="text-cricket-teal">Organizer</strong>.
                    </p>
                    <div className="flex flex-wrap gap-3 justify-center">
                      <Link
                        href="/matches"
                        className="px-5 py-2.5 rounded-xl bg-cricket-teal/20 hover:bg-cricket-teal/30 text-cricket-teal border border-cricket-teal/40 font-bold text-xs transition-all"
                      >
                        View Matches &amp; Fixtures
                      </Link>
                      <Link
                        href="/teams"
                        className="px-5 py-2.5 rounded-xl bg-cricket-card hover:bg-cricket-cardHover border border-cricket-border text-white font-bold text-xs transition-all"
                      >
                        View Franchises &amp; Squads
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* The Auction Console (Blurred when access is restricted) */}
        <div className={`transition-all duration-300 ${!isAccessAllowed ? 'filter blur-xl pointer-events-none select-none opacity-25' : ''}`}>
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
                  <div className="p-6 sm:p-8 bg-gradient-to-r from-blue-950 via-cricket-card to-cricket-dark border-b border-cricket-border text-center space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold uppercase animate-pulse">
                      <Sparkles className="w-3.5 h-3.5" />
                      Currently on the Block
                    </div>

                    <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-tr from-blue-600 to-cricket-teal p-1 shadow-xl">
                      <div className="w-full h-full bg-cricket-card rounded-full flex items-center justify-center font-display font-black text-3xl text-cricket-teal">
                        {currentLot.name.charAt(0)}
                      </div>
                    </div>

                    <h2 className="font-display font-black text-3xl sm:text-4xl text-white">
                      {currentLot.name}
                    </h2>
                    <div className="text-sm font-semibold text-cricket-muted">{currentLot.role}</div>

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
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-cricket-muted uppercase">
                        Select Bid Increment
                      </span>
                      <div className="flex gap-2">
                        {rules.bidSteps.map((step) => (
                          <button
                            key={step}
                            onClick={() => setBidStep(step)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                              bidStep === step
                                ? 'bg-cricket-teal text-cricket-dark border-cricket-teal font-extrabold shadow'
                                : 'bg-cricket-dark border-cricket-border text-gray-300 hover:text-white'
                            }`}
                          >
                            +₹{step}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Team Bidding Buttons Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {teams.map((t) => {
                        const remaining = t.allocated - t.spent;
                        const nextBid = currentLot.leadingTeam
                          ? currentLot.currentBid + bidStep
                          : currentLot.basePrice;
                        const canBid =
                          remaining >= nextBid &&
                          t.playersBought < t.maxSquad &&
                          t.name !== currentLot.leadingTeam;

                        return (
                          <button
                            key={t.id}
                            disabled={!canBid}
                            onClick={() => handleBid(t)}
                            className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden ${
                              currentLot.leadingTeam === t.name
                                ? 'bg-cricket-teal/20 border-cricket-teal text-white shadow-lg shadow-cricket-teal/10'
                                : canBid
                                ? 'bg-cricket-dark/80 hover:bg-cricket-card border-cricket-border hover:border-cricket-teal/50 text-white'
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
                                {currentLot.leadingTeam === t.name ? 'Leading Bidder' : 'Bid Now:'}
                              </span>
                              <span className="font-display font-extrabold text-sm text-cricket-gold">
                                {currentLot.leadingTeam === t.name
                                  ? `₹${currentLot.currentBid}`
                                  : `₹${nextBid}`}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Hammer Controls: Undo, Sold, Unsold */}
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
                          className="px-5 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-bold text-xs border border-rose-500/30 transition-all active:scale-95"
                        >
                          Pass as Unsold
                        </button>

                        <button
                          onClick={handleSold}
                          disabled={!currentLot.leadingTeam}
                          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-display font-black text-sm tracking-wide shadow-xl transition-all active:scale-95 ${
                            currentLot.leadingTeam
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-cricket-dark hover:brightness-110 shadow-emerald-500/20'
                              : 'bg-cricket-card text-gray-500 border border-cricket-border cursor-not-allowed'
                          }`}
                        >
                          <Gavel className="w-4 h-4" />
                          <span>HAMMER: SOLD!</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="glass-card p-12 text-center space-y-4 border border-cricket-border">
                  <div className="w-16 h-16 rounded-2xl bg-cricket-teal/10 text-cricket-teal flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="font-display font-black text-2xl text-white">
                    Auction Lot Completed
                  </h3>
                  <p className="text-sm text-cricket-muted max-w-md mx-auto">
                    All players in the current queue have been processed. You can import new rosters or review squads.
                  </p>
                  <button
                    onClick={() => {
                      if (playerPool.length > 0) {
                        const p0 = playerPool[0];
                        setCurrentLot({
                          id: p0.id,
                          name: p0.name,
                          role: p0.role,
                          basePrice: p0.basePrice,
                          currentBid: p0.basePrice,
                          leadingTeam: null,
                          history: [],
                        });
                      }
                    }}
                    className="px-6 py-2.5 rounded-xl bg-cricket-teal text-cricket-dark font-display font-extrabold text-sm shadow transition-all active:scale-95"
                  >
                    Restart Queue with Player Pool
                  </button>
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
                  {soldTransactions.map((tx) => (
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
                  ))}
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
                  {teams.map((t) => {
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
                  })}
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
      <AuctionMascotOverlay
        event={activeMascotEvent}
        onDismiss={() => setActiveMascotEvent(null)}
      />
    </div>
  );
}
