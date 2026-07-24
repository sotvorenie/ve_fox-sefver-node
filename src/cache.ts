import path from "node:path";
import {db} from "./db.js";

import {VIDEOS_DIRECTORY, ALLOWED_PHOTO_SUFFIX, ALLOWED_VIDEO_SUFFIX} from "./config.js";
import {createUrl} from "./composables/useCreateUrl.js";
import {safeReaddir} from "./composables/useSafeReaddir.js";
import {getTagsByTitle} from "./composables/useGetTagsByTitle.js";
import {getVideoDuration} from "./composables/useGetVideoDuration.js";

export class DataSynchronizer {
    private readonly actualChannels = new Set<string>()
    private readonly actualVideos = new Set<string>()

    private async syncChannels(): Promise<void> {
        const channels = await safeReaddir(VIDEOS_DIRECTORY)

        for (const channel of channels) {
            if (!channel.isDirectory()) continue

            const channelName: string = channel.name
            const channelPath = path.join(VIDEOS_DIRECTORY, channelName)
            const channelUrl: string = createUrl(channelPath)

            const channelAvatarFile = await this.findFile(channelPath)
            const channelAvatarUrl = channelAvatarFile ? createUrl(channelAvatarFile) : null

            const channelTags: string[] = getTagsByTitle(channelName)

            let dbChannel = await db.channel.findUnique({
                where: {
                    url: channelUrl,
                }
            })
            if (dbChannel) {
                dbChannel = await db.channel.update({
                    where: {
                        url: channelUrl,
                    },
                    data: {
                        name: channelName,
                        tags: channelTags,
                        avatarUrl: channelAvatarUrl,
                    }
                })
                console.log(`Обновлена информация о канале: ${channelName}`)
            } else {
                dbChannel = await db.channel.create({
                    data: {
                        name: channelName,
                        url: channelUrl,
                        avatarUrl: channelAvatarUrl,
                        tags: channelTags,
                    }
                })
                console.log(`Обновлен новый канал: ${channelName}`)
            }

            this.actualChannels.add(channelUrl)

            await this.syncVideos(channelPath, dbChannel.id)
        }
    }

    private async syncVideos(channelPath: string, channelId: number): Promise<void> {
        const videos = await safeReaddir(channelPath)

        for (const video of videos) {
            if (!video.isDirectory()) continue

            const videoName: string = video.name
            const videoPath: string = path.join(channelPath, videoName)
            const videoUrl: string = createUrl(videoPath)

            const videoPreviewFile = await this.findFile(videoPath, false)
            const videoPreviewUrl = videoPreviewFile ? createUrl(videoPreviewFile) : null

            const videoTags: string[] = getTagsByTitle(videoName)

            let dbVideo = await db.video.findUnique({
                where: {
                    url: videoUrl,
                }
            })
            if (dbVideo) {
                dbVideo = await db.video.update({
                    where: {
                        url: videoUrl,
                    },
                    data: {
                        name: videoName,
                        tags: videoTags,
                        previewUrl: videoPreviewUrl,
                    }
                })
                console.log(`Обновлена информация о видео: ${videoName}`)
            } else {
                dbVideo = await db.video.create({
                    data: {
                        name: videoName,
                        url: videoUrl,
                        duration: await getVideoDuration(videoPath),
                        tags: videoTags,
                        viewsCount: 0,
                        likesCount: 0,
                        previewUrl: videoPreviewUrl,
                        channelId: channelId,
                    }
                })
                console.log(`Добавлено новое видео: ${videoName}`)
            }

            this.actualVideos.add(videoUrl)
        }
    }

    private async deleteUnused() {
        await db.channel.deleteMany({
            where: {url: {notIn: Array.from(this.actualChannels)}}
        })
        await db.video.deleteMany({
            where: {url: {notIn: Array.from(this.actualVideos)}}
        })
    }

    private async findFile(dir: string, isVideo: boolean = true): Promise<string | null> {
        const files = await safeReaddir(dir)
        const found = files.find(f => {
            const suffix = path.extname(f.name).toLowerCase()
            return isVideo ?  ALLOWED_VIDEO_SUFFIX.has(suffix) : ALLOWED_PHOTO_SUFFIX.has(suffix)
        })
        return found ? path.join(dir, found.name) : null
    }

    async sync(): Promise<void> {
        await this.syncChannels()
        await this.deleteUnused()
    }
}