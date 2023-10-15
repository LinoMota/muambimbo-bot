import puppeteer, { ElementHandle } from 'puppeteer'
import terabyteMapping from '../mapping/terabyte'
import { Item } from '../types/terabyte'

const formatSearchTerm = (term: string) => term.replace(' ', '+')

// TODO
// identificar promocoes
// buscar os 200 primeiros produtos(ta buscando os primeiros 100 por enquanto)

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

  console.log(`termo = ${term}`)

  // monta uma string de busca
  const termSearchUrl = `${
    terabyteMapping.search.baseURL
  }?str=${formatSearchTerm(term)}`

  console.log(`consultando a ulr -> ${termSearchUrl}`)

  // realiza a busca
  await page.goto(termSearchUrl, { waitUntil: 'domcontentloaded' })

  const promisesItems = await (
    await page.$$(terabyteMapping.search.resultItem.ItemContainerElm)
  ).map((itemElm) => new Promise((resolve) => resolve(itemExtractor(itemElm) as unknown as Item)))

  let dados = (await Promise.all(promisesItems))
  dados = dados.filter(item => (item as Item).valido)
  console.log(`Foram minerados com sucesso ${dados.length}`)
  console.log(dados)

  await browser.close()

  return dados
}

const priceTransformation = (stringPreco: string): number => {
  try {
    return parseFloat(
      stringPreco.replace('R$', '').replace('.', '').replace(',', '.'),
    )
  } catch (e) {
    return 0
  }
}

const itemExtractor = async (itemElm: ElementHandle): Promise<Item> => {
  const {
    coverImgElm,
    nameElm,
    priceElm,
    alinkElm,
    unavailableElm,
    singleInstallmentElm,
  } = terabyteMapping.search.resultItem

  const indisponivel = await itemElm.$(unavailableElm)

  const img = (await (
    await itemElm.$(coverImgElm)
  )?.evaluate((el) => el.getAttribute('src'))) as string

  const nome = (await (
    await itemElm.$(nameElm)
  )?.evaluate((el) => el.textContent)) as string

  const url = (
    (await (
      await itemElm.$(alinkElm)
    )?.evaluate((el) => el.getAttribute('href')))) as string

  const preco = (await (
    await itemElm.$(priceElm)
  )?.evaluate((el) => el.textContent)) as string

  const umaParcelaStr = (await (
    await itemElm.$(singleInstallmentElm)
  )?.evaluate((el) => el.textContent)) as string

  if (!indisponivel) {
    return {
      nome,
      img,
      url,
      loja: 'terabyte',
      avista: priceTransformation(preco),
      parcelado: {
        parcela: priceTransformation(umaParcelaStr),
        vezes: 12,
      },
      promocao: false,
      datMinerado: new Date(),
      valido: true,
    }
  }

  return {
    nome,
    img,
    url,
    loja: 'terabyte',
    avista: 0,
    parcelado: {},
    promocao: false,
    datMinerado: new Date(),
    valido: false,
  }
}
