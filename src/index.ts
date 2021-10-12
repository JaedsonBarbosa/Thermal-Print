import { connectToPrinter, CutTypes, ImageModes } from 'browser-thermal-printer-encoder'
import { Writer, Fonts } from 'bdf-fonts'
import { Printer } from './NFCe-printer'

const canvas = document.getElementById('canvas') as HTMLCanvasElement
var ctx = canvas.getContext('2d')

const txt = 'Documento Auxiliar da Nota Fiscal de Consumidor Eletrônica'
const fonte = Fonts.Sq[1]
const writer = new Writer(ctx, fonte.data, fonte.size)
// const alturaFinal = writer.writeText(txt, 0, 0, canvas.width, 'center')
const printer = new Printer(writer, canvas.width)
const alturaFinal = printer.alturaFinal
resizeCanvas(alturaFinal)

// A inserção do logotipo pode ocorrer após o resize, onde o y inicial teria o offset do logotipo, interessante pôr também a opção de impressão do logotipo da NFC-e como disposto na seção 3.1.1
// DownloadCanvasAsImage()

function resizeCanvas(newHeight: number) {
  newHeight += 1
  if (newHeight % 8) newHeight = Math.ceil(newHeight / 8) * 8
  const data = ctx.getImageData(0, 0, canvas.width, newHeight)
  canvas.height = newHeight
  ctx.putImageData(data, 0, 0)
}

function DownloadCanvasAsImage() {
  let downloadLink = document.createElement('a')
  downloadLink.setAttribute('download', 'CanvasAsImage.png')
  canvas.toBlob(function (blob) {
    let url = URL.createObjectURL(blob)
    downloadLink.setAttribute('href', url)
    downloadLink.click()
  })
}

async function escolher() {
  const printCanvas = await connectToPrinter()
  await printCanvas({
    canvas,
    imageMode: ImageModes.raster,
    paddingTop: 0,
    paddingBottom: 2,
    cut: CutTypes.none,
  })
  alert('Concluido')
}

document.getElementById('escolher').onclick = () => escolher()
