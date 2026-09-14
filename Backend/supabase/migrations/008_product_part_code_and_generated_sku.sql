-- Product identity foundation: Part Codes are business identifiers (not unique),
-- while SKUs are created only by the database-backed product sequence.
alter table public.products add column if not exists part_code text;

create or replace function public.normalize_part_code()
returns trigger language plpgsql as $$
begin
    new.part_code := nullif(upper(btrim(new.part_code)), '');
    return new;
end;
$$;

drop trigger if exists products_normalize_part_code on public.products;
create trigger products_normalize_part_code
before insert or update of part_code on public.products
for each row execute function public.normalize_part_code();

-- Normalize any values written before the trigger was introduced.
update public.products
set part_code = nullif(upper(btrim(part_code)), '')
where part_code is not null;

create index if not exists products_part_code_idx on public.products(part_code);
create sequence if not exists public.product_sku_seq;

-- The previous RPC accepted a caller-supplied SKU. Drop that signature before
-- recreating it with the same argument types and a Part Code in its place.
drop function if exists public.create_product_with_opening(
    text, text, numeric, text, text, uuid, uuid, integer,
    public.product_status, integer, uuid
);

create or replace function public.company_sku_prefix()
returns text language plpgsql stable security definer set search_path = public as $$
declare
    company_name text;
    compact_name text;
begin
    select name into company_name
    from public.company_settings
    order by created_at asc
    limit 1;

    compact_name := upper(regexp_replace(coalesce(company_name, 'VEER'), '[^A-Za-z0-9]', '', 'g'));
    return coalesce(nullif(left(compact_name, 4), ''), 'VEER');
end;
$$;

create or replace function public.create_product_with_opening(
    p_name text,
    p_part_code text,
    p_price numeric,
    p_description text,
    p_image_url text,
    p_category_id uuid,
    p_subcategory_id uuid,
    p_low_stock_threshold integer,
    p_status public.product_status,
    p_opening_quantity integer,
    p_created_by uuid
) returns uuid language plpgsql security definer set search_path = public as $$
declare
    product_id uuid;
    generated_sku text;
    sku_sequence bigint;
begin
    if nullif(btrim(p_name), '') is null then
        raise exception 'Product name is required';
    end if;
    if p_price is null or p_price < 0 then
        raise exception 'Product price must be zero or greater';
    end if;
    if coalesce(p_opening_quantity, 0) < 0 then
        raise exception 'Opening quantity must be zero or greater';
    end if;

    -- The sequence never reuses a value, including after a product is deleted.
    -- The loop also safely skips a matching legacy SKU if one exists.
    loop
        sku_sequence := nextval('public.product_sku_seq');
        generated_sku := public.company_sku_prefix() || '-' || to_char(current_date, 'YYMMDD') || '-' || lpad(sku_sequence::text, 4, '0');
        exit when not exists (select 1 from public.products where sku = generated_sku);
    end loop;

    insert into public.products(
        name, part_code, sku, quantity, price, description, image_url,
        category_id, subcategory_id, low_stock_threshold, status
    ) values (
        btrim(p_name), nullif(upper(btrim(p_part_code)), ''), generated_sku, 0,
        p_price, nullif(btrim(p_description), ''), p_image_url, p_category_id,
        p_subcategory_id, coalesce(p_low_stock_threshold, 0), coalesce(p_status, 'active')
    ) returning id into product_id;

    if coalesce(p_opening_quantity, 0) > 0 then
        perform public.create_inventory_transaction(
            'opening_stock',
            jsonb_build_array(jsonb_build_object('productId', product_id, 'quantity', p_opening_quantity)),
            'Opening stock', p_created_by, now()
        );
    end if;

    return product_id;
end;
$$;
