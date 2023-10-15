import { main as rotinaTerabyte } from './bot/terabyteTest'
import { main as rotinaKabum } from './bot/kabumTest'
import { main as rotinaOlx } from './bot/olxTest'

const exec = async () => {
  // eslint-disable-next-line @typescript-eslint/ban-types
  const rotinas: Map<string, Function> = new Map()

  rotinas.set('kabum', rotinaKabum)
  rotinas.set('terabyte', rotinaTerabyte)
  rotinas.set('olx', rotinaOlx)

  const nomeRotina = process.argv[2]
  const termo = process.argv[3]

  if (!termo) throw new Error('Preciso do nome da rotina para buscar')
  if (!nomeRotina) throw new Error('Preciso de um termo para buscar')

  console.log('pegando do argv')
  console.log(`Vou buscar o termo ${termo} na ${nomeRotina}`)

  if (!rotinas.has(nomeRotina)) {
    throw new Error('Preciso de uma rotina valida tenho [kabum, olx, terabyte]')
  }

  (await rotinas.get(nomeRotina)?.call(this, termo))
}

exec()
