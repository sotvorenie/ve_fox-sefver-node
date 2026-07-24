import 'dotenv/config'
import path from "node:path";

export const BASE_STORAGE_DIR = path.resolve(process.env.BASE_STORAGE_DIR as string)
export const VIDEOS_DIRECTORY = path.join(BASE_STORAGE_DIR, 'videos')
export const AVATARS_DIRECTORY = path.join(BASE_STORAGE_DIR, 'users_avatars')

export const ALLOWED_VIDEO_SUFFIX = new Set(['.mp4', '.mkv', '.avi', '.mov'])
export const ALLOWED_PHOTO_SUFFIX = new Set(['.jpg', '.jpeg', '.png', '.webp'])