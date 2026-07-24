import path from "node:path";
import {db} from "./db.js";

import {VIDEOS_DIRECTORY, ALLOWED_PHOTO_SUFFIX, ALLOWED_VIDEO_SUFFIX} from "./config.js";
import {createUrl} from "./composables/useCreateUrl.js";
import {safeReaddir} from "./composables/useSafeReaddir.js";
import {getTagsByTitle} from "./composables/useGetTagsByTitle.js";
import {getVideoDuration} from "./composables/useGetVideoDuration.js";

export class DataSynchronizer {
    private channelsFromDB = new Map<string, { id: number; url: string; name: string }>()
    private videosFromDB = new Map<string, { id: number; url: string; name: string }>()

    private readonly actualChannels = new Set<string>()
    private readonly actualVideos = new Set<string>()

    private async loadDataFromDB(): Promise<void> {
        const channels = await db.channel.findMany({
            select: {
                id: true,
                url: true,
                name: true,
            }
        })
        this.channelsFromDB = new Map(channels.map(c => [c.url, c]))

        const videos = await db.video.findMany({
            select: {
                id: true,
                url: true,
                name: true,
            }
        })
        this.videosFromDB = new Map(videos.map(v => [v.url, v]))

        this.actualChannels.clear()
        this.actualVideos.clear()
    }

    private async syncChannels(): Promise<void> {
        const channels = await safeReaddir(VIDEOS_DIRECTORY)

        for (const channel of channels) {
            if (!channel.isDirectory()) continue

            const channelName: string = channel.name
            const channelPath = path.join(VIDEOS_DIRECTORY, channelName)
            const channelUrl: string = createUrl(channelPath)

            const channelAvatarFile = await this.findFile(channelPath, false)
            const channelAvatarUrl = channelAvatarFile ? createUrl(channelAvatarFile) : null

            const channelTags: string[] = getTagsByTitle(channelName)

            let dbChannel = this.channelsFromDB.get(channelUrl)
            let channelId: number
            if (dbChannel) {
                await db.channel.update({
                    where: {
                        url: channelUrl,
                    },
                    data: {
                        name: channelName,
                        tags: channelTags,
                        avatarUrl: channelAvatarUrl,
                    }
                })
                channelId = dbChannel.id
                console.log(`Обновлена информация о канале: ${channelName}`)
            } else {
                const newChannel = await db.channel.create({
                    data: {
                        name: channelName,
                        url: channelUrl,
                        avatarUrl: channelAvatarUrl,
                        tags: channelTags,
                    }
                })
                channelId = newChannel.id
                console.log(`Добавлен новый канал: ${channelName}`)
            }

            this.actualChannels.add(channelUrl)

            await this.syncVideos(channelPath, channelId)
        }
    }

    private async syncVideos(channelPath: string, channelId: number): Promise<void> {
        const videosPath: string = path.join(channelPath, 'videos')
        const previewsPath: string = path.join(channelPath, 'previews')

        const videos = await safeReaddir(videosPath)

        for (const video of videos) {
            if (video.isDirectory()) continue

            const videoName: string = video.name
            const videoPath: string = path.join(videosPath, videoName)
            const videoUrl: string = createUrl(videoPath)

            const videoPreviewFile = await this.findFile(previewsPath, false, videoName)
            const videoPreviewUrl = videoPreviewFile ? createUrl(videoPreviewFile) : null

            const videoTags: string[] = getTagsByTitle(videoName)

            let dbVideo = this.videosFromDB.get(videoUrl)
            if (dbVideo) {
                await db.video.update({
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
                await db.video.create({
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

    private async deleteUnused(): Promise<void> {
        await db.channel.deleteMany({
            where: {url: {notIn: Array.from(this.actualChannels)}}
        })
        await db.video.deleteMany({
            where: {url: {notIn: Array.from(this.actualVideos)}}
        })
    }

    private async findFile(dir: string, isVideo: boolean = true, name?: string): Promise<string | null> {
        const files = await safeReaddir(dir)
        const found = files.find(f => {
            const suffix = path.extname(f.name).toLowerCase()
            const isValidType = isVideo ? ALLOWED_VIDEO_SUFFIX.has(suffix) : ALLOWED_PHOTO_SUFFIX.has(suffix)
            if (!isValidType) return false

            if (name) return path.parse(f.name).name === path.parse(name).name
            return true
        })
        return found ? path.join(dir, found.name) : null
    }

    async sync(): Promise<void> {
        console.log('Синхронизация данных..')

        await this.loadDataFromDB()
        await this.syncChannels()
        await this.deleteUnused()

        console.log('Синхронизация прошла успешно!!')
    }
}