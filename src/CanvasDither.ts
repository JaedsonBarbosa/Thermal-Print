export enum TamanhoImagem {
  P = 0.4,
  M = 0.6,
  G = 0.8,
}

export enum DitheringMethod {
  threshold,
  bayer,
  floydsteinberg,
  atkinson,
}

/** Use the ImageData from a Canvas and turn the image in a 1-bit black and white image using dithering */
export class CanvasDither {
  private _imageData: ImageData

  public get imageData(): ImageData {
    return this._imageData
  }

  private _ditheringMethod: DitheringMethod = DitheringMethod.atkinson

  public get ditheringMethod(): DitheringMethod {
    return this._ditheringMethod
  }

  public set ditheringMethod(v: DitheringMethod) {
    this._ditheringMethod = v
    this.updateView()
  }

  private constructor(
    private readonly fullImageData: ImageData,
    private readonly context: CanvasRenderingContext2D
  ) {
    this._imageData = fullImageData
    this.updateView()
  }

  static async create(
    imageUrl: string,
    maxWidth: number,
    tamanho: TamanhoImagem,
    canvas?: HTMLCanvasElement
  ) {
    if (!canvas) canvas = document.createElement('canvas')

    const image = new Image()
    await new Promise<void>((v) => {
      image.onload = () => v()
      image.src = imageUrl
    })
    
    const srcWidth = image.width
    const srcHeight = image.height
    const width = Math.floor(srcWidth * maxWidth * tamanho / srcWidth)
    const height = Math.round(srcHeight * width / srcWidth)

    canvas.width = image.width = width
    canvas.height = image.height = height

    const context = canvas.getContext('2d')!
    context.drawImage(image, 0, 0, width, height)
    const imageData = context.getImageData(0, 0, width, height)

    return new CanvasDither(imageData, context)
  }

  private updateView() {
    const { data, width } = this.fullImageData
    const dataCopy = new Uint8ClampedArray(data)
    this._imageData = new ImageData(dataCopy, width)

    switch (this.ditheringMethod) {
      case DitheringMethod.threshold:
        this.threshold()
        break
      case DitheringMethod.bayer:
        this.bayer()
        break
      case DitheringMethod.floydsteinberg:
        this.floydsteinberg()
        break
      case DitheringMethod.atkinson:
        this.atkinson()
        break
    }
    this.context.putImageData(this._imageData, 0, 0)
  }

  /** Change the image to blank and white using a simple threshold */
  private threshold() {
    const threshold = 128
    const image = this._imageData

    for (let i = 0; i < image.data.length; i += 4) {
      const luminance =
        image.data[i] * 0.299 +
        image.data[i + 1] * 0.587 +
        image.data[i + 2] * 0.114
      const value = luminance < threshold ? 255 : 0
      image.data.fill(0, i, i + 3)
      image.data[i + 3] = value
    }
  }

  /** Change the image to blank and white using the Bayer algorithm */
  private bayer() {
    const threshold = 128
    const image = this._imageData

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
      image.data.fill(0, i, i + 3)
      image.data[i + 3] = value
    }
  }

  /** Change the image to blank and white using the Floyd-Steinberg algorithm */
  private floydsteinberg() {
    const image = this._imageData

    const width = image.width
    const luminance = new Uint8ClampedArray(image.width * image.height)

    for (let l = 0, i = 0; i < image.data.length; l++, i += 4) {
      luminance[l] =
        image.data[i] * 0.299 +
        image.data[i + 1] * 0.587 +
        image.data[i + 2] * 0.114
    }

    for (let l = 0, i = 0; i < image.data.length; l++, i += 4) {
      const value = luminance[l] < 129 ? 0 : 255
      const outValue = luminance[l] < 129 ? 255 : 0
      image.data.fill(0, i, i + 3)
      image.data[i + 3] = outValue

      const error = Math.floor((luminance[l] - value) / 16)
      luminance[l + 1] += error * 7
      luminance[l + width - 1] += error * 3
      luminance[l + width] += error * 5
      luminance[l + width + 1] += error * 1
    }
  }

  /** Change the image to blank and white using the Atkinson algorithm */
  private atkinson() {
    const image = this._imageData

    const width = image.width
    const luminance = new Uint8ClampedArray(image.width * image.height)

    for (let l = 0, i = 0; i < image.data.length; l++, i += 4) {
      luminance[l] =
        image.data[i] * 0.299 +
        image.data[i + 1] * 0.587 +
        image.data[i + 2] * 0.114
    }

    for (let l = 0, i = 0; i < image.data.length; l++, i += 4) {
      const value = luminance[l] < 129 ? 0 : 255
      const outValue = luminance[l] < 129 ? 255 : 0
      image.data.fill(0, i, i + 3)
      image.data[i + 3] = outValue

      const error = Math.floor((luminance[l] - value) / 8)
      luminance[l + 1] += error
      luminance[l + 2] += error
      luminance[l + width - 1] += error
      luminance[l + width] += error
      luminance[l + width + 1] += error
      luminance[l + 2 * width] += error
    }
  }
}
