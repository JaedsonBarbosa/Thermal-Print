import {
  connectToPrinter,
  CutTypes,
  ImageModes,
} from 'browser-thermal-printer-encoder'
import { Writer, Fonts } from 'bdf-fonts'
import { Printer, TamanhoQR } from './NFCe-printer'
import { CanvasDither } from './CanvasDither'

const canvas = document.getElementById('canvas') as HTMLCanvasElement
var ctx = canvas.getContext('2d')
const logotipoCanvas = document.getElementById('logotipo') as HTMLCanvasElement
CanvasDither.create('./icon.jpeg', logotipoCanvas).then((dither) => {
  const printer = new Printer('Terminus', 16, canvas.width, TamanhoQR.P)
  printer.renderizarEGerarLink(canvas).then((v) => console.log(v))
})

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
