import { EscPosEncoder } from './esc-pos-encoder'
import { BDFFont } from './bdf-canvas'
import { Printer } from './NFCe-printer'

const canvas = document.getElementById('canvas') as HTMLCanvasElement
var ctx = canvas.getContext('2d')

const txt = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla vehicula nunc eu lacus tincidunt tincidunt.'
fetch('./cozette.bdf').then(async (res) => {
  const bdfbody = await res.text()
  const font = new BDFFont(ctx, bdfbody)
  // const newHeight = font.writeText(txt, 0, 0, canvas.width, 'centro')
  const printer = new Printer(font, canvas.width)
  resizeCanvas(printer.alturaFinal)
  // A inserção do logotipo pode ocorrer após o resize, onde o y inicial teria o offset do logotipo, interessante pôr também a opção de impressão do logotipo da NFC-e como disposto na seção 3.1.1
  // DownloadCanvasAsImage()
})

function resizeCanvas(newHeight: number) {
  newHeight += 1
  const data = ctx.getImageData(0, 0, canvas.width, newHeight)
  canvas.height = newHeight
  ctx.putImageData(data, 0, 0)
}

function DownloadCanvasAsImage(){
  let downloadLink = document.createElement('a');
  downloadLink.setAttribute('download', 'CanvasAsImage.png');
  canvas.toBlob(function(blob) {
    let url = URL.createObjectURL(blob);
    downloadLink.setAttribute('href', url);
    downloadLink.click();
  });
}

async function escolher() {
  const encoder = new EscPosEncoder('raster')
  let data = encoder.image(canvas).newline().encode()
  alert('Data criado')
  const nav = navigator as any
  const port = await nav.serial.requestPort()
  await port.open({ baudRate: 1200 })
  const writer = port.writable.getWriter()
  await writer.write(data)
  writer.releaseLock()
  port.close()
}

document.getElementById('escolher').onclick = () => escolher()
