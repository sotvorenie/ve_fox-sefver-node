import path from "node:path";
import fs from "node:fs/promises";

import {BASE_STORAGE_DIR} from "@/config.js";

export const deleteFile = async (url: any) => {
    if (!url) return
    const formattedUrl = url.replace('/static', '')
    const filePath = path.join(BASE_STORAGE_DIR, formattedUrl)

    try {
        await fs.unlink(filePath)
    } catch (err: any) {
        if (err.code === 'ENOENT') {
            console.log('Старый файл не найден, пропускаем удаление')
        } else {
            console.error('Ошибка при удалении файла:', err)
        }
    }
}