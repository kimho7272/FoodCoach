export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    updated_at: string | null
                    username: string | null
                    full_name: string | null
                    avatar_url: string | null
                    website: string | null
                    nickname: string | null
                    height: number | null
                    weight: number | null
                    target_calories: number | null
                    phone: string | null
                    last_active_at: string | null
                }
                Insert: {
                    id: string
                    updated_at?: string | null
                    username?: string | null
                    full_name?: string | null
                    avatar_url?: string | null
                    website?: string | null
                    nickname?: string | null
                    height?: number | null
                    weight?: number | null
                    target_calories?: number | null
                    phone?: string | null
                    last_active_at?: string | null
                }
                Update: {
                    id?: string
                    updated_at?: string | null
                    username?: string | null
                    full_name?: string | null
                    avatar_url?: string | null
                    website?: string | null
                    nickname?: string | null
                    height?: number | null
                    weight?: number | null
                    target_calories?: number | null
                    phone?: string | null
                    last_active_at?: string | null
                }
            }
            friendships: {
                Row: {
                    id: string
                    user_id_1: string
                    user_id_2: string
                    status: 'pending' | 'accepted' | 'blocked'
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id_1: string
                    user_id_2: string
                    status?: 'pending' | 'accepted' | 'blocked'
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id_1?: string
                    user_id_2?: string
                    status?: 'pending' | 'accepted' | 'blocked'
                    created_at?: string
                }
            }
            food_logs: {
                Row: {
                    id: string
                    created_at: string
                    user_id: string
                    food_name: string
                    calories: number
                    protein: number
                    fat: number
                    carbs: number
                    image_url: string | null
                    meal_type: string
                    health_score: number
                    description: string | null
                }
                Insert: {
                    id?: string
                    created_at?: string
                    user_id: string
                    food_name: string
                    calories: number
                    protein: number
                    fat: number
                    carbs: number
                    image_url?: string | null
                    meal_type: string
                    health_score?: number
                    description?: string | null
                }
                Update: {
                    id?: string
                    created_at?: string
                    user_id?: string
                    food_name?: string
                    calories?: number
                    protein?: number
                    fat?: number
                    carbs?: number
                    image_url?: string | null
                    meal_type?: string
                    health_score?: number
                    description?: string | null
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
    }
}
