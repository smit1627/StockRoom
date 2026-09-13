-- Admin transaction deletion. Reverses the recorded stock movement before
-- removing the transaction and its line items, all in one database operation.
create or replace function public.delete_inventory_transaction(p_transaction_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    tx public.transactions%rowtype;
    line public.transaction_items%rowtype;
    quantity_delta integer;
begin
    select * into tx from public.transactions where id = p_transaction_id for update;
    if not found then raise exception 'TRANSACTION_NOT_FOUND'; end if;

    for line in select * from public.transaction_items where transaction_id = tx.id loop
        quantity_delta := case
            when tx.type in ('opening_stock', 'stock_in') then -line.quantity
            when tx.type = 'stock_out' then line.quantity
            when line.adjustment_direction = 1 then -line.quantity
            else line.quantity
        end;

        -- Prevent a deletion from creating impossible negative stock after
        -- subsequent transactions have already consumed the original quantity.
        if quantity_delta < 0 and not exists (
            select 1 from public.products where id = line.product_id and quantity >= abs(quantity_delta) for update
        ) then
            raise exception 'INSUFFICIENT_STOCK_TO_DELETE:%', line.product_id;
        end if;

        update public.products set quantity = quantity + quantity_delta where id = line.product_id;
    end loop;

    delete from public.transaction_items where transaction_id = tx.id;
    delete from public.transactions where id = tx.id;
end;
$$;
