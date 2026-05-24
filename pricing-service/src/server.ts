import { createApp }             from './app';
import { startUpdatePricesJob }  from './jobs/updatePrices.job';
import { config }                from './config';

const { app, service } = createApp();

app.listen(config.port, () => {
  console.log(`[pricing-service] listening on http://localhost:${config.port}`);
  startUpdatePricesJob(service);
});
