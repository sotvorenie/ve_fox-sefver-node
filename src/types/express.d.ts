export interface User {
    id: number
    name: string
    login: string
    password: string
    avatarUrl?: string | null
    routerMap?: string | null
    searchHistory?: string | null
}

declare global {
    namespace Express {
        interface Request {
            user?: User
        }
    }
}