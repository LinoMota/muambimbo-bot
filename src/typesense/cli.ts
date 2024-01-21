import * as typesense from 'typesense'
import { Item as olxItem } from '../types/olx'
import { Item as kabumItem } from '../types/kabum'
import { Item as terabyteItem } from '../types/terabyte'

type mergedItemType = olxItem | kabumItem | terabyteItem

export const persistItemArray = async (itens: mergedItemType[]) => {
  try {
    const cli = typesenseCliFactory()
    if (Array.isArray(itens) && itens.length > 0) {
      await Promise.all(
        itens.map((item) => {
          return cli.collections('produtos').documents().create(item)
        }),
      )
      console.log('Produtos persistidos !!!')
    } else {
      console.log('itens is not in the expected format.')
    }
  } catch (e) {
    console.log('Deu ruim')
    console.error(e)
  }
}

export const typesenseCliFactory = (): typesense.Client => {
  return new typesense.Client({
    nodes: [
      {
        host: 'localhost',
        port: 8108,
        protocol: 'http',
      },
    ],
    logLevel: 'debug',
    apiKey: 'showzeraboladera',
    connectionTimeoutSeconds: 2,
  })
}
