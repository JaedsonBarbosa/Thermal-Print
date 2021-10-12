import { connectToPrinter, CutTypes, ImageModes } from 'browser-thermal-printer-encoder'
import { Writer, Fonts } from 'bdf-fonts'
import { Printer, TamanhoQR } from './NFCe-printer'

const canvas = document.getElementById('canvas') as HTMLCanvasElement
var ctx = canvas.getContext('2d')

// const alturaFinal = writer.writeText(txt, 0, 0, canvas.width, 'center')
const printer = new Printer('Terminus', 16, canvas.width, TamanhoQR.P)
printer.renderizarEGerarLink(canvas).then(v => console.log(v))

// A inserção do logotipo pode ocorrer após o resize, onde o y inicial teria o offset do logotipo, interessante pôr também a opção de impressão do logotipo da NFC-e como disposto na seção 3.1.1
// DownloadCanvasAsImage()

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

document.getElementById('escolher')!.onclick = () => escolher()
