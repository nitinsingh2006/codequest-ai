"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

interface MatchData {
  matchId: string;
  questId: string;
  players: string[];
}

export function useMultiplayer(userId: string | undefined) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [inQueue, setInQueue] = useState(false);
  const [match, setMatch] = useState<MatchData | null>(null);
  const [opponentSubmitted, setOpponentSubmitted] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const socket = io(process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3001", {
      withCredentials: true,
    });

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("auth", { userId, eloRating: 1000 });
    });

    socket.on("disconnect", () => setConnected(false));
    socket.on("queue:waiting", () => setInQueue(true));
    socket.on("match:found", (data: MatchData) => {
      setInQueue(false);
      setMatch(data);
    });
    socket.on("match:opponent_submitted", () => setOpponentSubmitted(true));

    socketRef.current = socket;
    return () => { socket.disconnect(); };
  }, [userId]);

  const joinQueue = useCallback((eloRating: number) => {
    socketRef.current?.emit("queue:join", { eloRating });
    setInQueue(true);
  }, []);

  const leaveQueue = useCallback(() => {
    socketRef.current?.emit("queue:leave");
    setInQueue(false);
  }, []);

  const submitResult = useCallback((matchId: string, code: string, passed: boolean, timeTaken: number) => {
    socketRef.current?.emit("match:submit", { matchId, code, timeTaken });
    socketRef.current?.emit("match:result", { matchId, passed, timeTaken });
  }, []);

  return { connected, inQueue, match, opponentSubmitted, joinQueue, leaveQueue, submitResult };
}
