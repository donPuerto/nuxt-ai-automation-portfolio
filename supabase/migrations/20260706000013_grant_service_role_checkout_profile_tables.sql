-- Grant service_role table privileges on the checkout/profile tables that were
-- never granted (they predate 20260424000012_chat_service_role_grants.sql).
-- Without these, the admin (service) client hits "42501 permission denied":
--   - templates            -> checkout session creation
--   - orders, order_items,
--     template_access       -> Stripe fulfillment + order access links
-- profiles/user_settings are read via the anon+user client, but are granted
-- here too for consistency with the "anon, authenticated, service_role" rule.

grant usage on schema public to service_role;

grant select, insert, update, delete on table public.profiles to service_role;
grant select, insert, update, delete on table public.user_settings to service_role;
grant select, insert, update, delete on table public.orders to service_role;
grant select, insert, update, delete on table public.order_items to service_role;
grant select, insert, update, delete on table public.templates to service_role;
grant select, insert, update, delete on table public.template_access to service_role;

-- Cover any identity/serial sequences used by the above tables.
grant usage, select on all sequences in schema public to service_role;
