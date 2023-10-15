export type Item = {
  nome: string
  img: string
  url: string
  loja: string
  avista: number
  parcelado: {
    vezes: number
    parcela: number
  } | object
  promocao: boolean
  datMinerado: Date
  valido: boolean
}
