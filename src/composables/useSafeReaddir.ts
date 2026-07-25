// безопасное открытие папки

import fs from 'node:fs/promises';

export const safeReaddir = async (path: string) => {
    try {
        return await fs.readdir(path, {withFileTypes: true})
    } catch (err) {
        console.error(err)
        return []
    }
}