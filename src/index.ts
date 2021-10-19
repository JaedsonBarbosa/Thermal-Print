import {
  connectToPrinter,
  CutTypes,
  ImageModes,
} from 'browser-thermal-printer-encoder'
import { Fonts } from 'bdf-fonts'
import { montar, TamanhoQR } from './impressao-nfce'
import { CanvasDither, TamanhoImagem } from './CanvasDither'

const canvas = document.getElementById('canvas') as HTMLCanvasElement
const logotipoCanvas = document.getElementById('logotipo') as HTMLCanvasElement
const width = canvas.width

const fontPair = Fonts.Terminus[16]

CanvasDither.create('./icon.jpeg', width, TamanhoImagem.P, logotipoCanvas).then(
  async (dither) => {
    montar(canvas, 16, fontPair, 1, TamanhoQR.P, dither.imageData)
    canvas.toBlob((blob) => console.log(URL.createObjectURL(blob)))
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
