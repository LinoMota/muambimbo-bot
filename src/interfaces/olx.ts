import SiteMapping from './site'

export default interface OlxMapping extends SiteMapping {
  login: {
    url: string
    usernameField: string
    passwordField: string
    loginButton: string
  }

  search: {
    baseURL:string,
    regionsFoundDiv: string,
    resultDataElm: string,
    resultItem: {
      ItemContainerElm: string
      coverImgElm: string,
      nameElm: string,
      priceElm: string,
      installmentsElm: string,
      regionElm: string,
      postDateElm: string,
      alinkElm: string
    }
  }
}
