export type KeyStatus = 'AVAILABLE' | 'RESERVED' | 'SOLD' | 'USED' | 'DISABLED';
export type KeyType   = 'STORE' | 'DROP' | 'BOTH';
export type StockHealth = 'OK' | 'LOW' | 'CRITICAL' | 'EMPTY';
export type KeyTransactionType =
  | 'IMPORT' | 'BULK_IMPORT' | 'PURCHASE' | 'DROP_REWARD'
  | 'MANUAL_ASSIGN' | 'DISABLE' | 'MOVE';

export interface GameKeyRecord {
  id: string;
  gameId: string;
  status: KeyStatus;
  type: KeyType;
  reservedFor: string | null;
  soldToUserId: string | null;
  soldToUsername: string | null;
  deliveredAt: string | null;
  createdAt: string;
}

export interface KeyTransaction {
  id: string;
  keyId: string;
  userId: string | null;
  username: string | null;
  adminId: string | null;
  type: KeyTransactionType;
  note: string;
  createdAt: string;
}

export interface GameStockInfo {
  gameId: string;
  title: string;
  cover: string | null;
  stockStore: number;
  stockDrop: number;
  stockBoth: number;
  sold: number;
  disabled: number;
  reserved: number;
  lowStockThreshold: number;
  isActive: boolean;
  health: StockHealth;
  lastDeliveredAt: string | null;
}

export interface KeysAnalytics {
  totalAvailable: number;
  totalSold: number;
  totalDisabled: number;
  totalReserved: number;
  deliveredToday: number;
  deliveredWeek: number;
  lowStockGames: GameStockInfo[];
  criticalGames: GameStockInfo[];
  emptyGames: GameStockInfo[];
  games: GameStockInfo[];
}

export interface ImportResult {
  imported: number;
  duplicates: number;
  invalid: number;
  total: number;
}
