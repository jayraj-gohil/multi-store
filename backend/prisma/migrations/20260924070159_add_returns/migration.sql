/*
  Warnings:

  - Added the required column `original_subtotal` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `original_total_amount` to the `orders` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "order_allocations" ADD COLUMN     "returned_quantity" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sequence" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "returned_quantity" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
-- original_subtotal/original_total_amount are added nullable first, backfilled from the
-- existing (pre-return) subtotal/total_amount for the orders already in this table, then made
-- NOT NULL — this preserves existing order rows instead of requiring the table to be empty.
ALTER TABLE "orders" ADD COLUMN     "original_discount_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "original_discount_type" "DiscountType",
ADD COLUMN     "original_subtotal" DECIMAL(10,2),
ADD COLUMN     "original_total_amount" DECIMAL(10,2),
ADD COLUMN     "total_returned_amount" DECIMAL(10,2) NOT NULL DEFAULT 0;

UPDATE "orders" SET
  "original_subtotal" = "subtotal",
  "original_total_amount" = "total_amount",
  "original_discount_amount" = "discount_amount",
  "original_discount_type" = "discount_type"
WHERE "original_subtotal" IS NULL;

ALTER TABLE "orders" ALTER COLUMN "original_subtotal" SET NOT NULL;
ALTER TABLE "orders" ALTER COLUMN "original_total_amount" SET NOT NULL;

-- CreateTable
CREATE TABLE "returns" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "total_return_amount" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "returns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "return_items" (
    "id" TEXT NOT NULL,
    "return_id" TEXT NOT NULL,
    "order_item_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "return_amount" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "return_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "return_allocations" (
    "id" TEXT NOT NULL,
    "return_item_id" TEXT NOT NULL,
    "order_allocation_id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "return_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "returns_order_id_created_at_idx" ON "returns"("order_id", "created_at");

-- CreateIndex
CREATE INDEX "return_items_return_id_idx" ON "return_items"("return_id");

-- CreateIndex
CREATE INDEX "return_items_order_item_id_idx" ON "return_items"("order_item_id");

-- CreateIndex
CREATE INDEX "return_allocations_return_item_id_idx" ON "return_allocations"("return_item_id");

-- CreateIndex
CREATE INDEX "return_allocations_order_allocation_id_idx" ON "return_allocations"("order_allocation_id");

-- CreateIndex
CREATE INDEX "order_allocations_order_item_id_sequence_idx" ON "order_allocations"("order_item_id", "sequence");

-- AddForeignKey
ALTER TABLE "returns" ADD CONSTRAINT "returns_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "returns" ADD CONSTRAINT "returns_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_items" ADD CONSTRAINT "return_items_return_id_fkey" FOREIGN KEY ("return_id") REFERENCES "returns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_items" ADD CONSTRAINT "return_items_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_items" ADD CONSTRAINT "return_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_allocations" ADD CONSTRAINT "return_allocations_return_item_id_fkey" FOREIGN KEY ("return_item_id") REFERENCES "return_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_allocations" ADD CONSTRAINT "return_allocations_order_allocation_id_fkey" FOREIGN KEY ("order_allocation_id") REFERENCES "order_allocations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_allocations" ADD CONSTRAINT "return_allocations_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
