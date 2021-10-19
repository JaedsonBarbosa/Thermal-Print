function getNumeroStr(v: number, decimalOpcional: boolean = false) {
  if (decimalOpcional && Math.round(v) === v) return v.toLocaleString('pt-BR')
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
}

export const testNFCe = {
  Id: 'NFe25211012931158000164550010000000071187213591',
  ide: {
    nNF: 7,
    serie: 1,
    dhEmi: '2021-10-02T19:59:54-03:00',
    tpAmb: 2,
  },
  emit: {
    xNome: 'SEVERINO ALVES SERAFIM',
    CNPJ: '12.931.158/0001-64', // usar a funcao de mascara aqui
    xLgr: 'SÍTIO BARRA',
    nro: '45',
    xBairro: 'ZONA RURAL',
    xMun: 'Cuitegi',
    UF: 'PB',
  },
  dest: {
    CNPJ: '10.422.724/0001-87',
    xNome: 'Lumer Informática Serviços Digitais LTDA',
    xLgr: 'Av. Rio de Janeiro',
    nro: '1060',
    xBairro: 'center',
    xMun: 'Santa Gertrudes do Assaí de Baixo',
    UF: 'PR',
  },
  det: [
    {
      cProd: '001',
      xProd: 'AREIA LAVADA',
      qCom: getNumeroStr(7, true),
      uCom: 'MT CUB',
      vUnCom: getNumeroStr(30),
      vProd: getNumeroStr(210),
    },
  ],
  total: {
    ICMSTot: {
      vProd: 210,
      vFrete: 100,
      vSeg: 0,
      vOutro: 0,
      vDesc: 0,
      vNF: 310,
    },
  },
  pag: {
    detPag: [
      {
        tPag: 'Dinheiro', // Usar função de conversão,
        vPag: 310,
      },
    ],
    vTroco: 0,
  },
}

export const testInfNFeSupl = {
  qrCode:
    'http://www.fazenda.pr.gov.br/nfce/qrcode?p=41200323285089000185650010000013051817822496|2|2|1|9D6AB4765658166993902F7F7C26FCD0965E328F',
  urlChave: 'http://www.fazenda.pr.gov.br/nfce/consulta',
}

export const testProtNFe = {
  nProt: '325210000035406',
  dhRecbto: '2021-10-02T20:00:42-03:00',
}
