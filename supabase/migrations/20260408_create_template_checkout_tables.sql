create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  stripe_price_id text not null unique,
  currency text not null default 'usd',
  unit_amount integer not null check (unit_amount >= 0),
  file_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  stripe_checkout_session_id text not null unique,
  stripe_payment_intent_id text,
  buyer_email text not null,
  status text not null default 'completed',
  currency text not null default 'usd',
  subtotal_amount integer not null check (subtotal_amount >= 0),
  total_amount integer not null check (total_amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  template_id uuid not null references public.templates (id) on delete restrict,
  unit_amount integer not null check (unit_amount >= 0),
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamptz not null default now(),
  constraint order_items_order_template_unique unique (order_id, template_id)
);

create table if not exists public.template_access (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  template_id uuid not null references public.templates (id) on delete restrict,
  buyer_email text not null,
  access_token text not null unique default encode(gen_random_bytes(24), 'hex'),
  granted_at timestamptz not null default now(),
  constraint template_access_order_template_unique unique (order_id, template_id)
);

create index if not exists templates_slug_active_idx
  on public.templates (slug, active);

create index if not exists orders_buyer_email_idx
  on public.orders (lower(buyer_email));

create index if not exists template_access_buyer_email_idx
  on public.template_access (lower(buyer_email));

create trigger set_templates_updated_at
before update on public.templates
for each row
execute function public.set_updated_at();

create trigger set_orders_updated_at
before update on public.orders
for each row
execute function public.set_updated_at();

alter table public.templates enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.template_access enable row level security;

drop policy if exists "templates_select_active" on public.templates;
create policy "templates_select_active"
on public.templates
for select
to anon, authenticated
using (active = true);
