export const videoForListSelect = (currentUserId?: number) => ({
    id: true,
    name: true,
    createdAt: true,
    duration: true,
    viewsCount: true,
    url: true,
    previewUrl: true,
    channel: {
        select: {
            id: true,
            name: true,
            avatarUrl: true,
        }
    },
    savedTimes: {
        where: {
            userId: currentUserId ?? -1,
        },
        select: {
            time: true,
        }
    }
})