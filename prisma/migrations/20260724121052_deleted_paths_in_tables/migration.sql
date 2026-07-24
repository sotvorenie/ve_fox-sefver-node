/*
  Warnings:

  - You are about to drop the column `path` on the `channels` table. All the data in the column will be lost.
  - You are about to drop the column `path` on the `videos` table. All the data in the column will be lost.
  - You are about to drop the column `video_url` on the `videos` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[url]` on the table `channels` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[url]` on the table `videos` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `url` to the `channels` table without a default value. This is not possible if the table is not empty.
  - Added the required column `url` to the `videos` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "channels_path_key";

-- DropIndex
DROP INDEX "videos_path_key";

-- DropIndex
DROP INDEX "videos_video_url_key";

-- AlterTable
ALTER TABLE "channels" DROP COLUMN "path",
ADD COLUMN     "url" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "videos" DROP COLUMN "path",
DROP COLUMN "video_url",
ADD COLUMN     "url" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "channels_url_key" ON "channels"("url");

-- CreateIndex
CREATE UNIQUE INDEX "videos_url_key" ON "videos"("url");
