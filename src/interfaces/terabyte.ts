import SiteMapping from './site'

export default interface TerabyteMapping extends SiteMapping {
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
