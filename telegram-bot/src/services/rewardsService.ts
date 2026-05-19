import type { TelegramUser } from '../types/index';
import { updateUser } from './db';

const DAY_REWARDS  = [50, 75, 100, 125, 150, 175, 300];
const RESET_HOURS  = 24;

export interface ClaimResult {
  success: boolean;
  amount:  number;
  streak:  number;
  reason?: string;
}

export class RewardsService {
  canClaim(user: TelegramUser): boolean {
    if (!user.lastRewardClaim) return true;
    const hoursSince = (Date.now() - user.lastRewardClaim.getTime()) / (1000 * 60 * 60);
    return hoursSince >= RESET_HOURS;
  }

  isStreakBroken(user: TelegramUser): boolean {
    if (!user.lastRewardClaim) return false;
    const hoursSince = (Date.now() - user.lastRewardClaim.getTime()) / (1000 * 60 * 60);
    return hoursSince >= RESET_HOURS * 2; // missed 2 full days = streak reset
  }

  claim(user: TelegramUser): ClaimResult {
    if (!this.canClaim(user)) {
      return { success: false, amount: 0, streak: user.rewardStreak, reason: 'already_claimed' };
    }

    const streakReset = this.isStreakBroken(user);
    const newStreak = streakReset ? 1 : user.rewardStreak + 1;
    const dayIdx    = (newStreak - 1) % 7;
    const amount    = DAY_REWARDS[dayIdx];

    updateUser(user.telegramId, {
      rewardStreak:     newStreak,
      lastRewardClaim:  new Date(),
      totalCoinsEarned: user.totalCoinsEarned + amount,
    });

    return { success: true, amount, streak: newStreak };
  }
}

export const rewardsService = new RewardsService();
