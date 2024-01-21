import puppeteer, { ElementHandle } from 'puppeteer'
import kabumMapping from '../mapping/kabum'
import { Item } from '../types/kabum'
import { persistItemArray } from '../typesense/cli'

const formatSearchTerm = (term: string) => term.replace(' ', '-')

// TODO
// identificar promocoes
// buscar os 200 primeiros produtos(ta buscando os primeiros 100 por enquanto)
// adicionar valor parcelado dos produtos
// filtrar validos

export async function main(term: string) {
  const browser = await puppeteer.launch({
    headless: 'new',
    ignoreHTTPSErrors: true,
    args: [`--window-size=${1000},${1000}`],
    defaultViewport: {
      width: 1000,
      height: 10000,
    },
  })
  const pageList = await browser.pages()
  const page = pageList[0]

  // monta uma string com o termo por enquanto monta query por relevancia de mais buscados
  const numItensPages = 100
  const urlPrefix = `?page_number=1&page_size=${numItensPages}&facet_filters=&sort=most_searched`
  const termSearchUrl = `${kabumMapping.search.baseURL}${formatSearchTerm(
    term,
  )}${urlPrefix}`

  console.log(`consultando a ulr -> ${termSearchUrl}`)

  // realiza a busca
  await page.goto(termSearchUrl, { waitUntil: 'domcontentloaded' })

  //coleta dados do cabecalho
  const resultNumsElm = await page.$(kabumMapping.search.resultDataElm)
  const resultNums = (await resultNumsElm?.evaluate(
    (el) => el.textContent,
  )) as string

  console.log(`Produtos encontrados: ${resultNums}`)

  const promisesItems = await (
    await page.$$(kabumMapping.search.resultItem.ItemContainerElm)
  ).map((itemElm) => new Promise((resolve) => resolve(itemExtractor(itemElm))))

  const dados: Item[] = await Promise.all(promisesItems) as Item[]
  console.log(`Foram minerados com sucesso ${dados.length}`)
  console.log(dados)

  await browser.close()

  // alimentando o typesense
  await persistItemArray(dados)

  return dados
}

const priceTransformation = (stringPreco: string): number =>
  parseFloat(stringPreco.replace('R$', '').replace('.', '').replace(',', '.'))

const itemExtractor = async (itemElm: ElementHandle): Promise<Item> => {
  const {
    coverImgElm,
    nameElm,
    priceElm,
    alinkElm,
    availableElm,
    unavailableElm,
  } = kabumMapping.search.resultItem

  const img = decodeURIComponent(
    (await (
      await itemElm.$(coverImgElm)
    )?.evaluate((el) => el.getAttribute('src'))) as string,
  )
  const nome = decodeURIComponent(
    (await (
      await itemElm.$(nameElm)
    )?.evaluate((el) => el.textContent)) as string,
  )
  const url = (kabumMapping.url +
    (await (
      await itemElm.$(alinkElm)
    )?.evaluate((el) => el.getAttribute('href')))) as string

  const preco = (await (
    await itemElm.$(priceElm)
  )?.evaluate((el) => el.textContent)) as string

  const disponivel = (await (
    await itemElm.$(availableElm)
  )?.evaluate((el) => el.textContent)) as string

  const indisponivel = await itemElm.$(unavailableElm)

  if (!indisponivel && disponivel === 'COMPRAR') {
    return {
      nome,
      img,
      url,
      loja: 'kabum',
      avista: priceTransformation(preco),
      parcelado: {},
      promocao: false,
      datMinerado: BigInt(new Date().getTime()).toString(),
      valido: true,
    }
  }

  return {
    nome,
    img,
    url,
    loja: 'kabum',
    avista: 0,
    parcelado: {},
    promocao: false,
    datMinerado: BigInt(new Date().getTime()).toString(),
    valido: false,
  }
}
