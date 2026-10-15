
export const formateVideos = (videos: any) => {
    return videos.map((video: any) => ({
        ...video,
        savedTime: video.savedTimes?.[0]?.time ?? null,
        savedTimes: undefined
    }))
}