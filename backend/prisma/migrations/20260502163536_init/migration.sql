-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "profile_photo_url" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "email_verification_token" TEXT,
    "email_verification_expires" TIMESTAMP(3),
    "password_reset_token" TEXT,
    "password_reset_expires" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "address_line1" TEXT,
    "address_line2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "postal_code" TEXT,
    "date_of_birth" TIMESTAMP(3),
    "kyc_document_url" TEXT,
    "kyc_verified" BOOLEAN NOT NULL DEFAULT false,
    "bio" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "landowners" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "total_land_area" DECIMAL(65,30),
    "land_unit" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "landowners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lands" (
    "id" TEXT NOT NULL,
    "landowner_id" TEXT NOT NULL,
    "land_name" TEXT NOT NULL,
    "total_area" DECIMAL(65,30) NOT NULL,
    "area_unit" TEXT NOT NULL,
    "latitude" DECIMAL(65,30),
    "longitude" DECIMAL(65,30),
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
    "overall_rating" DECIMAL(65,30),
    "cultivable_plants" TEXT,
    "rental_fee_monthly" DECIMAL(65,30),
    "minimum_rental_period" INTEGER,
    "additional_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "farmers" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "experience_years" INTEGER,
    "specialization" TEXT,
    "certifications" TEXT,
    "rating" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total_reviews" INTEGER NOT NULL DEFAULT 0,
    "bank_account_name" TEXT,
    "bank_account_number" TEXT,
    "bank_name" TEXT,
    "bank_branch" TEXT,
    "age" INTEGER,
    "location" TEXT,
    "services" TEXT,
    "charges_per_task" DECIMAL(65,30),
    "bio" TEXT,
    "is_profile_public" BOOLEAN NOT NULL DEFAULT true,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "farmers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "farms" (
    "id" TEXT NOT NULL,
    "farmer_id" TEXT,
    "investor_id" TEXT,
    "land_id" TEXT NOT NULL,
    "farm_name" TEXT NOT NULL,
    "description" TEXT,
    "total_area" DECIMAL(65,30),
    "area_unit" TEXT,
    "is_organic" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_approved" BOOLEAN NOT NULL DEFAULT false,
    "is_lease_paid" BOOLEAN NOT NULL DEFAULT false,
    "lease_amount" DECIMAL(65,30),
    "approval_date" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "hiring_status" TEXT NOT NULL DEFAULT 'none',
    "is_direct_planting" BOOLEAN NOT NULL DEFAULT false,
    "payment_request_sent" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "farms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "farm_photos" (
    "id" TEXT NOT NULL,
    "farm_id" TEXT NOT NULL,
    "photo_url" TEXT NOT NULL,
    "caption" TEXT,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "farm_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crop_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "typical_growth_duration_days" INTEGER,
    "typical_yield_per_plant" DECIMAL(65,30),
    "yield_unit" TEXT,
    "description" TEXT,
    "care_instructions" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crop_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plants" (
    "id" TEXT NOT NULL,
    "farm_id" TEXT NOT NULL,
    "crop_type_id" TEXT NOT NULL,
    "unique_identifier" TEXT,
    "plant_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'available',
    "growth_status" TEXT,
    "location_in_farm" TEXT,
    "expected_harvest_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "plantation_request_id" TEXT,
    "land_fee" DECIMAL(65,30),
    "maintenance_fee_monthly" DECIMAL(65,30),
    "expected_yield" DECIMAL(65,30),
    "yield_unit" TEXT,

    CONSTRAINT "plants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "farm_id" TEXT,
    "farmer_id" TEXT,
    "investment_id" TEXT,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "comment" TEXT,
    "is_approved" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorites" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "farm_id" TEXT,
    "plant_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investments" (
    "id" TEXT NOT NULL,
    "investor_id" TEXT NOT NULL,
    "plant_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "investment_duration_months" INTEGER NOT NULL,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "contract_url" TEXT,
    "land_fee" DECIMAL(65,30) NOT NULL,
    "monthly_farmer_fee" DECIMAL(65,30) NOT NULL,
    "platform_fee" DECIMAL(65,30) NOT NULL,
    "total_amount" DECIMAL(65,30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "investment_id" TEXT,
    "farm_id" TEXT,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "type" TEXT,
    "payment_method" TEXT,
    "transaction_id" TEXT,
    "description" TEXT,
    "bank_name" TEXT,
    "account_title" TEXT,
    "account_number" TEXT,
    "proof_url" TEXT,
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recipient_id" TEXT,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "sender_id" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" TEXT,
    "link" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "recipient_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "is_delivered" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plant_activities" (
    "id" TEXT NOT NULL,
    "plant_id" TEXT,
    "farm_id" TEXT,
    "activity_type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "activity_date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plant_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plant_photos" (
    "id" TEXT NOT NULL,
    "plant_id" TEXT,
    "farm_id" TEXT,
    "photo_url" TEXT NOT NULL,
    "caption" TEXT,
    "taken_date" TIMESTAMP(3) NOT NULL,
    "is_milestone" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plant_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plant_milestones" (
    "id" TEXT NOT NULL,
    "plant_id" TEXT,
    "farm_id" TEXT,
    "milestone_type" TEXT NOT NULL,
    "milestone_date" TIMESTAMP(3) NOT NULL,
    "photo_url" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plant_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "farm_availability" (
    "id" TEXT NOT NULL,
    "farm_id" TEXT NOT NULL,
    "day_of_week" TEXT NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "max_visitors_per_slot" INTEGER NOT NULL DEFAULT 10,
    "slot_duration_minutes" INTEGER NOT NULL DEFAULT 120,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "farm_availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "farm_blackout_dates" (
    "id" TEXT NOT NULL,
    "farm_id" TEXT NOT NULL,
    "blackout_date" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "farm_blackout_dates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "additional_activities" (
    "id" TEXT NOT NULL,
    "farm_id" TEXT NOT NULL,
    "activity_name" TEXT NOT NULL,
    "description" TEXT,
    "price_per_person" DECIMAL(65,30) NOT NULL,
    "duration_minutes" INTEGER,
    "max_participants" INTEGER,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "additional_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "investment_id" TEXT,
    "investor_id" TEXT NOT NULL,
    "farm_id" TEXT NOT NULL,
    "visit_date" TIMESTAMP(3) NOT NULL,
    "visit_time" TEXT NOT NULL,
    "number_of_guests" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "special_requests" TEXT,
    "confirmation_code" TEXT NOT NULL,
    "qr_code_url" TEXT,
    "checked_in_at" TIMESTAMP(3),
    "total_cost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "cancellation_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_activities" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "activity_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "price_at_booking" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "booking_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "harvests" (
    "id" TEXT NOT NULL,
    "plant_id" TEXT NOT NULL,
    "investment_id" TEXT,
    "harvest_date" TIMESTAMP(3) NOT NULL,
    "actual_yield" DECIMAL(65,30) NOT NULL,
    "yield_unit" TEXT NOT NULL,
    "quality_grade" TEXT NOT NULL,
    "farmer_notes" TEXT,
    "photo_urls" TEXT,
    "collection_method" TEXT,
    "collection_status" TEXT NOT NULL DEFAULT 'ready',
    "collection_deadline" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "harvests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_requests" (
    "id" TEXT NOT NULL,
    "harvest_id" TEXT NOT NULL,
    "investor_id" TEXT NOT NULL,
    "delivery_address" TEXT NOT NULL,
    "delivery_city" TEXT,
    "delivery_state" TEXT,
    "delivery_postal_code" TEXT,
    "delivery_phone" TEXT NOT NULL,
    "preferred_delivery_date" TIMESTAMP(3),
    "delivery_instructions" TEXT,
    "delivery_cost" DECIMAL(65,30),
    "delivery_status" TEXT NOT NULL DEFAULT 'pending',
    "tracking_number" TEXT,
    "courier_service" TEXT,
    "actual_delivery_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "harvest_reviews" (
    "id" TEXT NOT NULL,
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
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "harvest_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disputes" (
    "id" TEXT NOT NULL,
    "investment_id" TEXT NOT NULL,
    "raised_by_id" TEXT NOT NULL,
    "dispute_type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "resolution" TEXT,
    "resolved_by_id" TEXT,
    "resolved_at" TIMESTAMP(3),
    "attachments" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disputes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_settings" (
    "id" TEXT NOT NULL,
    "setting_key" TEXT NOT NULL,
    "setting_value" TEXT NOT NULL,
    "description" TEXT,
    "updated_by_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_campaigns" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "recipient_filter" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "sent_count" INTEGER NOT NULL DEFAULT 0,
    "opened_count" INTEGER NOT NULL DEFAULT 0,
    "scheduled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "details" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trees" (
    "id" TEXT NOT NULL,
    "tree_name" TEXT NOT NULL,
    "price_per_tree" DECIMAL(65,30) NOT NULL,
    "space_required" DECIMAL(65,30) NOT NULL DEFAULT 100,
    "space_unit" TEXT NOT NULL DEFAULT 'SQ FT',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plantation_requests" (
    "id" TEXT NOT NULL,
    "investor_id" TEXT NOT NULL,
    "farm_id" TEXT,
    "total_price" DECIMAL(65,30) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plantation_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plantation_request_items" (
    "id" TEXT NOT NULL,
    "plantation_request_id" TEXT NOT NULL,
    "tree_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price_per_tree" DECIMAL(65,30) NOT NULL,
    "total_price" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "plantation_request_items_pkey" PRIMARY KEY ("id")
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
CREATE INDEX "farms_investor_id_idx" ON "farms"("investor_id");

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
CREATE INDEX "reviews_farmer_id_idx" ON "reviews"("farmer_id");

-- CreateIndex
CREATE INDEX "reviews_investment_id_idx" ON "reviews"("investment_id");

-- CreateIndex
CREATE INDEX "favorites_user_id_idx" ON "favorites"("user_id");

-- CreateIndex
CREATE INDEX "investments_investor_id_idx" ON "investments"("investor_id");

-- CreateIndex
CREATE INDEX "investments_plant_id_idx" ON "investments"("plant_id");

-- CreateIndex
CREATE INDEX "payments_investment_id_idx" ON "payments"("investment_id");

-- CreateIndex
CREATE INDEX "payments_farm_id_idx" ON "payments"("farm_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_is_read_idx" ON "notifications"("is_read");

-- CreateIndex
CREATE INDEX "messages_sender_id_idx" ON "messages"("sender_id");

-- CreateIndex
CREATE INDEX "messages_recipient_id_idx" ON "messages"("recipient_id");

-- CreateIndex
CREATE INDEX "plant_activities_plant_id_idx" ON "plant_activities"("plant_id");

-- CreateIndex
CREATE INDEX "plant_activities_farm_id_idx" ON "plant_activities"("farm_id");

-- CreateIndex
CREATE INDEX "plant_photos_plant_id_idx" ON "plant_photos"("plant_id");

-- CreateIndex
CREATE INDEX "plant_photos_farm_id_idx" ON "plant_photos"("farm_id");

-- CreateIndex
CREATE INDEX "plant_milestones_plant_id_idx" ON "plant_milestones"("plant_id");

-- CreateIndex
CREATE INDEX "plant_milestones_farm_id_idx" ON "plant_milestones"("farm_id");

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

-- CreateIndex
CREATE INDEX "plantation_requests_investor_id_idx" ON "plantation_requests"("investor_id");

-- CreateIndex
CREATE INDEX "plantation_requests_farm_id_idx" ON "plantation_requests"("farm_id");

-- CreateIndex
CREATE INDEX "plantation_request_items_plantation_request_id_idx" ON "plantation_request_items"("plantation_request_id");

-- CreateIndex
CREATE INDEX "plantation_request_items_tree_id_idx" ON "plantation_request_items"("tree_id");

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "landowners" ADD CONSTRAINT "landowners_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lands" ADD CONSTRAINT "lands_landowner_id_fkey" FOREIGN KEY ("landowner_id") REFERENCES "landowners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "farmers" ADD CONSTRAINT "farmers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "farms" ADD CONSTRAINT "farms_farmer_id_fkey" FOREIGN KEY ("farmer_id") REFERENCES "farmers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "farms" ADD CONSTRAINT "farms_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "farms" ADD CONSTRAINT "farms_land_id_fkey" FOREIGN KEY ("land_id") REFERENCES "lands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "farm_photos" ADD CONSTRAINT "farm_photos_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plants" ADD CONSTRAINT "plants_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plants" ADD CONSTRAINT "plants_crop_type_id_fkey" FOREIGN KEY ("crop_type_id") REFERENCES "crop_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plants" ADD CONSTRAINT "plants_plantation_request_id_fkey" FOREIGN KEY ("plantation_request_id") REFERENCES "plantation_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_farmer_id_fkey" FOREIGN KEY ("farmer_id") REFERENCES "farmers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_investment_id_fkey" FOREIGN KEY ("investment_id") REFERENCES "investments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_plant_id_fkey" FOREIGN KEY ("plant_id") REFERENCES "plants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investments" ADD CONSTRAINT "investments_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investments" ADD CONSTRAINT "investments_plant_id_fkey" FOREIGN KEY ("plant_id") REFERENCES "plants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_investment_id_fkey" FOREIGN KEY ("investment_id") REFERENCES "investments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plant_activities" ADD CONSTRAINT "plant_activities_plant_id_fkey" FOREIGN KEY ("plant_id") REFERENCES "plants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plant_activities" ADD CONSTRAINT "plant_activities_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plant_photos" ADD CONSTRAINT "plant_photos_plant_id_fkey" FOREIGN KEY ("plant_id") REFERENCES "plants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plant_photos" ADD CONSTRAINT "plant_photos_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plant_milestones" ADD CONSTRAINT "plant_milestones_plant_id_fkey" FOREIGN KEY ("plant_id") REFERENCES "plants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plant_milestones" ADD CONSTRAINT "plant_milestones_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "farm_availability" ADD CONSTRAINT "farm_availability_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "farm_blackout_dates" ADD CONSTRAINT "farm_blackout_dates_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "additional_activities" ADD CONSTRAINT "additional_activities_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_investment_id_fkey" FOREIGN KEY ("investment_id") REFERENCES "investments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_activities" ADD CONSTRAINT "booking_activities_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_activities" ADD CONSTRAINT "booking_activities_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "additional_activities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "harvests" ADD CONSTRAINT "harvests_plant_id_fkey" FOREIGN KEY ("plant_id") REFERENCES "plants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "harvests" ADD CONSTRAINT "harvests_investment_id_fkey" FOREIGN KEY ("investment_id") REFERENCES "investments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_requests" ADD CONSTRAINT "delivery_requests_harvest_id_fkey" FOREIGN KEY ("harvest_id") REFERENCES "harvests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_requests" ADD CONSTRAINT "delivery_requests_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "harvest_reviews" ADD CONSTRAINT "harvest_reviews_investment_id_fkey" FOREIGN KEY ("investment_id") REFERENCES "investments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "harvest_reviews" ADD CONSTRAINT "harvest_reviews_harvest_id_fkey" FOREIGN KEY ("harvest_id") REFERENCES "harvests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "harvest_reviews" ADD CONSTRAINT "harvest_reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "harvest_reviews" ADD CONSTRAINT "harvest_reviews_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "harvest_reviews" ADD CONSTRAINT "harvest_reviews_farmer_id_fkey" FOREIGN KEY ("farmer_id") REFERENCES "farmers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_investment_id_fkey" FOREIGN KEY ("investment_id") REFERENCES "investments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_raised_by_id_fkey" FOREIGN KEY ("raised_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_resolved_by_id_fkey" FOREIGN KEY ("resolved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_settings" ADD CONSTRAINT "platform_settings_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plantation_requests" ADD CONSTRAINT "plantation_requests_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plantation_requests" ADD CONSTRAINT "plantation_requests_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plantation_request_items" ADD CONSTRAINT "plantation_request_items_plantation_request_id_fkey" FOREIGN KEY ("plantation_request_id") REFERENCES "plantation_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plantation_request_items" ADD CONSTRAINT "plantation_request_items_tree_id_fkey" FOREIGN KEY ("tree_id") REFERENCES "trees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
