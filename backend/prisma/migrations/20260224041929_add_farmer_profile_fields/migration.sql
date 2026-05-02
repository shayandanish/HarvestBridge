-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "profile_photo_url" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "email_verification_token" TEXT,
    "email_verification_expires" DATETIME,
    "password_reset_token" TEXT,
    "password_reset_expires" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "address_line1" TEXT,
    "address_line2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "postal_code" TEXT,
    "date_of_birth" DATETIME,
    "kyc_document_url" TEXT,
    "kyc_verified" BOOLEAN NOT NULL DEFAULT false,
    "bio" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "landowners" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "total_land_area" DECIMAL,
    "land_unit" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "landowners_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "lands" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "landowner_id" TEXT NOT NULL,
    "land_name" TEXT NOT NULL,
    "total_area" DECIMAL NOT NULL,
    "area_unit" TEXT NOT NULL,
    "latitude" DECIMAL,
    "longitude" DECIMAL,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "postal_code" TEXT,
    "specific_location" TEXT,
    "ownership_document_url" TEXT,
    "land_photos" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "rejection_reason" TEXT,
    "soil_quality" INTEGER,
    "water_availability" INTEGER,
    "sunlight_exposure" INTEGER,
    "overall_rating" DECIMAL,
    "cultivable_plants" TEXT,
    "rental_fee_monthly" DECIMAL,
    "minimum_rental_period" INTEGER,
    "additional_notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "lands_landowner_id_fkey" FOREIGN KEY ("landowner_id") REFERENCES "landowners" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "farmers" (
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
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "farmers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "farms" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "farmer_id" TEXT NOT NULL,
    "land_id" TEXT NOT NULL,
    "farm_name" TEXT NOT NULL,
    "description" TEXT,
    "total_area" DECIMAL,
    "area_unit" TEXT,
    "is_organic" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_approved" BOOLEAN NOT NULL DEFAULT false,
    "approval_date" DATETIME,
    "rejection_reason" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "farms_farmer_id_fkey" FOREIGN KEY ("farmer_id") REFERENCES "farmers" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "farms_land_id_fkey" FOREIGN KEY ("land_id") REFERENCES "lands" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "farm_photos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "farm_id" TEXT NOT NULL,
    "photo_url" TEXT NOT NULL,
    "caption" TEXT,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "farm_photos_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "crop_types" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "typical_growth_duration_days" INTEGER,
    "typical_yield_per_plant" DECIMAL,
    "yield_unit" TEXT,
    "description" TEXT,
    "care_instructions" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "plants" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "farm_id" TEXT NOT NULL,
    "crop_type_id" TEXT NOT NULL,
    "unique_identifier" TEXT,
    "plant_date" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'available',
    "location_in_farm" TEXT,
    "expected_harvest_date" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "land_fee" DECIMAL,
    "maintenance_fee_monthly" DECIMAL,
    "expected_yield" DECIMAL,
    "yield_unit" TEXT,
    CONSTRAINT "plants_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "plants_crop_type_id_fkey" FOREIGN KEY ("crop_type_id") REFERENCES "crop_types" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "farm_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "comment" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "reviews_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "favorites" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "farm_id" TEXT,
    "plant_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "favorites_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "favorites_plant_id_fkey" FOREIGN KEY ("plant_id") REFERENCES "plants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "investments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "investor_id" TEXT NOT NULL,
    "plant_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "investment_duration_months" INTEGER NOT NULL,
    "start_date" DATETIME,
    "end_date" DATETIME,
    "contract_url" TEXT,
    "land_fee" DECIMAL NOT NULL,
    "monthly_farmer_fee" DECIMAL NOT NULL,
    "platform_fee" DECIMAL NOT NULL,
    "total_amount" DECIMAL NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "investments_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "investments_plant_id_fkey" FOREIGN KEY ("plant_id") REFERENCES "plants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "investment_id" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "type" TEXT,
    "payment_method" TEXT,
    "transaction_id" TEXT,
    "description" TEXT,
    "paid_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recipient_id" TEXT,
    CONSTRAINT "payments_investment_id_fkey" FOREIGN KEY ("investment_id") REFERENCES "investments" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "payments_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "plant_activities" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "plant_id" TEXT NOT NULL,
    "activity_type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "activity_date" DATETIME NOT NULL,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "plant_activities_plant_id_fkey" FOREIGN KEY ("plant_id") REFERENCES "plants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "plant_photos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "plant_id" TEXT NOT NULL,
    "photo_url" TEXT NOT NULL,
    "caption" TEXT,
    "taken_date" DATETIME NOT NULL,
    "is_milestone" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "plant_photos_plant_id_fkey" FOREIGN KEY ("plant_id") REFERENCES "plants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "plant_milestones" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "plant_id" TEXT NOT NULL,
    "milestone_type" TEXT NOT NULL,
    "milestone_date" DATETIME NOT NULL,
    "photo_url" TEXT,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "plant_milestones_plant_id_fkey" FOREIGN KEY ("plant_id") REFERENCES "plants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "farm_availability" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "farm_id" TEXT NOT NULL,
    "day_of_week" TEXT NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "max_visitors_per_slot" INTEGER NOT NULL DEFAULT 10,
    "slot_duration_minutes" INTEGER NOT NULL DEFAULT 120,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "farm_availability_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "farm_blackout_dates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "farm_id" TEXT NOT NULL,
    "blackout_date" DATETIME NOT NULL,
    "reason" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "farm_blackout_dates_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "additional_activities" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "farm_id" TEXT NOT NULL,
    "activity_name" TEXT NOT NULL,
    "description" TEXT,
    "price_per_person" DECIMAL NOT NULL,
    "duration_minutes" INTEGER,
    "max_participants" INTEGER,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "additional_activities_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "investment_id" TEXT,
    "investor_id" TEXT NOT NULL,
    "farm_id" TEXT NOT NULL,
    "visit_date" DATETIME NOT NULL,
    "visit_time" TEXT NOT NULL,
    "number_of_guests" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "special_requests" TEXT,
    "confirmation_code" TEXT NOT NULL,
    "qr_code_url" TEXT,
    "checked_in_at" DATETIME,
    "total_cost" DECIMAL NOT NULL DEFAULT 0,
    "cancellation_reason" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "bookings_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "bookings_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "bookings_investment_id_fkey" FOREIGN KEY ("investment_id") REFERENCES "investments" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "booking_activities" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "booking_id" TEXT NOT NULL,
    "activity_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "price_at_booking" DECIMAL NOT NULL,
    CONSTRAINT "booking_activities_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "booking_activities_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "additional_activities" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "harvests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "plant_id" TEXT NOT NULL,
    "investment_id" TEXT,
    "harvest_date" DATETIME NOT NULL,
    "actual_yield" DECIMAL NOT NULL,
    "yield_unit" TEXT NOT NULL,
    "quality_grade" TEXT NOT NULL,
    "farmer_notes" TEXT,
    "photo_urls" TEXT,
    "collection_method" TEXT,
    "collection_status" TEXT NOT NULL DEFAULT 'ready',
    "collection_deadline" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "harvests_plant_id_fkey" FOREIGN KEY ("plant_id") REFERENCES "plants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "harvests_investment_id_fkey" FOREIGN KEY ("investment_id") REFERENCES "investments" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "delivery_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "harvest_id" TEXT NOT NULL,
    "investor_id" TEXT NOT NULL,
    "delivery_address" TEXT NOT NULL,
    "delivery_city" TEXT,
    "delivery_state" TEXT,
    "delivery_postal_code" TEXT,
    "delivery_phone" TEXT NOT NULL,
    "preferred_delivery_date" DATETIME,
    "delivery_instructions" TEXT,
    "delivery_cost" DECIMAL,
    "delivery_status" TEXT NOT NULL DEFAULT 'pending',
    "tracking_number" TEXT,
    "courier_service" TEXT,
    "actual_delivery_date" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "delivery_requests_harvest_id_fkey" FOREIGN KEY ("harvest_id") REFERENCES "harvests" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "delivery_requests_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "harvest_reviews" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "investment_id" TEXT NOT NULL,
    "harvest_id" TEXT NOT NULL,
    "reviewer_id" TEXT NOT NULL,
    "farm_id" TEXT NOT NULL,
    "farmer_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "review_text" TEXT,
    "yield_satisfaction" INTEGER NOT NULL DEFAULT 5,
    "quality_satisfaction" INTEGER NOT NULL DEFAULT 5,
    "experience_satisfaction" INTEGER NOT NULL DEFAULT 5,
    "would_invest_again" BOOLEAN NOT NULL DEFAULT true,
    "photos" TEXT,
    "is_approved" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "harvest_reviews_investment_id_fkey" FOREIGN KEY ("investment_id") REFERENCES "investments" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "harvest_reviews_harvest_id_fkey" FOREIGN KEY ("harvest_id") REFERENCES "harvests" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "harvest_reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "harvest_reviews_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "harvest_reviews_farmer_id_fkey" FOREIGN KEY ("farmer_id") REFERENCES "farmers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "disputes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "investment_id" TEXT NOT NULL,
    "raised_by_id" TEXT NOT NULL,
    "dispute_type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "resolution" TEXT,
    "resolved_by_id" TEXT,
    "resolved_at" DATETIME,
    "attachments" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "disputes_investment_id_fkey" FOREIGN KEY ("investment_id") REFERENCES "investments" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "disputes_raised_by_id_fkey" FOREIGN KEY ("raised_by_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "disputes_resolved_by_id_fkey" FOREIGN KEY ("resolved_by_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "platform_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "setting_key" TEXT NOT NULL,
    "setting_value" TEXT NOT NULL,
    "description" TEXT,
    "updated_by_id" TEXT,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "platform_settings_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "email_campaigns" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "recipient_filter" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "sent_count" INTEGER NOT NULL DEFAULT 0,
    "opened_count" INTEGER NOT NULL DEFAULT 0,
    "scheduled_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "details" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_user_id_key" ON "user_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "landowners_user_id_key" ON "landowners"("user_id");

-- CreateIndex
CREATE INDEX "lands_landowner_id_idx" ON "lands"("landowner_id");

-- CreateIndex
CREATE INDEX "lands_is_verified_idx" ON "lands"("is_verified");

-- CreateIndex
CREATE INDEX "lands_is_active_idx" ON "lands"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "farmers_user_id_key" ON "farmers"("user_id");

-- CreateIndex
CREATE INDEX "farms_farmer_id_idx" ON "farms"("farmer_id");

-- CreateIndex
CREATE INDEX "farms_land_id_idx" ON "farms"("land_id");

-- CreateIndex
CREATE INDEX "farms_is_approved_idx" ON "farms"("is_approved");

-- CreateIndex
CREATE INDEX "farm_photos_farm_id_idx" ON "farm_photos"("farm_id");

-- CreateIndex
CREATE UNIQUE INDEX "crop_types_name_key" ON "crop_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "plants_unique_identifier_key" ON "plants"("unique_identifier");

-- CreateIndex
CREATE INDEX "plants_farm_id_idx" ON "plants"("farm_id");

-- CreateIndex
CREATE INDEX "plants_crop_type_id_idx" ON "plants"("crop_type_id");

-- CreateIndex
CREATE INDEX "plants_status_idx" ON "plants"("status");

-- CreateIndex
CREATE INDEX "reviews_user_id_idx" ON "reviews"("user_id");

-- CreateIndex
CREATE INDEX "reviews_farm_id_idx" ON "reviews"("farm_id");

-- CreateIndex
CREATE INDEX "favorites_user_id_idx" ON "favorites"("user_id");

-- CreateIndex
CREATE INDEX "investments_investor_id_idx" ON "investments"("investor_id");

-- CreateIndex
CREATE INDEX "investments_plant_id_idx" ON "investments"("plant_id");

-- CreateIndex
CREATE INDEX "payments_investment_id_idx" ON "payments"("investment_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "plant_activities_plant_id_idx" ON "plant_activities"("plant_id");

-- CreateIndex
CREATE INDEX "plant_photos_plant_id_idx" ON "plant_photos"("plant_id");

-- CreateIndex
CREATE INDEX "plant_milestones_plant_id_idx" ON "plant_milestones"("plant_id");

-- CreateIndex
CREATE INDEX "farm_availability_farm_id_idx" ON "farm_availability"("farm_id");

-- CreateIndex
CREATE INDEX "farm_blackout_dates_farm_id_idx" ON "farm_blackout_dates"("farm_id");

-- CreateIndex
CREATE INDEX "additional_activities_farm_id_idx" ON "additional_activities"("farm_id");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_confirmation_code_key" ON "bookings"("confirmation_code");

-- CreateIndex
CREATE INDEX "bookings_investor_id_idx" ON "bookings"("investor_id");

-- CreateIndex
CREATE INDEX "bookings_farm_id_idx" ON "bookings"("farm_id");

-- CreateIndex
CREATE INDEX "bookings_visit_date_idx" ON "bookings"("visit_date");

-- CreateIndex
CREATE INDEX "booking_activities_booking_id_idx" ON "booking_activities"("booking_id");

-- CreateIndex
CREATE INDEX "harvests_plant_id_idx" ON "harvests"("plant_id");

-- CreateIndex
CREATE INDEX "harvests_investment_id_idx" ON "harvests"("investment_id");

-- CreateIndex
CREATE INDEX "harvests_collection_status_idx" ON "harvests"("collection_status");

-- CreateIndex
CREATE INDEX "delivery_requests_harvest_id_idx" ON "delivery_requests"("harvest_id");

-- CreateIndex
CREATE INDEX "delivery_requests_investor_id_idx" ON "delivery_requests"("investor_id");

-- CreateIndex
CREATE INDEX "delivery_requests_delivery_status_idx" ON "delivery_requests"("delivery_status");

-- CreateIndex
CREATE INDEX "harvest_reviews_investment_id_idx" ON "harvest_reviews"("investment_id");

-- CreateIndex
CREATE INDEX "harvest_reviews_harvest_id_idx" ON "harvest_reviews"("harvest_id");

-- CreateIndex
CREATE INDEX "harvest_reviews_reviewer_id_idx" ON "harvest_reviews"("reviewer_id");

-- CreateIndex
CREATE INDEX "harvest_reviews_farm_id_idx" ON "harvest_reviews"("farm_id");

-- CreateIndex
CREATE INDEX "harvest_reviews_farmer_id_idx" ON "harvest_reviews"("farmer_id");

-- CreateIndex
CREATE INDEX "disputes_investment_id_idx" ON "disputes"("investment_id");

-- CreateIndex
CREATE INDEX "disputes_raised_by_id_idx" ON "disputes"("raised_by_id");

-- CreateIndex
CREATE INDEX "disputes_status_idx" ON "disputes"("status");

-- CreateIndex
CREATE UNIQUE INDEX "platform_settings_setting_key_key" ON "platform_settings"("setting_key");

-- CreateIndex
CREATE INDEX "activity_logs_user_id_idx" ON "activity_logs"("user_id");

-- CreateIndex
CREATE INDEX "activity_logs_action_idx" ON "activity_logs"("action");

-- CreateIndex
CREATE INDEX "activity_logs_entity_type_idx" ON "activity_logs"("entity_type");
