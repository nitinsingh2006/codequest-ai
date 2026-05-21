import { Server } from "socket.io";
import { createServer } from "http";
import { jwtVerify } from "jose";

const PORT = parseInt(process.env.WS_PORT || "3001");
const AUTH_SECRET = new TextEncoder().encode(process.env.AUTH_SECRET || "change-me");

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: { origin: process.env.AUTH_URL || "http://localhost:3000", credentials: true },
  pingTimeout: 20000,
  pingInterval: 25000,
});

// ─── JWT VERIFICATION ────────────────────────────────────────────────────────

async function verifyToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, AUTH_SECRET);
    return (payload.id as string) || null;
  } catch {
    return null;
  }
}

// ─── MATCHMAKING QUEUE ───────────────────────────────────────────────────────

interface QueuedPlayer {
  socketId: string;
  userId: string;
  eloRating: number;
  joinedAt: number;
}

const matchQueue: QueuedPlayer[] = [];
const activeMatches = new Map<string, { players: string[]; questId: string; startedAt: number }>();

function findMatch(player: QueuedPlayer): QueuedPlayer | null {
  const ELO_RANGE = 200;
  const now = Date.now();

  for (let i = 0; i < matchQueue.length; i++) {
    const candidate = matchQueue[i];
    if (candidate.userId === player.userId) continue;

    const waitBonus = Math.floor((now - candidate.joinedAt) / 1000) * 10;
    const range = ELO_RANGE + waitBonus;

    if (Math.abs(candidate.eloRating - player.eloRating) <= range) {
      matchQueue.splice(i, 1);
      return candidate;
    }
  }
  return null;
}

// ─── CONNECTION AUTH MIDDLEWARE ───────────────────────────────────────────────

io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace("Bearer ", "");
  if (!token) return next(new Error("Authentication required"));

  const userId = await verifyToken(token);
  if (!userId) return next(new Error("Invalid token"));

  socket.data.userId = userId;
  next();
});

// ─── SOCKET HANDLERS ─────────────────────────────────────────────────────────

io.on("connection", (socket) => {
  const userId: string = socket.data.userId;
  socket.join(`user:${userId}`);

  socket.on("queue:join", (data: { eloRating: number }) => {
    // Prevent duplicate queue entries
    const existing = matchQueue.findIndex((p) => p.userId === userId);
    if (existing !== -1) matchQueue.splice(existing, 1);

    const player: QueuedPlayer = {
      socketId: socket.id,
      userId,
      eloRating: data.eloRating,
      joinedAt: Date.now(),
    };

    const opponent = findMatch(player);

    if (opponent) {
      const matchId = `match:${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const questId = "quest-py-loop"; // TODO: random from pool

      activeMatches.set(matchId, { players: [player.userId, opponent.userId], questId, startedAt: Date.now() });

      socket.join(matchId);
      io.sockets.sockets.get(opponent.socketId)?.join(matchId);

      io.to(matchId).emit("match:found", { matchId, questId, players: [player.userId, opponent.userId] });
    } else {
      matchQueue.push(player);
      socket.emit("queue:waiting", { position: matchQueue.length });
    }
  });

  socket.on("queue:leave", () => {
    const idx = matchQueue.findIndex((p) => p.userId === userId);
    if (idx !== -1) matchQueue.splice(idx, 1);
  });

  socket.on("match:submit", (data: { matchId: string; code: string; timeTaken: number }) => {
    const match = activeMatches.get(data.matchId);
    if (!match || !match.players.includes(userId)) return;

    socket.to(data.matchId).emit("match:opponent_submitted", { userId, timeTaken: data.timeTaken });
  });

  socket.on("match:result", (data: { matchId: string; passed: boolean; timeTaken: number }) => {
    const match = activeMatches.get(data.matchId);
    if (!match || !match.players.includes(userId)) return;

    io.to(data.matchId).emit("match:player_result", { userId, passed: data.passed, timeTaken: data.timeTaken });
  });

  socket.on("disconnect", () => {
    const idx = matchQueue.findIndex((p) => p.userId === userId);
    if (idx !== -1) matchQueue.splice(idx, 1);
  });
});

httpServer.listen(PORT, () => {
  console.log(`⚔️  WebSocket server running on port ${PORT}`);
});

export { io };
