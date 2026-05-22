import type {
  GameStockInfo, GameKeyRecord, KeyTransaction, KeysAnalytics,
} from './adminKeysTypes';

function health(store: number, drop: number, threshold: number): GameStockInfo['health'] {
  const total = store + drop;
  if (total === 0)                              return 'EMPTY';
  if (total <= Math.floor(threshold * 0.5))    return 'CRITICAL';
  if (total <= threshold)                       return 'LOW';
  return 'OK';
}

export const MOCK_GAME_STOCK: GameStockInfo[] = [
  {
    gameId: 'game-001', title: 'Cyberpunk 2077', cover: 'https://picsum.photos/seed/cyber/300/400',
    stockStore: 14, stockDrop: 8, stockBoth: 5, sold: 112, disabled: 3, reserved: 2,
    lowStockThreshold: 10, isActive: true, lastDeliveredAt: '2025-05-22T10:15:00Z',
    health: health(14, 8, 10),
  },
  {
    gameId: 'game-002', title: 'Elden Ring', cover: 'https://picsum.photos/seed/elden/300/400',
    stockStore: 3, stockDrop: 2, stockBoth: 0, sold: 87, disabled: 1, reserved: 0,
    lowStockThreshold: 10, isActive: true, lastDeliveredAt: '2025-05-22T09:45:00Z',
    health: health(3, 2, 10),
  },
  {
    gameId: 'game-003', title: 'God of War: Ragnarök', cover: 'https://picsum.photos/seed/gow/300/400',
    stockStore: 0, stockDrop: 0, stockBoth: 0, sold: 201, disabled: 4, reserved: 0,
    lowStockThreshold: 5, isActive: false, lastDeliveredAt: '2025-05-20T18:30:00Z',
    health: health(0, 0, 5),
  },
  {
    gameId: 'game-004', title: 'Baldur\'s Gate 3', cover: 'https://picsum.photos/seed/bg3/300/400',
    stockStore: 32, stockDrop: 19, stockBoth: 12, sold: 156, disabled: 0, reserved: 3,
    lowStockThreshold: 10, isActive: true, lastDeliveredAt: '2025-05-22T11:00:00Z',
    health: health(32, 19, 10),
  },
  {
    gameId: 'game-005', title: 'Hogwarts Legacy', cover: 'https://picsum.photos/seed/hog/300/400',
    stockStore: 4, stockDrop: 0, stockBoth: 1, sold: 94, disabled: 2, reserved: 1,
    lowStockThreshold: 10, isActive: true, lastDeliveredAt: '2025-05-21T22:10:00Z',
    health: health(4, 0, 10),
  },
  {
    gameId: 'game-006', title: 'Starfield', cover: 'https://picsum.photos/seed/star/300/400',
    stockStore: 67, stockDrop: 41, stockBoth: 20, sold: 313, disabled: 5, reserved: 4,
    lowStockThreshold: 10, isActive: true, lastDeliveredAt: '2025-05-22T11:30:00Z',
    health: health(67, 41, 10),
  },
];

export const MOCK_KEY_RECORDS: GameKeyRecord[] = [
  { id: 'key-001', gameId: 'game-001', status: 'AVAILABLE',  type: 'STORE', reservedFor: null, soldToUserId: null, soldToUsername: null, deliveredAt: null, createdAt: '2025-05-20T10:00:00Z' },
  { id: 'key-002', gameId: 'game-001', status: 'AVAILABLE',  type: 'DROP',  reservedFor: null, soldToUserId: null, soldToUsername: null, deliveredAt: null, createdAt: '2025-05-20T10:00:00Z' },
  { id: 'key-003', gameId: 'game-001', status: 'SOLD',       type: 'STORE', reservedFor: null, soldToUserId: 'u-1', soldToUsername: 'Phantom_Gamer', deliveredAt: '2025-05-21T14:22:00Z', createdAt: '2025-05-18T08:00:00Z' },
  { id: 'key-004', gameId: 'game-001', status: 'SOLD',       type: 'DROP',  reservedFor: null, soldToUserId: 'u-2', soldToUsername: 'CyberRaider',   deliveredAt: '2025-05-22T09:10:00Z', createdAt: '2025-05-18T08:00:00Z' },
  { id: 'key-005', gameId: 'game-001', status: 'RESERVED',   type: 'BOTH',  reservedFor: 'u-3', soldToUserId: null, soldToUsername: null, deliveredAt: null, createdAt: '2025-05-19T12:00:00Z' },
  { id: 'key-006', gameId: 'game-001', status: 'DISABLED',   type: 'STORE', reservedFor: null, soldToUserId: null, soldToUsername: null, deliveredAt: null, createdAt: '2025-05-17T07:00:00Z' },
  { id: 'key-007', gameId: 'game-001', status: 'AVAILABLE',  type: 'BOTH',  reservedFor: null, soldToUserId: null, soldToUsername: null, deliveredAt: null, createdAt: '2025-05-21T16:00:00Z' },
  { id: 'key-008', gameId: 'game-001', status: 'AVAILABLE',  type: 'STORE', reservedFor: null, soldToUserId: null, soldToUsername: null, deliveredAt: null, createdAt: '2025-05-21T16:00:00Z' },
];

export const MOCK_KEY_TRANSACTIONS: KeyTransaction[] = [
  { id: 'tx-001', keyId: 'key-003', userId: 'u-1', username: 'Phantom_Gamer', adminId: null, type: 'PURCHASE',    note: 'Store purchase delivery',    createdAt: '2025-05-21T14:22:00Z' },
  { id: 'tx-002', keyId: 'key-004', userId: 'u-2', username: 'CyberRaider',   adminId: null, type: 'DROP_REWARD', note: 'Drop reward delivery',       createdAt: '2025-05-22T09:10:00Z' },
  { id: 'tx-003', keyId: 'key-001', userId: null,  username: null,             adminId: 'admin', type: 'IMPORT',  note: 'Single key added by admin',  createdAt: '2025-05-20T10:00:00Z' },
  { id: 'tx-004', keyId: 'key-005', userId: null,  username: null,             adminId: 'admin', type: 'BULK_IMPORT', note: 'Bulk import of 20 keys', createdAt: '2025-05-19T12:00:00Z' },
  { id: 'tx-005', keyId: 'key-006', userId: null,  username: null,             adminId: 'admin', type: 'DISABLE', note: 'Invalid key format',         createdAt: '2025-05-17T07:00:00Z' },
];

export const MOCK_ANALYTICS: KeysAnalytics = {
  totalAvailable: 180,
  totalSold: 963,
  totalDisabled: 15,
  totalReserved: 10,
  deliveredToday: 24,
  deliveredWeek: 138,
  lowStockGames:  MOCK_GAME_STOCK.filter(g => g.health === 'LOW'),
  criticalGames:  MOCK_GAME_STOCK.filter(g => g.health === 'CRITICAL'),
  emptyGames:     MOCK_GAME_STOCK.filter(g => g.health === 'EMPTY'),
  games: MOCK_GAME_STOCK,
};
