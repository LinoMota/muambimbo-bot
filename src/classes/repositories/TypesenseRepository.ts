import * as typesense from 'typesense'

import { botRepository } from '../interfaces/BotRepository'
import { inject, injectable, registry } from 'tsyringe'
import { TypesenseClient } from '../factories/TypesenseClient'

@injectable()
@registry([
  {
    token: 'TypesenseClient',
    useFactory: TypesenseClient,
  },
])
export class TypesenseRepository implements botRepository {
  constructor(@inject('TypesenseClient') private client: typesense.Client) {
    console.log('TypesenseRepository created')
  }

  async persist(items: unknown[]): Promise<void> {
    try {
      if (Array.isArray(items) && items.length > 0) {
        await Promise.all(
          items.map((item) => {
            return this.client
              .collections('produtos')
              .documents()
              .create(item as object)
          }),
        )
        console.log('all persisted in typesense !!!')
      } else {
        console.log('items is not in the expected format.')
      }
    } catch (e) {
      console.log('vixi')
      console.error(e)
    }
  }
}
