-- Apply after 005 to make the product fields optional and fix the transaction-total ambiguity.
alter table public.products alter column sku drop not null;
alter table public.products alter column category_id drop not null;

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
