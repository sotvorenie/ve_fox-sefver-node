/*
  Warnings:

  - A unique constraint covering the columns `[user_id,video_id]` on the table `histories` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id,video_id]` on the table `likes` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id,video_id]` on the table `saved_times` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id,video_id]` on the table `watch_laters` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE INDEX "comments_user_id_idx" ON "comments"("user_id");

-- CreateIndex
CREATE INDEX "comments_video_id_idx" ON "comments"("video_id");

-- CreateIndex
CREATE INDEX "comments_parent_id_idx" ON "comments"("parent_id");

-- CreateIndex
CREATE INDEX "histories_user_id_idx" ON "histories"("user_id");

-- CreateIndex
CREATE INDEX "histories_video_id_idx" ON "histories"("video_id");

-- CreateIndex
CREATE UNIQUE INDEX "histories_user_id_video_id_key" ON "histories"("user_id", "video_id");

-- CreateIndex
CREATE INDEX "likes_user_id_idx" ON "likes"("user_id");

-- CreateIndex
CREATE INDEX "likes_video_id_idx" ON "likes"("video_id");

-- CreateIndex
CREATE UNIQUE INDEX "likes_user_id_video_id_key" ON "likes"("user_id", "video_id");

-- CreateIndex
CREATE INDEX "saved_times_user_id_idx" ON "saved_times"("user_id");

-- CreateIndex
CREATE INDEX "saved_times_video_id_idx" ON "saved_times"("video_id");

-- CreateIndex
CREATE UNIQUE INDEX "saved_times_user_id_video_id_key" ON "saved_times"("user_id", "video_id");

-- CreateIndex
CREATE INDEX "videos_channel_id_idx" ON "videos"("channel_id");

-- CreateIndex
CREATE INDEX "videos_section_id_idx" ON "videos"("section_id");

-- CreateIndex
CREATE INDEX "idx_video_tags" ON "videos" USING GIN ("tags");

-- CreateIndex
CREATE INDEX "watch_laters_user_id_idx" ON "watch_laters"("user_id");

-- CreateIndex
CREATE INDEX "watch_laters_video_id_idx" ON "watch_laters"("video_id");

-- CreateIndex
CREATE UNIQUE INDEX "watch_laters_user_id_video_id_key" ON "watch_laters"("user_id", "video_id");
