import {createUrl} from "@composables/useCreateUrl.js";

export const videoConstants = {
    previewPath: (path: string) => {
        return {
            previewPath: createUrl(path)
        }
    },
    previewUrl: (url: string) => {
        return {
            previewUrl: url
        }
    },
    views: (views: number) => {
        return {
            viewsCount: views,
        }
    },
    name: (name: string) => {
        return {
            name
        }
    },
    channel: (channelId: number) => {
        return {
            channelId
        }
    },
    section: (sectionId: number) => {
        return {
            sectionId
        }
    },
    sectionIndex: (sectionIndex: number) => {
        return {
            sectionIndex
        }
    },
}