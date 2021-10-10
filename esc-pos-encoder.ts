import Dither from 'canvas-dither'
import Flatten from 'canvas-flatten'

/** Create a byte stream based on commands for ESC/POS printers */
export class EscPosEncoder {
  private buffer = []
  private queued = []
  private cursor = 0

  constructor(private readonly imageMode: 'column' | 'raster') {}

  private reset() {
    this.buffer = []
    this.queued = []
    this.cursor = 0
  }

  private queue(value) {
    value.forEach((item) => this.queued.push(item))
  }

  private flush() {
    this.buffer = this.buffer.concat(this.queued)
    this.queued = []
    this.cursor = 0
  }

  public newline(): this {
    this.flush()
    this.queue([0x0a, 0x0d])
    return this
  }

  public image(
    canvas: HTMLCanvasElement,
    algorithm: string = 'threshold',
    threshold: number = 200
  ): this {
    const width = canvas.width
    const height = canvas.height

    if (width % 8 !== 0) {
      throw new Error('Width must be a multiple of 8')
    }

    if (height % 8 !== 0) {
      throw new Error('Height must be a multiple of 8')
    }

    const context = canvas.getContext('2d')
    let image = context.getImageData(0, 0, width, height)

    image = Flatten.flatten(image, [0xff, 0xff, 0xff])

    switch (algorithm) {
      case 'threshold':
        image = Dither.threshold(image, threshold)
        break
      case 'bayer':
        image = Dither.bayer(image, threshold)
        break
      case 'floydsteinberg':
        image = Dither.floydsteinberg(image)
        break
      case 'atkinson':
        image = Dither.atkinson(image)
        break
    }

    const getPixel = (x: number, y: number) =>
      x < width && y < height
        ? image.data[(width * y + x) * 4] > 0
          ? 0
          : 1
        : 0

    if (this.cursor != 0) {
      this.newline()
    }

    /* Encode images with ESC * */
    if (this.imageMode == 'column') {
      this.queue([0x1b, 0x33, 0x24])

      const columnData = []
      for (let s = 0; s < Math.ceil(height / 24); s++) {
        const bytes = new Uint8Array(width * 3)
        for (let x = 0; x < width; x++) {
          for (let c = 0; c < 3; c++) {
            for (let b = 0; b < 8; b++) {
              bytes[x * 3 + c] |= getPixel(x, s * 24 + b + 8 * c) << (7 - b)
            }
          }
        }
        columnData.push(bytes)
      }

      columnData.forEach((bytes) => {
        this.queue([
          0x1b,
          0x2a,
          0x21,
          width & 0xff,
          (width >> 8) & 0xff,
          bytes,
          0x0a,
        ])
      })

      this.queue([0x1b, 0x32])
    }

    /* Encode images with GS v */
    if (this.imageMode == 'raster') {
      const rowData = new Uint8Array((width * height) >> 3)
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x = x + 8) {
          for (let b = 0; b < 8; b++) {
            rowData[y * (width >> 3) + (x >> 3)] |=
              getPixel(x + b, y) << (7 - b)
          }
        }
      }
      this.queue([
        0x1d,
        0x76,
        0x30,
        0x00,
        (width >> 3) & 0xff,
        ((width >> 3) >> 8) & 0xff,
        height & 0xff,
        (height >> 8) & 0xff,
        rowData,
      ])
    }

    this.flush()
    return this
  }

  public cut(value: 'full' | 'partial'): this {
    let data = value == 'partial' ? 0x01 : 0x00
    this.queue([0x1d, 0x56, data])
    return this
  }

  public encode(): Uint8Array {
    this.flush()
    const length = this.buffer
      .map((v) => (typeof v === 'number' ? 1 : v.length))
      .reduce((p, v) => p + v, 0)
    const result = new Uint8Array(length)
    let index = 0
    this.buffer.forEach((item) => {
      if (typeof item === 'number') {
        result[index] = item
        index++
      } else {
        result.set(item, index)
        index += item.length
      }
    })
    this.reset()
    return result
  }
}
