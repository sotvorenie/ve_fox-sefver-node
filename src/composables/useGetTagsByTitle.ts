// получаем массив тегов из названия видео или канала

export const getTagsByTitle = (title: string) => {
    if (!title?.length) return []
    return title
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
        .trim()
        .split(/\s+/)
        .filter(Boolean)
}