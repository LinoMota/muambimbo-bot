import { typesenseCliFactory } from './cli'

// import { Item as olxItem } from '../types/olx'
// import { Item as kabumItem } from '../types/kabum'
// import { Item as terabyteItem } from '../types/terabyte'
// nome: '',
// regiao: '',
// img: '',
// url: '',
// loja: '',
// avista: 0,
// parcelado: {
//   vezes: 0,
//   parcela: 0,
// },
// promocao: false,
// datAnunciado: new Date(),
// datMinerado: new Date(),
// valido: false,

const schema = {
  name: 'produtos',
  fields: [
    { name: 'nome', type: 'string', index: true },
    { name: 'regiao', type: 'auto' },
    { name: 'img', type: 'auto' },
    { name: 'url', type: 'auto' },
    { name: 'loja', type: 'auto' },
    { name: 'avista', type: 'float' },
    { name: 'promocao', type: 'bool' },
    { name: 'valido', type: 'bool' },
    { name: 'parcelado', type: 'auto' },
    { name: 'datAnunciado', type: 'int64' },
    { name: 'datMinerado', type: 'int64' },
  ],
  enable_nested_fields: true,
  default_sorting_field: 'avista',
}

const createCollection = async () => {
  try {
    // @ts-ignore
    await typesenseCliFactory().collections().create(schema)
    console.log(`Colecao criada !!`)
  } catch (e) {
    console.error(`Falhou ao criar colecao`)
    console.log(e)
  }
}

;(async () => {
  await createCollection()
})()
