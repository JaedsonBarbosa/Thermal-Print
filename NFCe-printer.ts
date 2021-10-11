import type { Writer } from 'bdf-fonts'
import { QRCode, QRErrorCorrectLevel } from './qrcode'
type TAlign = 'left' | 'center' | 'right'

function getNumeroStr(v: number, decimalOpcional: boolean = false) {
  if (decimalOpcional && Math.round(v) === v) return v.toLocaleString('pt-BR')
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
}

function getInteiroStr(v: number, l: number) {
  return v.toLocaleString('pt-BR', { minimumIntegerDigits: l })
}

var formatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

export function getMoeda(v: string | number) {
  const n = +v
  return formatter.format(n).replace('\xa0', ' ')
}

const testNFCe = {
  Id: 'NFe25211012931158000164550010000000071187213591',
  ide: {
    nNF: 7,
    serie: 1,
    dhEmi: '2021-10-02T19:59:54-03:00',
    tpAmb: 2
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

const testInfNFeSupl = {
  qrCode:
    'http://www.fazenda.pr.gov.br/nfce/qrcode?p=41200323285089000185650010000013051817822496|2|2|1|9D6AB4765658166993902F7F7C26FCD0965E328F',
  urlChave: 'http://www.fazenda.pr.gov.br/nfce/consulta',
}

const testProtNFe = {
  nProt: '325210000035406',
  dhRecbto: '2021-10-02T20:00:42-03:00'
}

export class Printer {
  constructor(
    private readonly escritor: Writer,
    private readonly largura: number,
    private readonly nfce = testNFCe,
    private readonly infNFeSupl = testInfNFeSupl,
    private readonly protNFe = testProtNFe
  ) {
    this.parteI()
    this.parteII()
    this.parteIII()
    this.parteIV()
    this.parteVI() 
    this.parteVII()
    this.parteV() // sim, isso eh estranho, mas ta certo
    this.parteVIII()
    this.parteIX()
  }

  private posicao = 0

  public get alturaFinal(): number {
    return this.posicao
  }

  private escrever(texto: string, alinhamento: TAlign) {
    this.posicao = this.escritor.writeText(
      texto,
      0,
      this.posicao,
      this.largura,
      alinhamento
    )
  }

  private escritaDupla(esquerda: string, direita: string) {
    this.escritor.writeText(esquerda, 0, this.posicao, this.largura, 'left')
    this.posicao = this.escritor.writeText(
      direita,
      0,
      this.posicao,
      this.largura,
      'right'
    )
  }

  private espaco(altura: number = this.escritor.lineHeight) {
    this.posicao += altura
  }

  private parteI() {
    this.espaco()
    const emit = this.nfce.emit
    this.escrever(emit.xNome, 'center')
    this.escrever('CNPJ: ' + emit.CNPJ, 'center')
    const endereco = [emit.xLgr, emit.nro, emit.xBairro, emit.xMun, emit.UF]
    this.escrever(endereco.join(', '), 'center')
    this.espaco()
    const tipo = 'Documento Auxiliar da Nota Fiscal de Consumidor Eletrônica'
    this.escrever(tipo, 'center')
    this.espaco()
  }

  private tabela(larguras: number[], alinhamentos: TAlign[], data: string[][]) {
    if (data.some((v) => v.length != larguras.length)) {
      throw new Error('Todas as linhas sevem ter todas as colunas!')
    }
    if (larguras.length != alinhamentos.length) {
      throw new Error('Todas as colunas devem ter um alinhamento')
    }
    let y = this.posicao
    for (const linha of data) {
      let x = 0
      const yAtual = y
      for (let i = 0; i < linha.length; i++) {
        const coluna = linha[i]
        const largura = larguras[i]
        const alinhamento = alinhamentos[i]
        const novoY = this.escritor.writeText(
          coluna,
          x,
          yAtual,
          largura,
          alinhamento
        )
        if (novoY > y) y = novoY
        x += largura
      }
    }
    this.posicao = y
  }

  private parteII() {
    const larguras = [40, 40, 50, 60, 60]
    const restante = this.largura - larguras.reduce((p, v) => p + v, 0)
    larguras.splice(1, 0, restante)
    const alinhamentos: TAlign[] = [
      'left',
      'left',
      'right',
      'left',
      'right',
      'right',
    ]
    const data = this.nfce.det.map((v) => [
      v.cProd,
      v.xProd,
      v.qCom,
      v.uCom,
      v.vUnCom,
      v.vProd,
    ])
    data.unshift(['Cód', 'Descrição', 'Qtde', 'Un med', 'Vl un', 'Total'])
    this.tabela(larguras, alinhamentos, data)
    this.espaco()
  }

  private parteIII() {
    this.escritaDupla('Qtde. total de itens', this.nfce.det.length.toString())
    const { vFrete, vSeg, vOutro, vProd, vDesc, vNF } = this.nfce.total.ICMSTot
    this.escritaDupla('Valor total', getMoeda(vProd))
    if (vFrete) this.escritaDupla('Frete total', getMoeda(vFrete))
    if (vSeg) this.escritaDupla('Seguro total', getMoeda(vSeg))
    if (vOutro) this.escritaDupla('Outras despesas', getMoeda(vOutro))
    if (vDesc) this.escritaDupla('Desconto total', '- ' + getMoeda(vDesc))
    this.escritaDupla('Valor a pagar', getMoeda(vNF))
    this.espaco()
    this.escritaDupla('FORMA DE PAGAMENTO', 'VALOR PAGO')
    const pag = this.nfce.pag
    pag.detPag.forEach((v) => this.escritaDupla(v.tPag, getMoeda(v.vPag)))
    this.escritaDupla('Valor do troco', getMoeda(pag.vTroco || 0))
    this.espaco()
  }

  private parteIV() {
    this.escrever('Consulte pela chave de acesso em', 'center')
    this.escrever(this.infNFeSupl.urlChave, 'center')
    const chave = this.nfce.Id.substr(3).match(/.{4}/g).join(' ')
    this.escrever(chave, 'center')
    this.espaco()
  }

  private QR(url: string) {
    var qr = new QRCode(8, QRErrorCorrectLevel.M)
    qr.addData(url)
    qr.make()

    var qrsize = qr.getModuleCount()
    const dotsize = Math.floor((this.largura * 0.8) / qrsize)
    const padding = Math.floor((this.largura - dotsize * qrsize) / 2)

    for (var r = 0; r < qrsize; r++) {
      for (var c = 0; c < qrsize; c++) {
        if (qr.isDark(r, c)) {
          this.escritor.ctx.fillRect(
            c * dotsize + padding,
            r * dotsize + padding + this.posicao,
            dotsize,
            dotsize
          ) // x, y, w, h
        }
      }
    }

    this.posicao += qrsize * dotsize + padding * 2
  }

  private parteV() {
    this.QR(this.infNFeSupl.qrCode)
  }

  private parteVI() {
    const dest = this.nfce.dest
    if (dest) {
      this.escrever('CONSUMIDOR', 'center')
      if (dest.xNome) this.escrever(dest.xNome, 'center')
      const d = dest as any
      if (d.CPF) {
        this.escrever('CPF: ' + d.CPF, 'center')
      } else if (dest.CNPJ) {
        this.escrever('CNPJ: ' + dest.CNPJ, 'center')
      } else if (d.idEstrangeiro) {
        this.escrever('Id. estrangeiro: ' + d.idEstrangeiro, 'center')
      }
      const endereco = [dest.xLgr, dest.nro, dest.xBairro, dest.xMun, dest.UF]
      this.escrever(endereco.join(', '), 'center')
    } else {
      this.escrever('CONSUMIDOR NÃO IDENTIFICADO', 'center')
    }
    this.espaco()
  }

  private parteVII() {
    const nNF = getInteiroStr(this.nfce.ide.nNF, 9)
    const serie = getInteiroStr(this.nfce.ide.serie, 3)
    const dhEmi = new Date(this.nfce.ide.dhEmi).toLocaleString('pt-BR')
    this.escritaDupla('NFC-e nº: ' + nNF + ', série: ' + serie, dhEmi)
    this.escritaDupla('Protocolo de autorização:', this.protNFe.nProt)
    const dhRecbto = new Date(this.protNFe.dhRecbto).toLocaleString('pt-BR')
    this.escritaDupla('Data de autorização:', dhRecbto)
  }

  private parteVIII() {
    const infAdFisco = (this.nfce as any).infAdic?.infAdFisco
    if (infAdFisco) this.escrever(infAdFisco, 'left')
    const xMsg = (this.protNFe as any).xMsg
    if (xMsg) this.escrever(xMsg, 'left')
    if (this.nfce.ide.tpAmb === 2) {
      const aviso = 'EMITIDA EM AMBIENTE DE HOMOLOGAÇÃO - SEM VALOR FISCAL'
      this.escrever(aviso, 'center')
    }
  }

  private parteIX() {
    const infCpl = (this.nfce as any).infAdic?.infCpl
    if (infCpl) this.escrever(infCpl, 'left')
  }
}
