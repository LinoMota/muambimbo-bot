import { SimpleFileRepository } from './../repositories/SimpleFileRepository'
import { Browser, ElementHandle, Page } from 'puppeteer'
import { Item, RegiaoResultado } from '../../types/olx'
import { EcommerceBot } from '../interfaces/EcommerceBot'
import { inject, injectable, registry } from 'tsyringe'

import olxMapping from '../../mapping/olx'
import { botRepository } from '../interfaces/BotRepository'
import { dateTransformation } from '../../utils/dateTransformation'
import { PuppeteerBrowser } from '../factories/PuppeteerBrowser'

@injectable()
@registry([
  {
    token: 'OlxRepository',
    useClass: SimpleFileRepository,
  },
  {
    token: 'PuppeteerBrowser',
    useFactory: PuppeteerBrowser,
  },
])
export class OlxBot implements EcommerceBot<Item> {
  private browser! : Browser
  private page!: Page

  constructor(
    @inject('OlxRepository') private repository: botRepository,
    @inject('PuppeteerBrowser') private browserPromise: Browser,
  ) {}

  async initialize() {
    const launched = await this.browserPromise
    this.browser = launched

    const pages = await this.browser.pages()
    this.page = pages[0]
  }

  async search(searchTerm: string) {
    await this.initialize()

    const termSearchUrl =
      olxMapping.search.baseURL + encodeURIComponent(searchTerm)

    await this.page.goto(termSearchUrl, { waitUntil: 'domcontentloaded' })

    await this.page.waitForXPath(olxMapping.search.regionsFoundDiv)

    const regionsFounds = await this.page.$x(olxMapping.search.regionsFoundDiv)

    const regionsText = (await regionsFounds[0].evaluate(
      (el) => el.textContent,
    )) as string

    const arrayRegioes = this.transformaRegioes(regionsText)
    console.log(arrayRegioes)

    const numResults = arrayRegioes.reduce(
      (prev, regiao) => regiao.resultados + prev,
      0,
    )

    console.log('Resultados : ', numResults)

    const paginasParaMinerar = numResults / 50

    let numPaginas = parseInt(paginasParaMinerar.toString())
    numPaginas =
      paginasParaMinerar - numPaginas > 0 ? numPaginas + 1 : numPaginas

    let searchOutput: Item[] = []

    console.log(`vou minerar ${numPaginas} paginas concorrentemente`)
    console.log(`${termSearchUrl}&o=${2}`)
    const promisesPaginas = Array.from({ length: numPaginas }, (_, index) => {
      if (index === 0) {
        return this.extractSinglePage(this.page)
      }

      // eslint-disable-next-line no-async-promise-executor
      return new Promise(async (resolve) => {
        const singlePage = await this.browser.newPage()
        await singlePage.goto(`${termSearchUrl}&o=${index + 1}`, {
          waitUntil: 'domcontentloaded',
        })
        resolve(this.extractSinglePage(singlePage))
      })
    })

    searchOutput = (await Promise.all(promisesPaginas)).flat(1) as Item[]

    console.log(
      `Foram minerados com sucesso ${searchOutput.length}, persistindo no repository`,
    )
    await this.persistItems(searchOutput)
    console.log(`Persistidos com sucesso`)

    await this.close()
  }

  async extractSinglePage(page: Page) {
    const itemListSelection = await page.$$(
      olxMapping.search.resultItem.ItemContainerElm,
    )
    const itemListElm = await itemListSelection.map(async (item) => {
      try {
        return await this.itemExtractor(item)
      } catch (e) {
        console.log(e)
        console.log(`Nao foi possivel obter um item da pagina ${page.url()}`)
        return {} as unknown as Item
      }
    })

    return await Promise.all(itemListElm)
  }

  async close() {
    await this.browser.close()
  }

  private async itemExtractor(itemElm: ElementHandle): Promise<Item> {
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

    const nome = (await (
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
          const parcela = this.priceTransformation(parcelaStr)
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
        avista: this.priceTransformation(preco),
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

  async persistItems(items: Item[]): Promise<void> {
    await this.repository.persist(items)
  }

  private priceTransformation(stringPreco: string): number {
    return parseFloat(stringPreco.replace(/[^0-9,]/g, '').replace(',', '.'))
  }

  private transformaRegioes(conteudoCru: string): RegiaoResultado[] {
    const padrao = /DDD (\d+) - (.*?), (\d+)/g

    const correspondencias: RegExpExecArray[] = []
    let correspondencia: RegExpExecArray | null
    while ((correspondencia = padrao.exec(conteudoCru)) !== null) {
      correspondencias.push(correspondencia)
    }

    return correspondencias.map((correspondencia) => {
      const regiao = `DDD ${correspondencia[1]} - ${correspondencia[2]}`
      const resultados = parseInt(correspondencia[3], 10)
      return { regiao, resultados }
    })
  }
}
