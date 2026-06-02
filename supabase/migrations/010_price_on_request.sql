-- 010_price_on_request.sql
-- Add an optional "price on request" flag to properties.
-- When TRUE, the public site shows a "contact us for price" label instead of
-- the numeric price. The price itself is still stored (agents see it in the
-- admin); only the public display changes.
--
-- Non-destructive: BOOLEAN NOT NULL DEFAULT FALSE leaves every existing row
-- showing its price as before.

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS price_on_request BOOLEAN NOT NULL DEFAULT FALSE;
