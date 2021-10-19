import { FontPair, Write } from 'bdf-fonts'
import { makeQR, QRErrorCorrectLevel } from 'minimal-qr-code'
import { testInfNFeSupl, testNFCe, testProtNFe } from './teste-nfce'

type Align = 'left' | 'center' | 'right'

export enum TamanhoQR {
  P = 0.4,
  M = 0.6,
  G = 0.8,
}

export function montar(
  canvas: HTMLCanvasElement,
  alturaLinha: number,
  parFontes: FontPair,
  escala: 1 | 2,
  tamanhoQR: TamanhoQR,
  logotipo: ImageData | undefined = undefined,
  largura: number = canvas.width,
  nfce = testNFCe,
  infNFeSupl = testInfNFeSupl,
  protNFe = testProtNFe
) {
  let posicao = 0

  canvas.width = largura
  canvas.height = 10000
  const context = canvas.getContext('2d')!

  function espaco() {
    posicao += alturaLinha * escala
  }

  function escreverApenas(
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    alinhamento: Align,
    negrito: boolean
  ) {
    return Write(
      negrito ? parFontes.bold : parFontes.regular,
      alturaLinha,
      escala,
      context,
      text,
      x,
      y,
      maxWidth,
      alinhamento
    )
  }

  function escrever(texto: string, alin: Align, negrito: boolean = false) {
    posicao = escreverApenas(texto, 0, posicao, largura, alin, negrito)
  }

  function escritaDupla(
    esquerda: string,
    direita: string,
    proporcao: number = 0.6,
    esquerdaNegrido: boolean = false,
    direitaNegrito: boolean = false
  ) {
    const larguraE = Math.floor(largura * proporcao)
    const larguraD = largura - larguraE
    const novaPosicaoE = escreverApenas(
      esquerda,
      0,
      posicao,
      larguraE,
      'left',
      esquerdaNegrido
    )
    const novaPosicaoD = escreverApenas(
      direita,
      larguraE,
      posicao,
      larguraD,
      'right',
      direitaNegrito
    )
    posicao = novaPosicaoD > novaPosicaoE ? novaPosicaoD : novaPosicaoE
  }

  {
    // logotipo
    if (logotipo) {
      const paddingH = Math.floor((largura - logotipo.width) / 2)
      context.putImageData(logotipo, paddingH, 0)
      posicao += logotipo.height
    }
    espaco()
  }

  {
    // parteI
    const emit = nfce.emit
    escrever(emit.xNome, 'center', true)
    escrever('CNPJ: ' + emit.CNPJ, 'center')
    const endereco = [emit.xLgr, emit.nro, emit.xBairro, emit.xMun, emit.UF]
    escrever(endereco.join(', '), 'center')
    espaco()
    const tipo = 'Documento Auxiliar da Nota Fiscal de Consumidor Eletrônica'
    escrever(tipo, 'center', true)
    espaco()
  }

  {
    // parteII
    const larguras = [0.1, 0.1, 0.15, 0.15, 0.15]
      .map((v) => largura * v)
      .map(Math.round)
    const restante = largura - larguras.reduce((p, v) => p + v, 0)
    larguras.splice(1, 0, restante)
    const alinhamentos: Align[] = [
      'left',
      'left',
      'right',
      'left',
      'right',
      'right',
    ]
    const props: (keyof typeof nfce.det[0])[] = [
      'cProd',
      'xProd',
      'qCom',
      'uCom',
      'vUnCom',
      'vProd',
    ]
    const data = [
      ['Cód', 'Descrição', 'Qtde', 'Un med', 'Vl un', 'Total'],
      ...nfce.det.map((v) => props.map((prop) => v[prop])),
    ]
    let y = posicao
    let negrito = true
    for (const linha of data) {
      let x = 0
      const yAtual = y
      for (let i = 0; i < linha.length; i++) {
        const novoY = escreverApenas(
          linha[i],
          x,
          yAtual,
          larguras[i],
          alinhamentos[i],
          negrito
        )
        if (novoY > y) y = novoY
        x += larguras[i]
      }
      negrito = false
    }
    posicao = y
  }

  {
    // parteIII
    escrever('Totais', 'center', true)
    escritaDupla('Qtde. total de itens', nfce.det.length.toString())
    const { vFrete, vSeg, vOutro, vProd, vDesc, vNF } = nfce.total.ICMSTot
    escritaDupla('Valor total', getMoeda(vProd))
    if (vFrete) escritaDupla('Frete total', getMoeda(vFrete))
    if (vSeg) escritaDupla('Seguro total', getMoeda(vSeg))
    if (vOutro) escritaDupla('Outras despesas', getMoeda(vOutro))
    if (vDesc) escritaDupla('Desconto total', '- ' + getMoeda(vDesc))
    escritaDupla('Valor a pagar', getMoeda(vNF))
    escritaDupla('Forma de pagamento', 'Valor pago', 0.6, true, true)
    const pag = nfce.pag
    pag.detPag.forEach((v) => escritaDupla(v.tPag, getMoeda(v.vPag)))
    escritaDupla('Valor do troco', getMoeda(pag.vTroco || 0))
    espaco()
  }

  {
    // parteIV
    escrever('Consulte pela chave de acesso em', 'center', true)
    escrever(infNFeSupl.urlChave, 'center')
    const chave = nfce.Id.substr(3).match(/.{4}/g)!.join(' ')
    escrever(chave, 'center')
    espaco()
  }

  {
    // parteVI
    const dest = nfce.dest
    escrever('Consumidor', 'center', true)
    if (dest) {
      if (dest.xNome) escrever(dest.xNome, 'center')
      const d = dest as any
      if (d.CPF) {
        escrever('CPF: ' + d.CPF, 'center')
      } else if (dest.CNPJ) {
        escrever('CNPJ: ' + dest.CNPJ, 'center')
      } else if (d.idEstrangeiro) {
        escrever('Id. estrangeiro: ' + d.idEstrangeiro, 'center')
      }
      const endereco = [dest.xLgr, dest.nro, dest.xBairro, dest.xMun, dest.UF]
      escrever(endereco.join(', '), 'center')
    } else {
      escrever('CONSUMIDOR NÃO IDENTIFICADO', 'center')
    }
    espaco()
  }

  {
    // parteVII
    const nNF = getInteiroStr(nfce.ide.nNF, 9)
    const serie = getInteiroStr(nfce.ide.serie, 3)
    const dhEmi = getData(nfce.ide.dhEmi)
    escrever('Identificação e autorização', 'center', true)
    escritaDupla('Número:', nNF, 0.5)
    escritaDupla('Série:', serie, 0.5)
    escritaDupla('Data de emissão:', dhEmi, 0.5)
    const nProt = protNFe.nProt
    const dhRecbto = getData(protNFe.dhRecbto)
    escritaDupla('Protocolo de autorização:', nProt, 0.5)
    escritaDupla('Data de autorização:', dhRecbto, 0.5)
  }

  {
    // parteV
    const url = infNFeSupl.qrCode

    var { size: qrsize, isDark } = makeQR(url, 8, QRErrorCorrectLevel.M)
    // QR com mínimo de 23mm em papel de 58mm (1mm de margem de segurança)
    const dotsize = Math.floor((largura * tamanhoQR) / qrsize)
    // Mínimo de 10% de margem segura
    const paddingV = Math.ceil((dotsize * qrsize) / 10)
    // Centralizar QR
    const paddingH = Math.floor((largura - dotsize * qrsize) / 2)

    for (var r = 0; r < qrsize; r++) {
      for (var c = 0; c < qrsize; c++) {
        if (isDark(r, c)) {
          context.fillRect(
            c * dotsize + paddingH,
            r * dotsize + paddingV + posicao,
            dotsize,
            dotsize
          ) // x, y, w, h
        }
      }
    }

    posicao += qrsize * dotsize + paddingV * 2
  }

  {
    // partes VIII e IX
    const infAdic = (nfce as any).infAdic
    const infAdFisco = infAdic?.infAdFisco
    const infCpl = infAdic?.infCpl
    const xMsg = (protNFe as any).xMsg
    const homolog = nfce.ide.tpAmb === 2
    if (infAdFisco || xMsg || homolog) {
      if (infAdFisco) escrever(infAdFisco, 'left')
      if (xMsg) escrever(xMsg, 'left')
      if (homolog) {
        const aviso = 'EMITIDA EM AMBIENTE DE HOMOLOGAÇÃO - SEM VALOR FISCAL'
        escrever(aviso, 'center')
      }
      if (infCpl) espaco()
    }
    if (infCpl) escrever(infCpl, 'center')
  }

  {
    // ajuste de altura do canvas
    const altura = Math.ceil((posicao + 1) / 8) * 8
    const data = context.getImageData(0, 0, largura, altura)
    canvas.height = altura
    context.putImageData(data, 0, 0)
  }
}

const formatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

function getMoeda(v: string | number) {
  const n = +v
  return formatter.format(n).replace('\xa0', ' ')
}

function getInteiroStr(v: number, l: number) {
  return v.toLocaleString('pt-BR', { minimumIntegerDigits: l })
}

function getData(v: string) {
  return new Date(v).toLocaleString('pt-BR')
}
