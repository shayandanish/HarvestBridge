-- CreateTable
CREATE TABLE "trees" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tree_name" TEXT NOT NULL,
    "price_per_tree" DECIMAL NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "plantation_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "investor_id" TEXT NOT NULL,
    "farm_id" TEXT,
    "total_price" DECIMAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "plantation_requests_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "plantation_requests_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "plantation_request_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "plantation_request_id" TEXT NOT NULL,
    "tree_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price_per_tree" DECIMAL NOT NULL,
    "total_price" DECIMAL NOT NULL,
    CONSTRAINT "plantation_request_items_plantation_request_id_fkey" FOREIGN KEY ("plantation_request_id") REFERENCES "plantation_requests" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "plantation_request_items_tree_id_fkey" FOREIGN KEY ("tree_id") REFERENCES "trees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_farms" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "farmer_id" TEXT,
    "investor_id" TEXT,
    "land_id" TEXT NOT NULL,
    "farm_name" TEXT NOT NULL,
    "description" TEXT,
    "total_area" DECIMAL,
    "area_unit" TEXT,
    "is_organic" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_approved" BOOLEAN NOT NULL DEFAULT false,
    "is_lease_paid" BOOLEAN NOT NULL DEFAULT false,
    "lease_amount" DECIMAL,
    "approval_date" DATETIME,
    "rejection_reason" TEXT,
    "hiring_status" TEXT NOT NULL DEFAULT 'none',
    "is_direct_planting" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "farms_farmer_id_fkey" FOREIGN KEY ("farmer_id") REFERENCES "farmers" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "farms_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "farms_land_id_fkey" FOREIGN KEY ("land_id") REFERENCES "lands" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_farms" ("approval_date", "area_unit", "created_at", "description", "farm_name", "farmer_id", "id", "investor_id", "is_active", "is_approved", "is_lease_paid", "is_organic", "land_id", "lease_amount", "rejection_reason", "total_area", "updated_at") SELECT "approval_date", "area_unit", "created_at", "description", "farm_name", "farmer_id", "id", "investor_id", "is_active", "is_approved", "is_lease_paid", "is_organic", "land_id", "lease_amount", "rejection_reason", "total_area", "updated_at" FROM "farms";
DROP TABLE "farms";
ALTER TABLE "new_farms" RENAME TO "farms";
CREATE INDEX "farms_farmer_id_idx" ON "farms"("farmer_id");
CREATE INDEX "farms_investor_id_idx" ON "farms"("investor_id");
CREATE INDEX "farms_land_id_idx" ON "farms"("land_id");
CREATE INDEX "farms_is_approved_idx" ON "farms"("is_approved");
CREATE TABLE "new_payments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "investment_id" TEXT,
    "farm_id" TEXT,
    "amount" DECIMAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "type" TEXT,
    "payment_method" TEXT,
    "transaction_id" TEXT,
    "description" TEXT,
    "bank_name" TEXT,
    "account_title" TEXT,
    "account_number" TEXT,
    "paid_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recipient_id" TEXT,
    CONSTRAINT "payments_investment_id_fkey" FOREIGN KEY ("investment_id") REFERENCES "investments" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "payments_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "payments_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_payments" ("amount", "created_at", "currency", "description", "id", "investment_id", "paid_at", "payment_method", "recipient_id", "status", "transaction_id", "type") SELECT "amount", "created_at", "currency", "description", "id", "investment_id", "paid_at", "payment_method", "recipient_id", "status", "transaction_id", "type" FROM "payments";
DROP TABLE "payments";
ALTER TABLE "new_payments" RENAME TO "payments";
CREATE INDEX "payments_investment_id_idx" ON "payments"("investment_id");
CREATE INDEX "payments_farm_id_idx" ON "payments"("farm_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "plantation_requests_investor_id_idx" ON "plantation_requests"("investor_id");

-- CreateIndex
CREATE INDEX "plantation_requests_farm_id_idx" ON "plantation_requests"("farm_id");

-- CreateIndex
CREATE INDEX "plantation_request_items_plantation_request_id_idx" ON "plantation_request_items"("plantation_request_id");

-- CreateIndex
CREATE INDEX "plantation_request_items_tree_id_idx" ON "plantation_request_items"("tree_id");
