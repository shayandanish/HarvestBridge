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
    "payment_request_sent" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "farms_farmer_id_fkey" FOREIGN KEY ("farmer_id") REFERENCES "farmers" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "farms_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "farms_land_id_fkey" FOREIGN KEY ("land_id") REFERENCES "lands" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_farms" ("approval_date", "area_unit", "created_at", "description", "farm_name", "farmer_id", "hiring_status", "id", "investor_id", "is_active", "is_approved", "is_direct_planting", "is_lease_paid", "is_organic", "land_id", "lease_amount", "rejection_reason", "total_area", "updated_at") SELECT "approval_date", "area_unit", "created_at", "description", "farm_name", "farmer_id", "hiring_status", "id", "investor_id", "is_active", "is_approved", "is_direct_planting", "is_lease_paid", "is_organic", "land_id", "lease_amount", "rejection_reason", "total_area", "updated_at" FROM "farms";
DROP TABLE "farms";
ALTER TABLE "new_farms" RENAME TO "farms";
CREATE INDEX "farms_farmer_id_idx" ON "farms"("farmer_id");
CREATE INDEX "farms_investor_id_idx" ON "farms"("investor_id");
CREATE INDEX "farms_land_id_idx" ON "farms"("land_id");
CREATE INDEX "farms_is_approved_idx" ON "farms"("is_approved");
CREATE TABLE "new_plant_activities" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "plant_id" TEXT,
    "farm_id" TEXT,
    "activity_type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "activity_date" DATETIME NOT NULL,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "plant_activities_plant_id_fkey" FOREIGN KEY ("plant_id") REFERENCES "plants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "plant_activities_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_plant_activities" ("activity_date", "activity_type", "created_at", "description", "id", "notes", "plant_id") SELECT "activity_date", "activity_type", "created_at", "description", "id", "notes", "plant_id" FROM "plant_activities";
DROP TABLE "plant_activities";
ALTER TABLE "new_plant_activities" RENAME TO "plant_activities";
CREATE INDEX "plant_activities_plant_id_idx" ON "plant_activities"("plant_id");
CREATE INDEX "plant_activities_farm_id_idx" ON "plant_activities"("farm_id");
CREATE TABLE "new_plant_milestones" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "plant_id" TEXT,
    "farm_id" TEXT,
    "milestone_type" TEXT NOT NULL,
    "milestone_date" DATETIME NOT NULL,
    "photo_url" TEXT,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "plant_milestones_plant_id_fkey" FOREIGN KEY ("plant_id") REFERENCES "plants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "plant_milestones_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_plant_milestones" ("created_at", "id", "milestone_date", "milestone_type", "notes", "photo_url", "plant_id") SELECT "created_at", "id", "milestone_date", "milestone_type", "notes", "photo_url", "plant_id" FROM "plant_milestones";
DROP TABLE "plant_milestones";
ALTER TABLE "new_plant_milestones" RENAME TO "plant_milestones";
CREATE INDEX "plant_milestones_plant_id_idx" ON "plant_milestones"("plant_id");
CREATE INDEX "plant_milestones_farm_id_idx" ON "plant_milestones"("farm_id");
CREATE TABLE "new_plant_photos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "plant_id" TEXT,
    "farm_id" TEXT,
    "photo_url" TEXT NOT NULL,
    "caption" TEXT,
    "taken_date" DATETIME NOT NULL,
    "is_milestone" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "plant_photos_plant_id_fkey" FOREIGN KEY ("plant_id") REFERENCES "plants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "plant_photos_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_plant_photos" ("caption", "created_at", "id", "is_milestone", "photo_url", "plant_id", "taken_date") SELECT "caption", "created_at", "id", "is_milestone", "photo_url", "plant_id", "taken_date" FROM "plant_photos";
DROP TABLE "plant_photos";
ALTER TABLE "new_plant_photos" RENAME TO "plant_photos";
CREATE INDEX "plant_photos_plant_id_idx" ON "plant_photos"("plant_id");
CREATE INDEX "plant_photos_farm_id_idx" ON "plant_photos"("farm_id");
CREATE TABLE "new_trees" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tree_name" TEXT NOT NULL,
    "price_per_tree" DECIMAL NOT NULL,
    "space_required" DECIMAL NOT NULL DEFAULT 100,
    "space_unit" TEXT NOT NULL DEFAULT 'SQ FT',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_trees" ("created_at", "id", "is_active", "price_per_tree", "tree_name", "updated_at") SELECT "created_at", "id", "is_active", "price_per_tree", "tree_name", "updated_at" FROM "trees";
DROP TABLE "trees";
ALTER TABLE "new_trees" RENAME TO "trees";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
