import { Page } from 'puppeteer'

export interface EcommerceBot<T> {
  initialize: () => Promise<void>
  search: (searchTerm: string) => Promise<void>
  extractSinglePage: (page: Page) => Promise<unknown[]>
  persistItems: (items: T[]) => Promise<void>
  close: () => Promise<void>
}
