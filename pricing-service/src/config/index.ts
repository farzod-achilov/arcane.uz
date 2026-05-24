export const config = {
  port:    parseInt(process.env.PORT ?? '4000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',

  pricing: {
    // Applied on top of per-offer markup when no override is given
    defaultGlobalMarkupPercent: parseFloat(
      process.env.DEFAULT_GLOBAL_MARKUP_PERCENT ?? '0'
    ),
    // Offers below this USD threshold use "fixed" rule, above → "percent"
    cheapGameThresholdUsd: parseFloat(
      process.env.CHEAP_GAME_THRESHOLD_USD ?? '20'
    ),
  },
} as const;
