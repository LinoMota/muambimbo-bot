
export interface botRepository {
  persist(items: unknown[]): Promise<void>
}
