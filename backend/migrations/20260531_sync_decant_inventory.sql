-- Sync existing decant inventory data to match current products and batches.
-- Run after 20260530_decant_products.sql.

SET NOCOUNT ON;
GO

-- Re-seed product_inventory from current products so admin decant UI reflects bottle counts.
MERGE dbo.product_inventory AS target
USING (
    SELECT
        p.id AS product_id,
        ISNULL(p.stock, 0) AS sealed_bottles,
        ISNULL(pi.opened_ml, 0) AS opened_ml,
        CASE
            WHEN ISNULL(pi.bottle_volume_ml, 0) > 0 THEN pi.bottle_volume_ml
            WHEN ISNULL(p.volume_ml, 0) > 0 THEN p.volume_ml
            ELSE 100
        END AS bottle_volume_ml
    FROM dbo.products p
    LEFT JOIN dbo.product_inventory pi ON pi.product_id = p.id
    WHERE p.deleted_at IS NULL
) AS source
ON target.product_id = source.product_id
WHEN MATCHED THEN
    UPDATE SET
        sealed_bottles = CASE
            WHEN source.sealed_bottles >= 0 THEN source.sealed_bottles
            ELSE 0
        END,
        opened_ml = CASE
            WHEN source.opened_ml >= 0 THEN source.opened_ml
            ELSE 0
        END,
        bottle_volume_ml = CASE
            WHEN source.bottle_volume_ml > 0 THEN source.bottle_volume_ml
            ELSE 100
        END,
        updated_at = SYSUTCDATETIME()
WHEN NOT MATCHED THEN
    INSERT (product_id, sealed_bottles, opened_ml, bottle_volume_ml)
    VALUES (source.product_id, source.sealed_bottles, source.opened_ml, source.bottle_volume_ml);
GO

-- Align opened ml from active batches where remaining volume exists.
;WITH batch_totals AS (
    SELECT
        pb.product_id,
        COUNT(*) AS active_batch_count,
        SUM(ISNULL(pb.total_volume_ml, 0)) AS total_volume_ml,
        SUM(ISNULL(pb.remaining_volume_ml, 0)) AS remaining_volume_ml
    FROM dbo.product_batches pb
    WHERE pb.status = N'ACTIVE'
    GROUP BY pb.product_id
)
UPDATE pi
SET
    pi.sealed_bottles = CASE
        WHEN bt.active_batch_count IS NOT NULL AND bt.active_batch_count > 0 THEN bt.active_batch_count
        ELSE pi.sealed_bottles
    END,
    pi.opened_ml = CASE
        WHEN bt.remaining_volume_ml IS NOT NULL THEN bt.remaining_volume_ml
        ELSE pi.opened_ml
    END,
    pi.bottle_volume_ml = CASE
        WHEN bt.total_volume_ml IS NOT NULL AND bt.active_batch_count > 0 THEN CASE WHEN bt.total_volume_ml / NULLIF(bt.active_batch_count, 0) > 0 THEN bt.total_volume_ml / bt.active_batch_count ELSE pi.bottle_volume_ml END
        ELSE pi.bottle_volume_ml
    END,
    pi.updated_at = SYSUTCDATETIME()
FROM dbo.product_inventory pi
INNER JOIN batch_totals bt ON bt.product_id = pi.product_id;
GO

-- Rebuild decant variants from active options, ensuring category 5 products have 5/10/20ml variants.
MERGE dbo.product_variants AS target
USING (
    SELECT
        d.product_id,
        CONCAT(ISNULL(p.sku, CONCAT('PRD-', p.id)), N'-DECANT-', d.volume_ml) AS sku,
        d.volume_ml,
        CONCAT(d.volume_ml, N'ml') AS volume_label,
        d.price,
        CASE WHEN ISNULL(d.status, 1) = 1 THEN 1 ELSE 0 END AS status
    FROM dbo.decant_options d
    INNER JOIN dbo.products p ON p.id = d.product_id
) AS source
ON target.product_id = source.product_id
   AND UPPER(ISNULL(target.variant_type, N'')) = N'DECANT'
   AND target.volume_ml = source.volume_ml
WHEN MATCHED THEN
    UPDATE SET
        sku = source.sku,
        volume_label = source.volume_label,
        price = source.price,
        sale_price = NULL,
        status = source.status,
        updated_at = SYSUTCDATETIME()
WHEN NOT MATCHED THEN
    INSERT (product_id, sku, variant_type, volume_ml, volume_label, price, sale_price, stock_quantity, sort_order, status)
    VALUES (source.product_id, source.sku, N'DECANT', source.volume_ml, source.volume_label, source.price, NULL, 0, 999, source.status);
GO

-- Ensure each product with active decant options is mapped to category 5 in the UI.
UPDATE p
SET p.id_category = 5,
    p.updated_at = SYSUTCDATETIME()
FROM dbo.products p
WHERE EXISTS (
    SELECT 1
    FROM dbo.decant_options d
    WHERE d.product_id = p.id
      AND ISNULL(d.status, 1) = 1
);
GO
