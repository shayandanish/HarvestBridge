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
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "farms_farmer_id_fkey" FOREIGN KEY ("farmer_id") REFERENCES "farmers" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "farms_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "farms_land_id_fkey" FOREIGN KEY ("land_id") REFERENCES "lands" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_farms" ("approval_date", "area_unit", "created_at", "description", "farm_name", "farmer_id", "id", "is_active", "is_approved", "is_organic", "land_id", "rejection_reason", "total_area", "updated_at") SELECT "approval_date", "area_unit", "created_at", "description", "farm_name", "farmer_id", "id", "is_active", "is_approved", "is_organic", "land_id", "rejection_reason", "total_area", "updated_at" FROM "farms";
DROP TABLE "farms";
ALTER TABLE "new_farms" RENAME TO "farms";
CREATE INDEX "farms_farmer_id_idx" ON "farms"("farmer_id");
CREATE INDEX "farms_investor_id_idx" ON "farms"("investor_id");
CREATE INDEX "farms_land_id_idx" ON "farms"("land_id");
CREATE INDEX "farms_is_approved_idx" ON "farms"("is_approved");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
