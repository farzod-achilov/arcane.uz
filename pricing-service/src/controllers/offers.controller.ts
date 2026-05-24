import { Request, Response, NextFunction } from 'express';
import { OffersService }  from '../services/offers.service';
import { CreateOfferDto, UpdateOfferDto, ListOffersDto } from '../dto/offers.dto';

export class OffersController {
  constructor(private readonly service: OffersService) {}

  // GET /offers
  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters = req.query as unknown as ListOffersDto;
      const result  = await this.service.list(filters);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  };

  // GET /offers/:id
  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const offer = await this.service.getById(req.params.id);
      res.json({ success: true, data: offer });
    } catch (err) {
      next(err);
    }
  };

  // POST /offers
  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const offer = await this.service.create(req.body as CreateOfferDto);
      res.status(201).json({ success: true, data: offer });
    } catch (err) {
      next(err);
    }
  };

  // PATCH /offers/:id
  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const offer = await this.service.update(req.params.id, req.body as UpdateOfferDto);
      res.json({ success: true, data: offer });
    } catch (err) {
      next(err);
    }
  };

  // DELETE /offers/:id
  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.service.delete(req.params.id);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  // POST /offers/config/global-markup
  setGlobalMarkup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { percent } = req.body as { percent: number };
      if (typeof percent !== 'number' || percent < 0) {
        res.status(400).json({ success: false, error: 'percent must be a non-negative number' });
        return;
      }
      await this.service.setGlobalMarkup(percent);
      res.json({ success: true, data: { globalMarkupPercent: percent } });
    } catch (err) {
      next(err);
    }
  };

  // POST /offers/recalculate
  recalculate = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.service.recalculateAll();
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };
}
