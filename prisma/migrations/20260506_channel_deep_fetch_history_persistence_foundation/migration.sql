-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "manifest_type" AS ENUM ('CHANNEL', 'SEARCH', 'AI_ASSISTED_SEARCH');

-- CreateEnum
CREATE TYPE "manifest_persistence_type" AS ENUM ('TEMPORARY', 'DURABLE');

-- CreateEnum
CREATE TYPE "manifest_status" AS ENUM ('DRAFT', 'FETCHING', 'PARTIAL', 'COMPLETE', 'CAPPED', 'STOPPED', 'FAILED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "fetch_profile" AS ENUM ('QUICK_PREVIEW', 'STANDARD_FETCH', 'DEEP_BALANCED', 'DEEP_AGGRESSIVE', 'RECENT_SYNC', 'HISTORICAL_BACKFILL', 'CUSTOM_EXPERT');

-- CreateEnum
CREATE TYPE "fetch_job_status" AS ENUM ('PENDING', 'RUNNING', 'PARTIAL', 'COMPLETE', 'CAPPED', 'STOPPED', 'FAILED', 'MAX_ITEMS_REACHED', 'TIMEOUT_LIMITED', 'PROVIDER_LIMITED', 'AUTH_OR_PROVIDER_LIMITED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "fetch_window_status" AS ENUM ('PENDING', 'RUNNING', 'COMPLETE', 'CAPPED', 'SPLIT', 'FAILED', 'STOPPED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "fetch_window_unit" AS ENUM ('ALL', 'YEAR', 'MONTH', 'WEEK', 'DAY');

-- CreateEnum
CREATE TYPE "fetch_page_attempt_status" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'RATE_LIMITED', 'AUTH_OR_PROVIDER_LIMITED', 'CANCELED');

-- CreateEnum
CREATE TYPE "coverage_status" AS ENUM ('UNKNOWN', 'PARTIAL', 'COMPLETE', 'CAPPED', 'FAILED', 'STOPPED', 'MAX_ITEMS_REACHED', 'PROVIDER_LIMITED', 'TIMEOUT_LIMITED', 'AUTH_OR_PROVIDER_LIMITED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "coverage_confidence" AS ENUM ('HIGH', 'MEDIUM', 'LOW', 'UNKNOWN');

-- CreateTable
CREATE TABLE "video_sources" (
    "id" UUID NOT NULL,
    "platform" TEXT NOT NULL,
    "external_source_id" TEXT NOT NULL,
    "source_type" TEXT NOT NULL,
    "handle" TEXT,
    "username" TEXT,
    "display_name" TEXT,
    "canonical_url" TEXT,
    "thumbnail_url" TEXT,
    "avatar_url" TEXT,
    "description" TEXT,
    "country" TEXT,
    "language" TEXT,
    "reported_total_from_api" INTEGER,
    "reported_total_field_name" TEXT,
    "reported_total_checked_at" TIMESTAMPTZ(6),
    "metadata_json" JSONB,
    "first_seen_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_fetched_at" TIMESTAMPTZ(6),
    "last_metadata_refresh_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "video_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "videos" (
    "id" UUID NOT NULL,
    "platform" TEXT NOT NULL,
    "platform_video_id" TEXT NOT NULL,
    "source_id" UUID,
    "url" TEXT,
    "embed_url" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "thumbnail_url" TEXT,
    "duration_seconds" INTEGER,
    "views_count" BIGINT,
    "rating" DECIMAL(8,3),
    "language" TEXT,
    "owner_id" TEXT,
    "owner_name" TEXT,
    "channel_id" TEXT,
    "channel_name" TEXT,
    "tags" TEXT[],
    "published_at" TIMESTAMPTZ(6),
    "year" INTEGER,
    "has_thumbnail" BOOLEAN NOT NULL DEFAULT false,
    "has_description" BOOLEAN NOT NULL DEFAULT false,
    "raw_json" JSONB,
    "metadata_hash" TEXT,
    "first_seen_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "videos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collections" (
    "id" UUID NOT NULL,
    "owner_id" UUID,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_videos" (
    "id" UUID NOT NULL,
    "owner_id" UUID,
    "video_id" UUID NOT NULL,
    "collection_id" UUID,
    "favorite" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "saved_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "saved_videos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manifests" (
    "id" UUID NOT NULL,
    "owner_id" UUID,
    "manifest_type" "manifest_type" NOT NULL,
    "persistence_type" "manifest_persistence_type" NOT NULL DEFAULT 'TEMPORARY',
    "platform" TEXT NOT NULL,
    "source_id" UUID,
    "source_input" TEXT,
    "source_url" TEXT,
    "query" TEXT,
    "status" "manifest_status" NOT NULL DEFAULT 'DRAFT',
    "completeness_status" "coverage_status" NOT NULL DEFAULT 'UNKNOWN',
    "item_count" BIGINT NOT NULL DEFAULT 0,
    "unique_item_count" BIGINT NOT NULL DEFAULT 0,
    "duplicate_count" BIGINT NOT NULL DEFAULT 0,
    "total_pages_fetched" INTEGER NOT NULL DEFAULT 0,
    "total_windows_processed" INTEGER NOT NULL DEFAULT 0,
    "capped_window_count" INTEGER NOT NULL DEFAULT 0,
    "failed_window_count" INTEGER NOT NULL DEFAULT 0,
    "fetch_settings_json" JSONB,
    "filters_snapshot_json" JSONB,
    "request_id" TEXT,
    "expires_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "completed_at" TIMESTAMPTZ(6),

    CONSTRAINT "manifests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manifest_items" (
    "id" UUID NOT NULL,
    "manifest_id" UUID NOT NULL,
    "video_id" UUID NOT NULL,
    "fetch_window_id" UUID,
    "position" BIGINT NOT NULL,
    "page_number" INTEGER,
    "matched_reason" TEXT,
    "ai_score" DECIMAL(8,3),
    "first_seen_in_manifest_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata_snapshot_json" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "manifest_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fetch_jobs" (
    "id" UUID NOT NULL,
    "owner_id" UUID,
    "source_id" UUID,
    "manifest_id" UUID,
    "job_type" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "source_input" TEXT NOT NULL,
    "source_url" TEXT,
    "fetch_profile" "fetch_profile" NOT NULL,
    "status" "fetch_job_status" NOT NULL DEFAULT 'PENDING',
    "settings_json" JSONB NOT NULL,
    "progress_json" JSONB,
    "error_json" JSONB,
    "resume_cursor_json" JSONB,
    "current_window_id" UUID,
    "current_page" INTEGER,
    "last_completed_window_id" UUID,
    "max_items" BIGINT,
    "max_pages" INTEGER,
    "max_windows" INTEGER,
    "pages_fetched" INTEGER NOT NULL DEFAULT 0,
    "windows_processed" INTEGER NOT NULL DEFAULT 0,
    "items_collected" BIGINT NOT NULL DEFAULT 0,
    "unique_items_collected" BIGINT NOT NULL DEFAULT 0,
    "duplicate_count" BIGINT NOT NULL DEFAULT 0,
    "capped_window_count" INTEGER NOT NULL DEFAULT 0,
    "failed_window_count" INTEGER NOT NULL DEFAULT 0,
    "source_reported_total_at_start" INTEGER,
    "source_reported_total_at_end" INTEGER,
    "collected_unique_at_start" BIGINT NOT NULL DEFAULT 0,
    "collected_unique_at_end" BIGINT NOT NULL DEFAULT 0,
    "coverage_status_at_start" "coverage_status" NOT NULL DEFAULT 'UNKNOWN',
    "coverage_status_at_end" "coverage_status" NOT NULL DEFAULT 'UNKNOWN',
    "resumable" BOOLEAN NOT NULL DEFAULT true,
    "stopped_at" TIMESTAMPTZ(6),
    "started_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "expires_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "fetch_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fetch_windows" (
    "id" UUID NOT NULL,
    "fetch_job_id" UUID NOT NULL,
    "source_id" UUID,
    "parent_window_id" UUID,
    "status" "fetch_window_status" NOT NULL DEFAULT 'PENDING',
    "window_start" TIMESTAMPTZ(6),
    "window_end" TIMESTAMPTZ(6),
    "unit" "fetch_window_unit" NOT NULL,
    "depth" INTEGER NOT NULL DEFAULT 0,
    "page_start" INTEGER NOT NULL DEFAULT 1,
    "next_page_to_fetch" INTEGER NOT NULL DEFAULT 1,
    "pages_fetched" INTEGER NOT NULL DEFAULT 0,
    "items_found" BIGINT NOT NULL DEFAULT 0,
    "unique_items_added" BIGINT NOT NULL DEFAULT 0,
    "duplicate_items_found" BIGINT NOT NULL DEFAULT 0,
    "reached_provider_cap" BOOLEAN NOT NULL DEFAULT false,
    "has_more_at_end" BOOLEAN,
    "reported_total_in_window" INTEGER,
    "error_json" JSONB,
    "started_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "fetch_windows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fetch_page_attempts" (
    "id" UUID NOT NULL,
    "fetch_window_id" UUID NOT NULL,
    "fetch_job_id" UUID NOT NULL,
    "page_number" INTEGER NOT NULL,
    "limit" INTEGER NOT NULL,
    "request_params_json" JSONB NOT NULL,
    "status" "fetch_page_attempt_status" NOT NULL DEFAULT 'PENDING',
    "items_returned" INTEGER NOT NULL DEFAULT 0,
    "unique_items_added" INTEGER NOT NULL DEFAULT 0,
    "duplicate_items_found" INTEGER NOT NULL DEFAULT 0,
    "has_more" BOOLEAN NOT NULL DEFAULT false,
    "provider_error_code" TEXT,
    "error_json" JSONB,
    "requested_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(6),

    CONSTRAINT "fetch_page_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "source_catalog_snapshots" (
    "id" UUID NOT NULL,
    "source_id" UUID NOT NULL,
    "platform" TEXT NOT NULL,
    "reported_total_from_api" INTEGER,
    "reported_total_field_name" TEXT,
    "reported_total_raw_json" JSONB,
    "collected_unique_videos" BIGINT NOT NULL DEFAULT 0,
    "estimated_remaining_videos" BIGINT,
    "coverage_percent" DECIMAL(6,2),
    "coverage_status" "coverage_status" NOT NULL DEFAULT 'UNKNOWN',
    "coverage_confidence" "coverage_confidence" NOT NULL DEFAULT 'UNKNOWN',
    "capped_window_count" INTEGER NOT NULL DEFAULT 0,
    "failed_window_count" INTEGER NOT NULL DEFAULT 0,
    "completed_window_count" INTEGER NOT NULL DEFAULT 0,
    "pending_window_count" INTEGER NOT NULL DEFAULT 0,
    "last_checked_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "source_catalog_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fetch_job_events" (
    "id" UUID NOT NULL,
    "fetch_job_id" UUID NOT NULL,
    "event_type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data_json" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fetch_job_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "video_sources_platform_source_type_idx" ON "video_sources"("platform", "source_type");

-- CreateIndex
CREATE INDEX "video_sources_handle_idx" ON "video_sources"("handle");

-- CreateIndex
CREATE INDEX "video_sources_username_idx" ON "video_sources"("username");

-- CreateIndex
CREATE UNIQUE INDEX "video_sources_platform_external_source_id_source_type_key" ON "video_sources"("platform", "external_source_id", "source_type");

-- CreateIndex
CREATE INDEX "videos_source_id_published_at_idx" ON "videos"("source_id", "published_at");

-- CreateIndex
CREATE INDEX "videos_platform_published_at_idx" ON "videos"("platform", "published_at");

-- CreateIndex
CREATE INDEX "videos_owner_id_idx" ON "videos"("owner_id");

-- CreateIndex
CREATE INDEX "videos_channel_id_idx" ON "videos"("channel_id");

-- CreateIndex
CREATE UNIQUE INDEX "videos_platform_platform_video_id_key" ON "videos"("platform", "platform_video_id");

-- CreateIndex
CREATE INDEX "collections_owner_id_idx" ON "collections"("owner_id");

-- CreateIndex
CREATE INDEX "saved_videos_video_id_idx" ON "saved_videos"("video_id");

-- CreateIndex
CREATE INDEX "saved_videos_collection_id_idx" ON "saved_videos"("collection_id");

-- CreateIndex
CREATE UNIQUE INDEX "saved_videos_owner_id_video_id_collection_id_key" ON "saved_videos"("owner_id", "video_id", "collection_id");

-- CreateIndex
CREATE INDEX "manifests_source_id_status_updated_at_idx" ON "manifests"("source_id", "status", "updated_at");

-- CreateIndex
CREATE INDEX "manifests_status_expires_at_idx" ON "manifests"("status", "expires_at");

-- CreateIndex
CREATE INDEX "manifests_manifest_type_persistence_type_idx" ON "manifests"("manifest_type", "persistence_type");

-- CreateIndex
CREATE INDEX "manifest_items_manifest_id_position_idx" ON "manifest_items"("manifest_id", "position");

-- CreateIndex
CREATE INDEX "manifest_items_video_id_idx" ON "manifest_items"("video_id");

-- CreateIndex
CREATE INDEX "manifest_items_fetch_window_id_idx" ON "manifest_items"("fetch_window_id");

-- CreateIndex
CREATE UNIQUE INDEX "manifest_items_manifest_id_video_id_key" ON "manifest_items"("manifest_id", "video_id");

-- CreateIndex
CREATE INDEX "fetch_jobs_source_id_status_updated_at_idx" ON "fetch_jobs"("source_id", "status", "updated_at");

-- CreateIndex
CREATE INDEX "fetch_jobs_status_expires_at_idx" ON "fetch_jobs"("status", "expires_at");

-- CreateIndex
CREATE INDEX "fetch_jobs_fetch_profile_idx" ON "fetch_jobs"("fetch_profile");

-- CreateIndex
CREATE INDEX "fetch_jobs_manifest_id_idx" ON "fetch_jobs"("manifest_id");

-- CreateIndex
CREATE INDEX "fetch_windows_fetch_job_id_status_window_start_window_end_idx" ON "fetch_windows"("fetch_job_id", "status", "window_start", "window_end");

-- CreateIndex
CREATE INDEX "fetch_windows_source_id_status_window_start_idx" ON "fetch_windows"("source_id", "status", "window_start");

-- CreateIndex
CREATE INDEX "fetch_windows_parent_window_id_idx" ON "fetch_windows"("parent_window_id");

-- CreateIndex
CREATE INDEX "fetch_page_attempts_fetch_job_id_fetch_window_id_page_numbe_idx" ON "fetch_page_attempts"("fetch_job_id", "fetch_window_id", "page_number");

-- CreateIndex
CREATE INDEX "fetch_page_attempts_fetch_window_id_status_idx" ON "fetch_page_attempts"("fetch_window_id", "status");

-- CreateIndex
CREATE INDEX "source_catalog_snapshots_source_id_last_checked_at_idx" ON "source_catalog_snapshots"("source_id", "last_checked_at");

-- CreateIndex
CREATE INDEX "source_catalog_snapshots_coverage_status_idx" ON "source_catalog_snapshots"("coverage_status");

-- CreateIndex
CREATE INDEX "fetch_job_events_fetch_job_id_created_at_idx" ON "fetch_job_events"("fetch_job_id", "created_at");

-- AddForeignKey
ALTER TABLE "videos" ADD CONSTRAINT "videos_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "video_sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_videos" ADD CONSTRAINT "saved_videos_video_id_fkey" FOREIGN KEY ("video_id") REFERENCES "videos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_videos" ADD CONSTRAINT "saved_videos_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "collections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manifests" ADD CONSTRAINT "manifests_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "video_sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manifest_items" ADD CONSTRAINT "manifest_items_manifest_id_fkey" FOREIGN KEY ("manifest_id") REFERENCES "manifests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manifest_items" ADD CONSTRAINT "manifest_items_video_id_fkey" FOREIGN KEY ("video_id") REFERENCES "videos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manifest_items" ADD CONSTRAINT "manifest_items_fetch_window_id_fkey" FOREIGN KEY ("fetch_window_id") REFERENCES "fetch_windows"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fetch_jobs" ADD CONSTRAINT "fetch_jobs_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "video_sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fetch_jobs" ADD CONSTRAINT "fetch_jobs_manifest_id_fkey" FOREIGN KEY ("manifest_id") REFERENCES "manifests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fetch_windows" ADD CONSTRAINT "fetch_windows_fetch_job_id_fkey" FOREIGN KEY ("fetch_job_id") REFERENCES "fetch_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fetch_windows" ADD CONSTRAINT "fetch_windows_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "video_sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fetch_windows" ADD CONSTRAINT "fetch_windows_parent_window_id_fkey" FOREIGN KEY ("parent_window_id") REFERENCES "fetch_windows"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fetch_page_attempts" ADD CONSTRAINT "fetch_page_attempts_fetch_window_id_fkey" FOREIGN KEY ("fetch_window_id") REFERENCES "fetch_windows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fetch_page_attempts" ADD CONSTRAINT "fetch_page_attempts_fetch_job_id_fkey" FOREIGN KEY ("fetch_job_id") REFERENCES "fetch_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_catalog_snapshots" ADD CONSTRAINT "source_catalog_snapshots_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "video_sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fetch_job_events" ADD CONSTRAINT "fetch_job_events_fetch_job_id_fkey" FOREIGN KEY ("fetch_job_id") REFERENCES "fetch_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- EnableRLS
-- Supabase can expose tables in the public schema through the Data API depending
-- on project settings. These tables are intended to be accessed through
-- server-side Prisma routes first, so RLS is enabled without broad public
-- policies. Future authenticated library flows should add owner-scoped policies
-- deliberately instead of relying on application-only filtering.
ALTER TABLE "video_sources" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "videos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "collections" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "saved_videos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "manifests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "manifest_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "fetch_jobs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "fetch_windows" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "fetch_page_attempts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "source_catalog_snapshots" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "fetch_job_events" ENABLE ROW LEVEL SECURITY;
