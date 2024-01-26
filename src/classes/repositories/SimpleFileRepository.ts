import { inject, injectable, registry } from 'tsyringe'
import { botRepository } from '../interfaces/BotRepository'
import fs from 'fs/promises'

@injectable()
@registry([
  {
    token: 'simpleFileRepositoryConfig',
    useFactory: () => {
      return {
        filename: 'nogueri.json',
      }
    },
  },
])
export class SimpleFileRepository implements botRepository {
  constructor(
    @inject('simpleFileRepositoryConfig') private config: { filename: string },
  ) {
    console.log('SimpleFileRepository created')
  }

  persist(items: unknown[]): Promise<void> {
    return fs.writeFile(this.config.filename, JSON.stringify(items))
  }
}
