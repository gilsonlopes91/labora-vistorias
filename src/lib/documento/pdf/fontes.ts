import { Font } from '@react-pdf/renderer'

export interface FontesPoppins {
  regular: string
  italico: string
  medio: string
  seminegrito: string
  negrito: string
}

/** TTF do Poppins no Google Fonts (licença OFL). O navegador baixa na hora de gerar o PDF.
 *  Para hospedar no próprio app, suba os arquivos e use fontesDaPasta('/fonts/poppins'). */
export const FONTES_GOOGLE: FontesPoppins = {
  regular: 'https://fonts.gstatic.com/s/poppins/v24/pxiEyp8kv8JHgFVrJJfedw.ttf',
  italico: 'https://fonts.gstatic.com/s/poppins/v24/pxiGyp8kv8JHgFVrJJLucHtF.ttf',
  medio: 'https://fonts.gstatic.com/s/poppins/v24/pxiByp8kv8JHgFVrLGT9Z1xlEA.ttf',
  seminegrito: 'https://fonts.gstatic.com/s/poppins/v24/pxiByp8kv8JHgFVrLEj6Z1xlEA.ttf',
  negrito: 'https://fonts.gstatic.com/s/poppins/v24/pxiByp8kv8JHgFVrLCz7Z1xlEA.ttf',
}

/** Fontes numa pasta (ou URL base) com Poppins-Regular.ttf, -Italic, -Medium, -SemiBold e -Bold. */
export const fontesDaPasta = (base: string): FontesPoppins => ({
  regular: `${base}/Poppins-Regular.ttf`,
  italico: `${base}/Poppins-Italic.ttf`,
  medio: `${base}/Poppins-Medium.ttf`,
  seminegrito: `${base}/Poppins-SemiBold.ttf`,
  negrito: `${base}/Poppins-Bold.ttf`,
})

let registrado = false

export function registrarFontes(fontes: FontesPoppins = FONTES_GOOGLE) {
  if (registrado) return
  Font.register({
    family: 'Poppins',
    fonts: [
      { src: fontes.regular, fontWeight: 400 },
      { src: fontes.italico, fontWeight: 400, fontStyle: 'italic' },
      { src: fontes.medio, fontWeight: 500 },
      { src: fontes.seminegrito, fontWeight: 600 },
      { src: fontes.negrito, fontWeight: 700 },
    ],
  })
  Font.registerHyphenationCallback((palavra) => [palavra])
  registrado = true
}
