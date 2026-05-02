-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_farmers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "experience_years" INTEGER,
    "specialization" TEXT,
    "certifications" TEXT,
    "rating" DECIMAL NOT NULL DEFAULT 0,
    "total_reviews" INTEGER NOT NULL DEFAULT 0,
    "bank_account_name" TEXT,
    "bank_account_number" TEXT,
    "bank_name" TEXT,
    "bank_branch" TEXT,
    "age" INTEGER,
    "location" TEXT,
    "services" TEXT,
    "charges_per_task" DECIMAL,
    "bio" TEXT,
    "is_profile_public" BOOLEAN NOT NULL DEFAULT true,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "rejection_reason" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "farmers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_farmers" ("age", "bank_account_name", "bank_account_number", "bank_branch", "bank_name", "bio", "certifications", "charges_per_task", "created_at", "experience_years", "id", "is_profile_public", "location", "rating", "services", "specialization", "total_reviews", "updated_at", "user_id") SELECT "age", "bank_account_name", "bank_account_number", "bank_branch", "bank_name", "bio", "certifications", "charges_per_task", "created_at", "experience_years", "id", "is_profile_public", "location", "rating", "services", "specialization", "total_reviews", "updated_at", "user_id" FROM "farmers";
DROP TABLE "farmers";
ALTER TABLE "new_farmers" RENAME TO "farmers";
CREATE UNIQUE INDEX "farmers_user_id_key" ON "farmers"("user_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
