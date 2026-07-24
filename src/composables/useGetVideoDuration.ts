// получаем длительность видео

import ffmpeg from 'fluent-ffmpeg';
import ffprobeStatic from 'ffprobe-static';

ffmpeg.setFfprobePath(ffprobeStatic.path);

export const getVideoDuration = async (videoPath: string): Promise<number> => {
    return new Promise((resolve) => {
        ffmpeg.ffprobe(videoPath, (err, metadata) => {
            if (err) {
                console.error(`Не удалось прочитать длительность видео ${videoPath}:`, err.message)
                resolve(0)
                return
            }
            const duration = metadata.format.duration ? Math.ceil(metadata.format.duration) : 0

            resolve(duration)
        })
    })
}