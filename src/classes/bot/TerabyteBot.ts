import { SimpleFileRepository } from '../repositories/SimpleFileRepository'
import { Browser, ElementHandle, Page } from 'puppeteer'
import { Item } from '../../types/terabyte'
import { EcommerceBot } from '../interfaces/EcommerceBot'
import { inject, injectable, registry } from 'tsyringe'

import { botRepository } from '../interfaces/BotRepository'
import { PuppeteerBrowser } from '../factories/PuppeteerBrowser'
import terabyteMapping from '../../mapping/terabyte'

@injectable()
@registry([
  {
    token: 'TerabyteRepository',
    useClass: SimpleFileRepository,
  },
  {
    token: 'PuppeteerBrowser',
    useFactory: PuppeteerBrowser,
  },
])
export class TerabyteBot implements EcommerceBot<Item> {
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

    const formatedSearchTerm = searchTerm.replace(' ', '-')
    const termSearchUrl = `${terabyteMapping.search.baseURL}?str=${formatedSearchTerm}`

    console.log(`consultando a ulr -> ${termSearchUrl}`)

    await this.page.goto(termSearchUrl, { waitUntil: 'networkidle0' })

    const searchOutput: Item[] = await this.extractSinglePage()

    console.log(`Foram minerados com sucesso ${searchOutput.length}`)

    await this.persistItems(searchOutput)

    await this.close()
  }

  async extractSinglePage() {
    const promisesItems = await (
      await this.page.$$(terabyteMapping.search.resultItem.ItemContainerElm)
    ).map(
      (itemElm) =>
        new Promise((resolve) =>
          resolve(this.itemExtractor(itemElm) as unknown as Item),
        ),
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

    const url = (await (
      await itemElm.$(alinkElm)
    )?.evaluate((el) => el.getAttribute('href'))) as string

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
        avista: this.priceTransformation(preco),
        parcelado: {
          parcela: this.priceTransformation(umaParcelaStr),
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

  async persistItems(items: Item[]): Promise<void> {
    await this.repository.persist(items)
  }

  private priceTransformation(stringPreco: string): number {
    try {
      return parseFloat(
        stringPreco.replace('R$', '').replace('.', '').replace(',', '.'),
      )
    } catch (e) {
      return 0
    }
  }
}
