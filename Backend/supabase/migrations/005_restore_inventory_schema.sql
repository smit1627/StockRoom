-- Full recovery for a deleted public inventory schema.
-- Safe after 004: existing profiles and Auth users are preserved.
create extension if not exists pgcrypto;

do $$ begin create type public.user_role as enum ('admin', 'staff'); exception when duplicate_object then null; end $$;
do $$ begin create type public.product_status as enum ('active', 'inactive'); exception when duplicate_object then null; end $$;
do $$ begin create type public.transaction_type as enum ('opening_stock', 'stock_in', 'stock_out', 'adjustment'); exception when duplicate_object then null; end $$;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    name text not null,
    role public.user_role not null default 'staff',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
create table if not exists public.categories (
    id uuid primary key default gen_random_uuid(), name text not null unique,
    description text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.subcategories (
    id uuid primary key default gen_random_uuid(), category_id uuid not null references public.categories(id) on delete restrict,
    name text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(category_id, name)
);
create table if not exists public.products (
    id uuid primary key default gen_random_uuid(), name text not null, sku text unique,
    quantity integer not null default 0 check(quantity >= 0), price numeric(12,2) not null check(price >= 0),
    description text, image_url text, category_id uuid references public.categories(id) on delete restrict,
    subcategory_id uuid references public.subcategories(id) on delete restrict,
    low_stock_threshold integer not null default 0 check(low_stock_threshold >= 0), status public.product_status not null default 'active',
    created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.transactions (
    id uuid primary key default gen_random_uuid(), transaction_number text not null unique, type public.transaction_type not null,
    transaction_date timestamptz not null default now(), remarks text, total_quantity integer not null check(total_quantity > 0),
    total_value numeric(12,2) not null check(total_value >= 0), created_by uuid not null references public.profiles(id),
    created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.transaction_items (
    id uuid primary key default gen_random_uuid(), transaction_id uuid not null references public.transactions(id) on delete restrict,
    product_id uuid not null references public.products(id) on delete restrict, quantity integer not null check(quantity > 0),
    price numeric(12,2) not null check(price >= 0), total numeric(12,2) not null check(total >= 0),
    adjustment_direction smallint check(adjustment_direction in (-1, 1)), created_at timestamptz not null default now()
);
create table if not exists public.company_settings (
    id uuid primary key default gen_random_uuid(), name text not null, logo_url text,
    created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create sequence if not exists public.transaction_number_seq;

create index if not exists products_name_idx on public.products(name);
create index if not exists products_category_idx on public.products(category_id);
create index if not exists products_subcategory_idx on public.products(subcategory_id);
create index if not exists products_status_idx on public.products(status);
create index if not exists transactions_date_idx on public.transactions(transaction_date desc);
create index if not exists transactions_type_idx on public.transactions(type);
create index if not exists transaction_items_product_idx on public.transaction_items(product_id);

drop trigger if exists profiles_updated on public.profiles;
drop trigger if exists categories_updated on public.categories;
drop trigger if exists subcategories_updated on public.subcategories;
drop trigger if exists products_updated on public.products;
drop trigger if exists transactions_updated on public.transactions;
drop trigger if exists company_updated on public.company_settings;
create trigger profiles_updated before update on public.profiles for each row execute function public.set_updated_at();
create trigger categories_updated before update on public.categories for each row execute function public.set_updated_at();
create trigger subcategories_updated before update on public.subcategories for each row execute function public.set_updated_at();
create trigger products_updated before update on public.products for each row execute function public.set_updated_at();
create trigger transactions_updated before update on public.transactions for each row execute function public.set_updated_at();
create trigger company_updated before update on public.company_settings for each row execute function public.set_updated_at();

create or replace function public.create_inventory_transaction(
    p_type public.transaction_type, p_items jsonb, p_remarks text, p_created_by uuid, p_date timestamptz default now()
) returns uuid language plpgsql security definer set search_path = public as $$
declare
    tx uuid := gen_random_uuid(); seq bigint; qty integer; dir smallint; total_qty integer := 0; v_total_value numeric(12,2) := 0;
    item jsonb; product_row products%rowtype;
begin
    if jsonb_array_length(p_items) = 0 then raise exception 'Transaction must include at least one item'; end if;
    select nextval('public.transaction_number_seq') into seq;
    insert into transactions(id, transaction_number, type, transaction_date, remarks, total_quantity, total_value, created_by)
    values(tx, 'TRX-' || lpad(seq::text, 6, '0'), p_type, p_date, p_remarks, 1, 0, p_created_by);
    for item in select * from jsonb_array_elements(p_items) loop
        qty := (item->>'quantity')::integer;
        if qty is null or qty < 1 then raise exception 'Quantity must be positive'; end if;
        select * into product_row from products where id = (item->>'productId')::uuid and status = 'active' for update;
        if not found then raise exception 'Product not found or inactive'; end if;
        dir := case when p_type in ('opening_stock', 'stock_in') then 1 when p_type = 'stock_out' then -1 when (item->>'adjustmentDirection') = '-1' then -1 else 1 end;
        if dir = -1 and product_row.quantity < qty then raise exception 'INSUFFICIENT_STOCK:%:%', product_row.id, product_row.quantity; end if;
        update products set quantity = quantity + (dir * qty) where id = product_row.id;
        insert into transaction_items(transaction_id, product_id, quantity, price, total, adjustment_direction)
        values(tx, product_row.id, qty, product_row.price, product_row.price * qty, case when p_type = 'adjustment' then dir else null end);
        total_qty := total_qty + qty; v_total_value := v_total_value + (product_row.price * qty);
    end loop;
    update transactions set total_quantity = total_qty, total_value = v_total_value where id = tx;
    return tx;
end;
$$;

create or replace function public.create_product_with_opening(
    p_name text, p_sku text, p_price numeric, p_description text, p_image_url text, p_category_id uuid, p_subcategory_id uuid,
    p_low_stock_threshold integer, p_status public.product_status, p_opening_quantity integer, p_created_by uuid
) returns uuid language plpgsql security definer set search_path = public as $$
declare product_id uuid;
begin
    insert into products(name, sku, quantity, price, description, image_url, category_id, subcategory_id, low_stock_threshold, status)
    values(p_name, p_sku, 0, p_price, p_description, p_image_url, p_category_id, p_subcategory_id, p_low_stock_threshold, p_status)
    returning id into product_id;
    if p_opening_quantity > 0 then
        perform create_inventory_transaction('opening_stock', jsonb_build_array(jsonb_build_object('productId', product_id, 'quantity', p_opening_quantity)), 'Opening stock', p_created_by, now());
    end if;
    return product_id;
end;
$$;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values
    ('product-images', 'product-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
    ('company-assets', 'company-assets', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
