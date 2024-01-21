export type RegiaoResultado = {
  regiao: string
  resultados: number
}

export type Item = {
  nome: string
  regiao: string
  img: string
  url: string
  loja: string
  avista: number
  parcelado: {
    vezes: number
    parcela: number
  } | object
  promocao: boolean
  datAnunciado: string
  datMinerado: string
  valido: boolean
}
