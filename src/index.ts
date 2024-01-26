import 'reflect-metadata'
import { container } from 'tsyringe'
import { OlxBot, KabumBot, TerabyteBot } from './classes/bot'

const botResolver = (botName: string) => {
  switch (botName) {
    case 'olx':
      return container.resolve(OlxBot)
    case 'kabum':
      return container.resolve(KabumBot)
    case 'terabyte':
      return container.resolve(TerabyteBot)
    default:
      throw new Error('Bot não encontrado tente [olx, kabum]')
  }
}

const exec = async () => {
  const nomeRotina = process.argv[2]
  const termo = process.argv[3]

  if (!termo) throw new Error('Preciso do nome da rotina para buscar')
  if (!nomeRotina) throw new Error('Preciso de um termo para buscar')

  console.log('pegando do argv')
  console.log(`Vou buscar o termo ${termo} na ${nomeRotina}`)

  await botResolver(nomeRotina).search(termo)
  process.exit(0)
  
}

exec()
