import { SimpleFileRepository } from '../repositories/SimpleFileRepository'
import { Browser, ElementHandle, Page } from 'puppeteer'
import { Item } from '../../types/kabum'
import { EcommerceBot } from '../interfaces/EcommerceBot'
import { inject, injectable, registry } from 'tsyringe'

import { botRepository } from '../interfaces/BotRepository'
import { PuppeteerBrowser } from '../factories/PuppeteerBrowser'
import kabumMapping from '../../mapping/kabum'

@injectable()
@registry([
  {
    token: 'KabumRepository',
    useClass: SimpleFileRepository,
  },
  {
    token: 'PuppeteerBrowser',
    useFactory: PuppeteerBrowser,
  },
])
export class KabumBot implements EcommerceBot<Item> {
  private browser!: Browser
  private page!: Page

  constructor(
    @inject('KabumRepository') private repository: botRepository,
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

    const numItensPages = 100
    const urlPrefix = `?page_number=1&page_size=${numItensPages}&facet_filters=&sort=most_searched`
    const formatedSearchTerm = searchTerm.replace(' ', '-')
    const termSearchUrl = `${kabumMapping.search.baseURL}${formatedSearchTerm}${urlPrefix}`

    console.log(`consultando a ulr -> ${termSearchUrl}`)

    await this.page.goto(termSearchUrl, { waitUntil: 'domcontentloaded' })

    const resultNumsElm = await this.page.$(kabumMapping.search.resultDataElm)
    const resultNums = (await resultNumsElm?.evaluate(
      (el) => el.textContent,
    )) as string

    console.log(`Produtos encontrados: ${resultNums}`)

    const searchOutput: Item[] = await this.extractSinglePage()

    console.log(`Foram minerados com sucesso ${searchOutput.length}`)

    await this.persistItems(searchOutput)

    await this.close()
  }

  async extractSinglePage() {
    const promisesItems = await (
      await this.page.$$(kabumMapping.search.resultItem.ItemContainerElm)
    ).map(
      (itemElm) =>
        new Promise((resolve) => resolve(this.itemExtractor(itemElm))),
    )

    return (await Promise.all(promisesItems)) as Item[]
  }

  async close() {
    await this.browser.close()
  }

  private async itemExtractor(itemElm: ElementHandle): Promise<Item> {
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
        avista: this.priceTransformation(preco),
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

  async persistItems(items: Item[]): Promise<void> {
    await this.repository.persist(items)
  }

  private priceTransformation(stringPreco: string): number {
    return parseFloat(
      stringPreco.replace('R$', '').replace('.', '').replace(',', '.'),
    )
  }
}
