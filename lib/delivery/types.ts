export type DeliveryType = 'AUTO' | 'MANUAL' | 'DROPSHIP';

export type OrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'WAITING_MANUAL'
  | 'COMPLETED'
  | 'CANCELLED';

export interface DeliveryContext {
  orderId:    string;
  userId:     string;
  userEmail:  string;
  username:   string;
  totalPrice: number;
  items: Array<{
    id:           string;
    gameId:       string;
    gameTitle:    string;
    gameCover:    string | null;
    deliveryType: DeliveryType;
    price:        number;
    // Only meaningful for DROPSHIP items — which external supplier/SKU to
    // buy from at order time. Sourced from games.dropshipSource/
    // dropshipExternalId — deliberately separate from games.source/
    // externalId, which identify metadata origin (rawg/igdb/steam) and
    // may point at a completely different source than the dropship
    // supplier for the same game.
    source:       string | null;
    externalId:   string | null;
  }>;
}

export interface AutoDeliveryResult {
  type:      'AUTO';
  delivered: number;
  waiting:   number;
  keys:      Array<{ itemId: string; gameTitle: string; keyValue: string }>;
}

export interface ManualDeliveryResult {
  type:    'MANUAL';
  status:  'WAITING_MANUAL';
  orderId: string;
}

export interface DropshipDeliveryResult {
  type:      'DROPSHIP';
  delivered: number;
  waiting:   number;
  keys:      Array<{ itemId: string; gameTitle: string; keyValue: string }>;
}

export type DeliveryResult = AutoDeliveryResult | ManualDeliveryResult | DropshipDeliveryResult;

export interface ManualCompleteInput {
  orderId:     string;
  actorId:     string;
  actorName:   string;
  deliveryNote?: string;
  keyValue?:   string;
}

export class DeliveryError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number = 400,
  ) {
    super(message);
    this.name = 'DeliveryError';
  }
}
