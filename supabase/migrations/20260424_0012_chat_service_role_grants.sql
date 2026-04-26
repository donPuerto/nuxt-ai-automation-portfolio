grant usage on schema public to service_role;

grant select, insert, update, delete on table public.chats to service_role;
grant select, insert, update, delete on table public.messages to service_role;
grant select, insert, update, delete on table public.saved_prompts to service_role;
