/** Use the ImageData from a Canvas and turn the image in a 1-bit black and white image using dithering */
export class CanvasDither {
  private readonly width: number
  private readonly height: number
  
  private _imageData: ImageData

  public get imageData() : ImageData {
    return this._imageData
  }

  private constructor(
    private readonly fullImageData: ImageData,
    private readonly context: CanvasRenderingContext2D
  ) {
    const width = this.width = fullImageData.width
    const height = this.height = fullImageData.height
    this._imageData = context.getImageData(0, 0, width, height)
    this.updateView()
  }

  static async create(imageUrl: string, canvas?: HTMLCanvasElement) {
    if (!canvas) canvas = document.createElement('canvas')
    // Devemos limitar o tamanho, enquanto na edicao usando um valor maximo, tipo 500, e durante impressao de nfce usando a largura da nota e um maximo padrao de altura
    const image = new Image()
    await new Promise<void>((v) => {
      image.onload = () => v()
      image.src = imageUrl
    })

    const width = canvas.width = image.width
    const height = canvas.height = image.height
    
    const context = canvas.getContext('2d')!
    context.drawImage(image, 0, 0)
    const imageData = context.getImageData(0, 0, width, height)

    return new CanvasDither(imageData, context)
  }

  private updateView(newData?: ImageData) {
    this.context.clearRect(0, 0, this.width, this.height)
    if (newData) this.context.putImageData(newData, 0, 0)
  }

  /** Change the image to blank and white using a simple threshold */
  threshold(threshold: number) {
    const image = this.fullImageData
    const out = this._imageData

    for (let i = 0; i < image.data.length; i += 4) {
      const luminance =
        image.data[i] * 0.299 +
        image.data[i + 1] * 0.587 +
        image.data[i + 2] * 0.114
      const value = luminance < threshold ? 255 : 0
      out.data.fill(0, i, i + 2)
      out.data[i + 3] = value
    }
    
    this.updateView(out)
  }

  /** Change the image to blank and white using the Bayer algorithm */
  bayer(threshold: number) {
    const image = this.fullImageData
    const out = this._imageData

    const thresholdMap = [
      [15, 135, 45, 165],
      [195, 75, 225, 105],
      [60, 180, 30, 150],
      [240, 120, 210, 90],
    ]

    for (let i = 0; i < image.data.length; i += 4) {
      const luminance =
        image.data[i] * 0.299 +
        image.data[i + 1] * 0.587 +
        image.data[i + 2] * 0.114

      const x = (i / 4) % image.width
      const y = Math.floor(i / 4 / image.width)
      const map = Math.floor((luminance + thresholdMap[x % 4][y % 4]) / 2)
      const value = map < threshold ? 255 : 0
      out.data.fill(0, i, i + 2)
      out.data[i + 3] = value
    }

    this.updateView(out)
  }

  /** Change the image to blank and white using the Floyd-Steinberg algorithm */
  floydsteinberg() {
    const image = this.fullImageData
    const out = this._imageData

    const width = image.width
    const luminance = new Uint8ClampedArray(image.width * image.height)

    for (let l = 0, i = 0; i < image.data.length; l++, i += 4) {
      luminance[l] =
        image.data[i] * 0.299 +
        image.data[i + 1] * 0.587 +
        image.data[i + 2] * 0.114
    }

    for (let l = 0, i = 0; i < image.data.length; l++, i += 4) {
      const value = luminance[l] < 129 ? 255 : 0
      out.data.fill(0, i, i + 2)
      out.data[i + 3] = value

      const error = Math.floor((luminance[l] - value) / 16)
      luminance[l + 1] += error * 7
      luminance[l + width - 1] += error * 3
      luminance[l + width] += error * 5
      luminance[l + width + 1] += error * 1
    }

    this.updateView(out)
  }

  /** Change the image to blank and white using the Atkinson algorithm */
  atkinson() {
    const image = this.fullImageData
    const out = this._imageData

    const width = image.width
    const luminance = new Uint8ClampedArray(image.width * image.height)

    for (let l = 0, i = 0; i < image.data.length; l++, i += 4) {
      luminance[l] =
        image.data[i] * 0.299 +
        image.data[i + 1] * 0.587 +
        image.data[i + 2] * 0.114
    }

    for (let l = 0, i = 0; i < image.data.length; l++, i += 4) {
      const value = luminance[l] < 129 ? 255 : 0
      out.data.fill(0, i, i + 2)
      out.data[i + 3] = value

      const error = Math.floor((luminance[l] - value) / 8)
      luminance[l + 1] += error
      luminance[l + 2] += error
      luminance[l + width - 1] += error
      luminance[l + width] += error
      luminance[l + width + 1] += error
      luminance[l + 2 * width] += error
    }

    this.updateView(out)
  }
}
