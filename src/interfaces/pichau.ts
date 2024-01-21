import SiteMapping from './site'

export default interface PichauMapping extends SiteMapping {
  search: {
    baseURL:string,
    resultItem: {
      ItemContainerElm: string
      alinkElm: string
      coverImgElm: string,
      nameElm: string,
      priceElm: string,
      singleInstallmentElm: string,
      unavailableElm: string
    }
  }
}
