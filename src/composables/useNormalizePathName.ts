// убираем из названия видео запрещенные в Windows символы (при upload видеороликов)

export const normalizePathName = (name: string) => {
    if (!name) return ""
    return name.replaceAll(/[\\/:*?"<>|]+/g, '_')
}