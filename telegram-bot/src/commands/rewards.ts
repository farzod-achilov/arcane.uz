import type { Telegraf } from 'telegraf';
import type { ArcaneContext } from '../types/index';
import { requireLinked } from '../middleware/auth';
import { rewardsService } from '../services/rewardsService';
import * as tpl from '../templates/messages';
import { rewardMenu, backMenu } from '../utils/keyboard';

export function registerRewardsCommand(bot: Telegraf<ArcaneContext>): void {
  const showRewards = async (ctx: ArcaneContext) => {
    const user      = ctx.tgUser!;
    const canClaim  = rewardsService.canClaim(user);
    await ctx.replyWithHTML(
      tpl.tplRewards(user.rewardStreak, canClaim, user.lastRewardClaim),
      rewardMenu(canClaim),
    );
  };

  bot.command('rewards', requireLinked, showRewards);
  bot.action('cmd_rewards', requireLinked, async (ctx) => {
    await ctx.answerCbQuery();
    await showRewards(ctx);
  });

  // Claim reward
  bot.action('claim_reward', requireLinked, async (ctx) => {
    await ctx.answerCbQuery('🎁 Забираем награду...');
    const user   = ctx.tgUser!;
    const result = rewardsService.claim(user);

    if (!result.success) {
      await ctx.replyWithHTML('⏳ Ты уже получил награду сегодня. Возвращайся завтра!', backMenu());
      return;
    }

    // Refresh local tgUser reference
    ctx.tgUser = { ...user, rewardStreak: result.streak, lastRewardClaim: new Date() };
    await ctx.replyWithHTML(tpl.tplRewardClaimed(result.amount, result.streak), backMenu());
  });

  bot.action('reward_wait', async (ctx) => {
    await ctx.answerCbQuery('⏳ Награда уже получена сегодня', { show_alert: true });
  });
}
