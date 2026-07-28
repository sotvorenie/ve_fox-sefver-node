export interface User {
    id: number
    name: string
    login: string
    password: string
    avatar_url?: string | null
    router_map?: string | null
    search_history?: string | null
}

declare global {
    namespace Express {
        interface Request {
            user?: User
        }
    }
}