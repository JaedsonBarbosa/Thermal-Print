import { Fonts, Writer } from 'bdf-fonts'
import { makeQR, QRErrorCorrectLevel } from 'minimal-qr-code'
type TAlign = 'left' | 'center' | 'right'

function getNumeroStr(v: number, decimalOpcional: boolean = false) {
  if (decimalOpcional && Math.round(v) === v) return v.toLocaleString('pt-BR')
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
}

function getInteiroStr(v: number, l: number) {
  return v.toLocaleString('pt-BR', { minimumIntegerDigits: l })
}

function getData(v: string) {
  return new Date(v).toLocaleString('pt-BR')
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

const testInfNFeSupl = {
  qrCode:
    'http://www.fazenda.pr.gov.br/nfce/qrcode?p=41200323285089000185650010000013051817822496|2|2|1|9D6AB4765658166993902F7F7C26FCD0965E328F',
  urlChave: 'http://www.fazenda.pr.gov.br/nfce/consulta',
}

const testProtNFe = {
  nProt: '325210000035406',
  dhRecbto: '2021-10-02T20:00:42-03:00',
}

export enum TamanhoQR {
  P = 0.4,
  M = 0.6,
  G = 0.8,
}

export type FontFamily = keyof typeof Fonts

export class Printer {
  private readonly fonteRegular: typeof Fonts.Boxxy[0]
  private readonly fonteNegrito: typeof Fonts.Boxxy[0]
  private readonly escritor: Writer
  private posicao = 0

  constructor(
    familiaFonte: FontFamily,
    private tamanho: number,
    private readonly largura: number,
    private readonly tamanhoQR: TamanhoQR,
    private readonly logotipo: ImageData | undefined = undefined,
    private readonly nfce = testNFCe,
    private readonly infNFeSupl = testInfNFeSupl,
    private readonly protNFe = testProtNFe
  ) {
    // Definir fonte
    const fontes = Fonts[familiaFonte]
    const regular = fontes.find((v) => v.size === tamanho && !v.bold)
    const negrito = fontes.find((v) => v.size === tamanho && v.bold)
    if (!regular || !negrito) throw new Error('Fonte não encontrada.')
    this.fonteRegular = regular
    this.fonteNegrito = negrito

    // Preparar escritor
    const canvas = document.createElement('canvas')
    canvas.width = largura
    canvas.height = 10000
    const context = canvas.getContext('2d')!
    this.escritor = new Writer(context, regular.data, tamanho)

    // Montar trechos do DANFE
    this.parte0()
    this.parteI()
    this.parteII()
    this.parteIII()
    this.parteIV()
    this.parteVI()
    this.parteVII()
    this.parteV() // sim, isso eh estranho, mas estah certo
    this.parteVIIIeIX()
  }

  parte0() {
    if (this.logotipo) {
      this.escritor.ctx.putImageData(this.logotipo, 0, 0)
      this.posicao += this.logotipo.height
    }
    this.espaco()
  }

  async renderizarEGerarLink(outCanvas: HTMLCanvasElement) {
    const largura = this.largura
    const altura = Math.ceil((this.posicao + 1) / 8) * 8
    const inContext = this.escritor.ctx
    const data = inContext.getImageData(0, 0, largura, altura)
    outCanvas.width = largura
    outCanvas.height = altura
    const outContext = outCanvas.getContext('2d')!
    outContext.putImageData(data, 0, 0)

    const url: string = await new Promise((res) =>
      outCanvas.toBlob((blob) => res(URL.createObjectURL(blob)))
    )
    return url
  }

  private regular(t: string, x: number, y: number, mw: number, alin: TAlign) {
    if (!this.fonteRegular) throw new Error('Fonte não selecionada.')
    this.escritor.bdf = this.fonteRegular.data
    return this.escritor.writeText(t, x, y, mw, alin)
  }

  private negrito(t: string, x: number, y: number, mw: number, alin: TAlign) {
    if (!this.fonteNegrito) throw new Error('Fonte não selecionada.')
    this.escritor.bdf = this.fonteNegrito.data
    return this.escritor.writeText(t, x, y, mw, alin)
  }

  private escrever(texto: string, alin: TAlign, negrito: boolean = false) {
    this.posicao = negrito
      ? this.negrito(texto, 0, this.posicao, this.largura, alin)
      : this.regular(texto, 0, this.posicao, this.largura, alin)
  }

  private escritaDupla(
    esquerda: string,
    direita: string,
    proporcao: number = 0.7,
    esquerdaNegrido: boolean = false,
    direitaNegrito: boolean = false
  ) {
    const larguraE = Math.floor(this.largura * proporcao)
    const larguraD = this.largura - larguraE
    const novaPosicaoE = esquerdaNegrido
      ? this.negrito(esquerda, 0, this.posicao, larguraE, 'left')
      : this.regular(esquerda, 0, this.posicao, larguraE, 'left')
    const novaPosicaoD = direitaNegrito
      ? this.negrito(direita, larguraE, this.posicao, larguraD, 'right')
      : this.regular(direita, larguraE, this.posicao, larguraD, 'right')
    this.posicao = novaPosicaoD > novaPosicaoE ? novaPosicaoD : novaPosicaoE
  }

  private espaco(altura: number = this.tamanho) {
    this.posicao += altura
  }

  private parteI() {
    const emit = this.nfce.emit
    this.escrever(emit.xNome, 'center', true)
    this.escrever('CNPJ: ' + emit.CNPJ, 'center')
    const endereco = [emit.xLgr, emit.nro, emit.xBairro, emit.xMun, emit.UF]
    this.escrever(endereco.join(', '), 'center')
    this.espaco()
    const tipo = 'Documento Auxiliar da Nota Fiscal de Consumidor Eletrônica'
    this.escrever(tipo, 'center', true)
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
    let negrito = true
    for (const linha of data) {
      let x = 0
      const yAtual = y
      for (let i = 0; i < linha.length; i++) {
        const novoY = negrito
          ? this.negrito(linha[i], x, yAtual, larguras[i], alinhamentos[i])
          : this.regular(linha[i], x, yAtual, larguras[i], alinhamentos[i])
        if (novoY > y) y = novoY
        x += larguras[i]
      }
      negrito = false
    }
    this.posicao = y
  }

  private parteII() {
    const larguras = [40, 40, 60, 60, 60]
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
    this.escrever('Totais', 'center', true)
    this.escritaDupla('Qtde. total de itens', this.nfce.det.length.toString())
    const { vFrete, vSeg, vOutro, vProd, vDesc, vNF } = this.nfce.total.ICMSTot
    this.escritaDupla('Valor total', getMoeda(vProd))
    if (vFrete) this.escritaDupla('Frete total', getMoeda(vFrete))
    if (vSeg) this.escritaDupla('Seguro total', getMoeda(vSeg))
    if (vOutro) this.escritaDupla('Outras despesas', getMoeda(vOutro))
    if (vDesc) this.escritaDupla('Desconto total', '- ' + getMoeda(vDesc))
    this.escritaDupla('Valor a pagar', getMoeda(vNF))
    this.escritaDupla('Forma de pagamento', 'Valor pago', 0.7, true, true)
    const pag = this.nfce.pag
    pag.detPag.forEach((v) => this.escritaDupla(v.tPag, getMoeda(v.vPag)))
    this.escritaDupla('Valor do troco', getMoeda(pag.vTroco || 0))
    this.espaco()
  }

  private parteIV() {
    this.escrever('Consulte pela chave de acesso em', 'center', true)
    this.escrever(this.infNFeSupl.urlChave, 'center')
    const chave = this.chave.match(/.{4}/g)!.join(' ')
    this.escrever(chave, 'center')
    this.espaco()
  }

  private get chave() {
    return this.nfce.Id.substr(3)
  }

  private parteV() {
    const url = this.infNFeSupl.qrCode

    var { size: qrsize, isDark } = makeQR(url, 8, QRErrorCorrectLevel.M)
    // QR com mínimo de 23mm em papel de 58mm (1mm de margem de segurança)
    const dotsize = Math.floor((this.largura * this.tamanhoQR) / qrsize)
    // Mínimo de 10% de margem segura
    const paddingV = Math.ceil((dotsize * qrsize) / 10)
    // Centralizar QR
    const paddingH = Math.floor((this.largura - dotsize * qrsize) / 2)

    for (var r = 0; r < qrsize; r++) {
      for (var c = 0; c < qrsize; c++) {
        if (isDark(r, c)) {
          this.escritor.ctx.fillRect(
            c * dotsize + paddingH,
            r * dotsize + paddingV + this.posicao,
            dotsize,
            dotsize
          ) // x, y, w, h
        }
      }
    }

    this.posicao += qrsize * dotsize + paddingV * 2
  }

  private parteVI() {
    const dest = this.nfce.dest
    this.escrever('Consumidor', 'center', true)
    if (dest) {
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
    const dhEmi = getData(this.nfce.ide.dhEmi)
    this.escrever('Identificação e autorização', 'center', true)
    this.escritaDupla('Número:', nNF, 0.5)
    this.escritaDupla('Série:', serie, 0.5)
    this.escritaDupla('Data de emissão:', dhEmi, 0.5)
    const nProt = this.protNFe.nProt
    const dhRecbto = getData(this.protNFe.dhRecbto)
    this.escritaDupla('Protocolo de autorização:', nProt, 0.5)
    this.escritaDupla('Data de autorização:', dhRecbto, 0.5)
  }

  private parteVIIIeIX() {
    const infAdic = (this.nfce as any).infAdic
    const infAdFisco = infAdic?.infAdFisco
    const infCpl = infAdic?.infCpl
    const xMsg = (this.protNFe as any).xMsg
    const homolog = this.nfce.ide.tpAmb === 2
    if (infAdFisco || xMsg || homolog) {
      if (infAdFisco) this.escrever(infAdFisco, 'left')
      if (xMsg) this.escrever(xMsg, 'left')
      if (homolog) {
        const aviso = 'EMITIDA EM AMBIENTE DE HOMOLOGAÇÃO - SEM VALOR FISCAL'
        this.escrever(aviso, 'center')
      }
      if (infCpl) this.espaco()
    }
    if (infCpl) this.escrever(infCpl, 'center')
  }
}
