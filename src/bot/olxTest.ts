import puppeteer, { ElementHandle, Page } from 'puppeteer'
import { dateTransformation } from '../utils/dateTransformation'
import { Item, RegiaoResultado } from '../types/olx'
import olxMapping from '../mapping/olx'
import { persistItemArray } from '../typesense/cli'

// TODO
// identificar destacados / promocoes
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

  await page.goto(olxMapping.url)

  // monta uma string com o termo
  const termSearchUrl = olxMapping.search.baseURL + encodeURIComponent(term)

  // realiza a busca
  await page.goto(termSearchUrl, { waitUntil: 'networkidle0' })

  //coleta dados do cabecalho
  const regionsFounds = await page.$x(olxMapping.search.regionsFoundDiv)
  const regionsText = (await regionsFounds[0].evaluate(
    (el) => el.textContent,
  )) as string
  const arrayRegioes = transformaRegioes(regionsText)
  console.log(arrayRegioes)

  const numResults = arrayRegioes.reduce(
    (prev, regiao) => regiao.resultados + prev,
    0,
  )
  console.log('Resultados : ', numResults)

  const paginasParaMinerar = numResults / 50 // 50 eh o numero de itens por pag

  //essa verificacao eh pra no caso tiver 102 itens seriam 3 paginas
  let numCheio = parseInt(paginasParaMinerar.toString())
  numCheio = paginasParaMinerar - numCheio > 0 ? numCheio + 1 : numCheio

  // otimizacao eh criar uma page nova no navegador e minerar tudo ao mesmo tempo

  console.log(`vou minerar ${numCheio} paginas concorrentemente`)
  console.log(`${termSearchUrl}&o=${2}`)
  const promisesPaginas = Array.from({ length: numCheio }, (_, index) => {
    if (index === 0) {
      return mineraUmaPagina(page)
    }

    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve) => {
      const singlePage = await browser.newPage()
      await singlePage.goto(`${termSearchUrl}&o=${index + 1}`, {
        waitUntil: 'domcontentloaded',
      })
      resolve(mineraUmaPagina(singlePage))
    })
  })

  const dados: Item[] = (await Promise.all(promisesPaginas)).flat(1) as Item[]

  console.log(`Foram minerados com sucesso ${dados.length}`)
  console.log(dados)

  await browser.close()

  // alimentando o typesense
  await persistItemArray(dados)

  return dados
}

async function mineraUmaPagina(pagina: Page): Promise<Item[]> {
  const itemListSelection = await pagina.$$(
    olxMapping.search.resultItem.ItemContainerElm,
  )
  const itemListElm = await itemListSelection.map(async (item) => {
    try {
      return await itemExtractor(item)
    } catch (e) {
      console.log(e)
      console.log(`Nao foi possivel obter um item da pagina ${pagina.url()}`)
      return {} as unknown as Item
    }
  })

  return await Promise.all(itemListElm)
}

function transformaRegioes(conteudoCru: string): RegiaoResultado[] {
  const padrao = /DDD (\d+) - (.*?), (\d+)/g

  const correspondencias: RegExpExecArray[] = []
  let correspondencia: RegExpExecArray | null
  while ((correspondencia = padrao.exec(conteudoCru)) !== null) {
    correspondencias.push(correspondencia)
  }

  return correspondencias.map((correspondencia) => {
    const regiao = (`DDD ${correspondencia[1]} - ${correspondencia[2]}`)
    const resultados = parseInt(correspondencia[3], 10)
    return { regiao, resultados }
  })
}

const priceTransformation = (stringPreco: string): number =>
  parseFloat(stringPreco.replace(/[^0-9,]/g, '').replace(',', '.'))

const itemExtractor = async (itemElm: ElementHandle): Promise<Item> => {
  const {
    coverImgElm,
    nameElm,
    priceElm,
    regionElm,
    postDateElm,
    installmentsElm,
    alinkElm,
  } = olxMapping.search.resultItem

  const img = decodeURIComponent(
    (await (
      await itemElm.$(coverImgElm)
    )?.evaluate((el) => el.getAttribute('src'))) as string,
  )

  const nome = 
    (await (
      await itemElm.$(nameElm)
    )?.evaluate((el) => el.textContent)) as string
  

  const regiao = decodeURIComponent(
    (await (
      await itemElm.$(regionElm)
    )?.evaluate((el) => el.textContent)) as string,
  )

  const postagem = (await (
    await itemElm.$(postDateElm)
  )?.evaluate((el) => el.textContent)) as string

  const url = (await (
    await itemElm.$(alinkElm)
  )?.evaluate((el) => el.getAttribute('href'))) as string

  const preco = (await (
    await itemElm.$(priceElm)
  )?.evaluate((el) => el.textContent)) as string

  const parcelado = (await (
    await itemElm.$(installmentsElm)
  )?.evaluate((el) => el.textContent)) as string

  let valido = true

  if (preco) {
    let precoParcelado = {
      vezes: 0,
      parcela: 0,
    }

    if (parcelado) {
      try {
        const [vezesStr, parcelaStr] = parcelado.split(' de ')
        const vezes = parseFloat(vezesStr.replace('x', ''))
        const parcela = priceTransformation(parcelaStr)
        precoParcelado = {
          vezes,
          parcela,
        }
      } catch (e) {
        console.log(`achei um cara que nao eh um produto valido -> ${nome}`)
        valido = false
      }
    }

    return {
      nome,
      regiao,
      img,
      url,
      loja: 'olx',
      avista: priceTransformation(preco),
      parcelado: precoParcelado,
      promocao: false,
      datAnunciado: BigInt(dateTransformation(postagem).getTime()).toString(),
      datMinerado: BigInt(new Date().getTime()).toString(),
      valido,
    }
  }

  return {
    nome,
    regiao,
    img,
    url,
    loja: 'olx',
    avista: 0,
    parcelado: {},
    promocao: false,
    datAnunciado: BigInt(new Date().getTime()).toString(),
    datMinerado: BigInt(new Date().getTime()).toString(),
    valido: false,
  }
}
