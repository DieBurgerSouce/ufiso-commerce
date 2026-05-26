export type {
  Cents,
  CurrencyCode,
  LayerAAdapter,
  LayerBAdapter,
  Sku,
  SyncCustomer,
  SyncOrder,
  SyncOrderLine,
  SyncProduct,
  SyncStockSnapshot,
} from "./types.js";

export {
  applyMarkup,
  applySafetyBuffer,
  MARKUP_PCT_DEFAULT,
  MARKUP_PCT_MAX,
  MARKUP_PCT_MIN,
  SAFETY_PCT_DEFAULT,
  syncStockBatch,
} from "./orchestrator.js";

export { MockAdapter, seedMock } from "./adapters/in-memory.js";

export {
  MockXmlRpcClient,
  OdooXmlRpcAdapter,
  type OdooXmlRpcConfig,
  type XmlRpcClient,
} from "./adapters/odoo-xmlrpc.js";
