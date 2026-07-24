export class AppError extends Error {
    status: number
    detail: string

    constructor(status: number, detail: string) {
        super(detail);
        this.status = status;
        this.detail = detail;
        this.name = 'AppError';
    }
}
export const HttpError = (status: number, detail: string) => {
    return new AppError(status, detail)
}

// база данных
export const dbException = HttpError(500, "Ошибка БД");

// авторизация и токен
export const jwtException = HttpError(401, "Не удалось валидировать токен");
export const registrationException = HttpError(409, "Пользователь с таким логином уже существует");
export const authException = HttpError(401, "Неверное имя или пароль");

// редактирование данных пользователя
export const emptyUserDataException = HttpError(400, "Неверные данные пользователя");
export const duplicationPasswordException = HttpError(400, "Новый пароль должен отличаться от текущего");

// канала и его плейлисты
export const channelException = HttpError(404, "Канал не найден");
export const sectionException = HttpError(400, "Данный плейлист не принадлежит каналу");
export const duplicationSectionException = HttpError(400, "Плейлист с таким названием уже существует");

// видео
export const videoException = HttpError(404, "Видео не найдено");

// загрузка видео и фото
export const uploadedVideoException = HttpError(400, "Данные видео некорректны");
export const videoFormatException = HttpError(400, "Неподдерживаемый формат видео");
export const photoFormatException = HttpError(400, "Неподдерживаемый формат фото");

// комментарии
export const noCommentException = HttpError(404, "Комментарий не найден");
export const notMyCommentException = HttpError(403, "Вы не можете редактировать чужой комментарий");