export type DeliveryType = 'AUTO' | 'MANUAL';

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

export type DeliveryResult = AutoDeliveryResult | ManualDeliveryResult;

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
