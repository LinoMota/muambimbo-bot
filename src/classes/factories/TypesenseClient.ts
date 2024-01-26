import * as typesense from 'typesense'


export function TypesenseClient(){
  return new typesense.Client({
    nodes: [
      {
        host: 'localhost',
        port: 8108,
        protocol: 'http',
      },
    ],
    logLevel: 'debug',
    apiKey: 'showzeraboladera',
    connectionTimeoutSeconds: 2,
  })
} 
