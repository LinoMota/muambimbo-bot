import SiteMapping from './site'

export default interface KabumMapping extends SiteMapping {
  search: {
    baseURL:string,
    resultDataElm: string
    resultItem: {
      ItemContainerElm: string
      alinkElm: string
      coverImgElm: string,
      nameElm: string,
      priceElm: string,
      installmentsElm: string,
      availableElm: string,
      unavailableElm: string
    }
  }
}
