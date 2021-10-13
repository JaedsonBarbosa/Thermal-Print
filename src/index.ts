import {
  connectToPrinter,
  CutTypes,
  ImageModes,
} from 'browser-thermal-printer-encoder'
import { Printer, TamanhoQR } from './NFCe-printer'
import { CanvasDither, TamanhoImagem } from './CanvasDither'

const canvas = document.getElementById('canvas') as HTMLCanvasElement
const logotipoCanvas = document.getElementById('logotipo') as HTMLCanvasElement
const width = canvas.width
CanvasDither.create('./icon.jpeg', width, TamanhoImagem.P, logotipoCanvas).then(
  async (dither) => {
    const printer = new Printer(
      'Cherry',
      10, 1,
      width,
      TamanhoQR.P,
      dither.imageData
    )
    const link = await printer.renderizarEGerarLink(canvas)
    console.log(link)
  }
)

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
