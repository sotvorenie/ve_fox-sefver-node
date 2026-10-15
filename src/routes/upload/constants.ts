import {ALLOWED_PHOTO_SUFFIX, ALLOWED_VIDEO_SUFFIX} from "@/config.js";

import {
    photoFormatException,
    uploadedPhotoException,
    uploadedVideoException,
    videoFormatException
} from "@utils/httpExceptions.js";

export interface UploadConstantType {
    title: string
    bdTitle: 'previewUrl' | 'url'
    allowedSuffix: Set<string>
    formatException: any
    uploadException: any
    dirName: string
    selectForDelete: Record<string, boolean>
    data: Function
}

interface UploadConstantTypesType {
    preview: UploadConstantType
    video: UploadConstantType
}

export const uploadConstantTypes: UploadConstantTypesType = {
    preview: {
        title: 'preview',
        bdTitle: 'previewUrl',
        allowedSuffix: ALLOWED_PHOTO_SUFFIX,
        formatException: photoFormatException,
        uploadException: uploadedPhotoException,
        dirName: 'previews',
        selectForDelete: {
            previewUrl: true,
        },
        data: (previewUrl: string) => ({
            previewUrl,
        })
    },
    video: {
        title: 'video',
        bdTitle: 'url',
        allowedSuffix: ALLOWED_VIDEO_SUFFIX,
        formatException: videoFormatException,
        uploadException: uploadedVideoException,
        dirName: 'videos',
        selectForDelete: {
            url: true,
        },
        data: (videoUrl: string) => ({
            url: videoUrl,
        })
    }
}