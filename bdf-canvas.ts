export class BDFFont {
  private glyphs: any
  private properties: any
  public size: number

  constructor(public readonly ctx: CanvasRenderingContext2D, bdf: string) {
    this.applyFont(bdf)
  }

  applyFont(bdf: string) {
    this.glyphs = {}
    this.properties = {}
    const lines = bdf.split(/\n/)

    let glyph = null,
      properties = null
    for (let i = 0, len = lines.length; i < len; i++) {
      const line = lines[i]

      if (glyph) {
        if (line !== 'ENDCHAR') {
          if (!glyph['BITMAP']) {
            const d = line.split(' ')
            switch (d[0]) {
              case 'ENCODING':
                glyph['ENCODING'] = +d[1]
                break
              case 'SWIDTH':
                glyph['SWIDTH'] = {
                  x: +d[1],
                  y: +d[2],
                }
                break
              case 'DWIDTH':
                glyph['DWIDTH'] = {
                  x: +d[1],
                  y: +d[2],
                }
                break
              case 'BBX':
                glyph['BBw'] = +d[1]
                glyph['BBh'] = +d[2]
                glyph['BBox'] = +d[3]
                glyph['BBoy'] = +d[4]
                break
              case 'ATTRIBUTES':
                break
              case 'BITMAP':
                glyph['BITMAP'] = []
                break
            }
          } else {
            glyph['BITMAP'].bits = line.length * 4
            glyph['BITMAP'].push(parseInt(line, 16))
          }
        } else {
          this.glyphs[glyph['ENCODING']] = glyph
          glyph = null
        }
      } else if (properties) {
        if (line !== 'ENDPROPERTIES') {
          const d = line.split(' ', 2)
          properties[d[0]] =
            d[1][0] === '"' ? d[1].substring(1, d[1].length - 2) : +d[1]
        } else {
          this.properties = properties
          properties = null
        }
      } else {
        const d = line.split(' ')
        switch (d[0]) {
          case 'COMMENT':
            break
          case 'FONT':
            this['FONT'] = d[1]
            break
          case 'SIZE':
            this['SIZE'] = {
              size: +d[1],
              xres: +d[2],
              yres: +d[3],
            }
            break
          case 'FONTBOUNDINGBOX':
            this['FONTBOUNDINGBOX'] = {
              w: +d[1],
              h: +d[2],
              x: +d[3],
              y: +d[4],
            }
            break
          case 'STARTPROPERTIES':
            properties = {}
            break
          case 'CHARS':
            this['CHARS'] = +d[1]
            break
          case 'STARTCHAR':
            glyph = {}
            break
          case 'ENDCHAR':
            break
        }
      }
    }
    this.size = this.properties.PIXEL_SIZE
  }

  private getGlyphOf(c: number) {
    return this.glyphs[c] || this.glyphs[this.properties['DEFAULT_CHAR']]
  }

  private drawChar(c: number, bx: number, by: number) {
    const g = this.getGlyphOf(c)
    const b = g['BITMAP']
    const ox = bx + g['BBox'] - 1
    const oy = by - g['BBoy'] - g['BBh'] + 1
    for (let y = 0, len = b.length; y < len; y++) {
      const l = b[y]
      for (let i = b.bits, x = 0; i >= 0; i--, x++) {
        if (((l >> i) & 0x01) == 1) {
          this.ctx.fillRect(ox + x, oy + y, 1, 1)
        }
      }
    }
    return { x: bx + g['DWIDTH'].x, y: by + g['DWIDTH'].y }
  }

  private measureText(text: string): IMetrics {
    const ret = {
      width: 0,
      height: 0,
    }
    for (var i = 0, len = text.length; i < len; i++) {
      const c = text[i].charCodeAt(0)
      const g = this.getGlyphOf(c)
      ret.width += g['DWIDTH'].x
      ret.height += g['DWIDTH'].y
    }
    return ret
  }

  private writeLine(text: string, x: number, y: number) {
    for (let i = 0, len = text.length; i < len; i++) {
      const c = text[i].charCodeAt(0)
      const r = this.drawChar(c, x, y)
      x = r.x
      y = r.y
    }
  }

  //https://www.html5canvastutorials.com/tutorials/html5-canvas-wrap-text-tutorial/
  /** @returns bottom of the box */
  writeText(
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    align: TAlign
  ) {
    const words = text.split(' ')
    let line = ''
    let metrics: IMetrics
    function getX() {
      const freeSpace = maxWidth - metrics.width
      switch (align) {
        case 'esquerda':
          return x
        case 'centro':
          return x + Math.floor(freeSpace / 2)
        case 'direita':
          return x + freeSpace
      }
    }
    y += this.size
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' '
      const newMetrics = this.measureText(testLine)
      if (newMetrics.width > maxWidth && n > 0) {
        this.writeLine(line, getX(), y)
        line = words[n] + ' '
        y += this.size
      } else {
        line = testLine
      }
      metrics = newMetrics
    }
    this.writeLine(line, getX(), y)
    return y
  }
}

interface IMetrics {
  width: number
  height: number
}

export type TAlign = 'esquerda' | 'centro' | 'direita'
