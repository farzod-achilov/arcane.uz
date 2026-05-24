import express from 'express';
import { OffersRepository }  from './repositories/offers.repository';
import { PricingService }    from './services/pricing.service';
import { OffersService }     from './services/offers.service';
import { OffersController }  from './controllers/offers.controller';
import { validate }          from './middleware/validate.middleware';
import { errorHandler }      from './middleware/error.middleware';
import {
  CreateOfferDto,
  UpdateOfferDto,
  ListOffersDto,
  CreatePricingRuleDto,
} from './dto/offers.dto';

export function createApp() {
  const app = express();
  app.use(express.json());

  // ─── DI wiring ─────────────────────────────────────────────────────────────
  const repo       = new OffersRepository();
  const pricing    = new PricingService();
  const service    = new OffersService(repo, pricing);
  const controller = new OffersController(service);

  // ─── Health ────────────────────────────────────────────────────────────────
  app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date() }));

  // ─── Offers ────────────────────────────────────────────────────────────────
  app.get(   '/offers',              validate(ListOffersDto,   'query'), controller.list);
  app.get(   '/offers/:id',                                              controller.getById);
  app.post(  '/offers',              validate(CreateOfferDto),           controller.create);
  app.patch( '/offers/:id',          validate(UpdateOfferDto),           controller.update);
  app.delete('/offers/:id',                                              controller.delete);

  // ─── Admin / config ────────────────────────────────────────────────────────
  app.post('/offers/config/global-markup', controller.setGlobalMarkup);
  app.post('/offers/recalculate',          controller.recalculate);

  // Expose a create-rule endpoint for convenience
  app.post('/pricing-rules', async (req, res, next) => {
    const parsed = CreatePricingRuleDto.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, errors: parsed.error.errors });
      return;
    }
    try {
      const rule = await repo.createRule(parsed.data as Parameters<typeof repo.createRule>[0]);
      res.status(201).json({ success: true, data: rule });
    } catch (err) {
      next(err);
    }
  });

  // ─── Error handler (must be last) ──────────────────────────────────────────
  app.use(errorHandler);

  return { app, service };
}
