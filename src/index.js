const path = require('path')
const puppeteer = require('puppeteer')

const convertToValidXML = html => {
  // <br> tags in valid HTML (from innerHTML) look like <br>, but they must look like <br/> to be valid XML (such as SVG)
  return html.replace(/<br>/gi, '<br/>')
}

const svgConfigDefault = {
  width: 800,
  height: 600,
  backgroundColor: 'white',
  deviceScaleFactor: 1,
}

const puppeteerConfigDefault = {
  args: ['--no-sandbox'],
}

const parseMMD = async (browser, definition, mermaidConfig, myCSS, svgConfig) => {
  mermaidConfig = Object.assign({ theme: 'default' }, mermaidConfig)
  const page = await browser.newPage()
  const width = svgConfig.width
  const height = svgConfig.height
  const deviceScaleFactor = svgConfig.deviceScaleFactor
  page.setViewport({ width, height, deviceScaleFactor })
  await page.goto(`file://${path.join(__dirname, 'index.html')}`)
  await page.evaluate(`document.body.style.background = '${svgConfig.backgroundColor}'`)
  const result = await page.$eval('#container', (container, definition, mermaidConfig, myCSS) => {
    container.textContent = definition
    window.mermaid.initialize(mermaidConfig)
    if (myCSS) {
      const head = window.document.head || window.document.getElementsByTagName('head')[0]
      const style = document.createElement('style')
      // style.type = 'text/css'
      if (style.styleSheet) {
        style.styleSheet.cssText = myCSS
      } else {
        style.appendChild(document.createTextNode(myCSS))
      }
      head.appendChild(style)
    }

    try {
      window.mermaid.init(undefined, container)
      return { status: 'success' };
    } catch (error) {
      return { status: 'error', error, message: error.message };
    }
  }, definition, mermaidConfig, myCSS)
  if (result.status === 'error') {
    error(result.message);
  }

  const svg = await page.$eval('#container', (container, backgroundColor) => {
    const svg = container.getElementsByTagName?.('svg')?.[0]
    if (svg.style) {
      svg.style.backgroundColor = backgroundColor
    } else {
      warn("svg not found. Not applying background color.")
    }
    return container.innerHTML
  }, svgConfig.backgroundColor)
  const svg_xml = convertToValidXML(svg)
  return svg_xml
}

const mmd2svg = async (definition, mermaidConfig, puppeteerConfig, myCSS, svgConfig) => {
  puppeteerConfig = Object.assign({}, puppeteerConfigDefault, puppeteerConfig)
  svgConfig = Object.assign({}, svgConfigDefault, svgConfig)
  const browser = await puppeteer.launch(puppeteerConfig)
  const svg_xml = await parseMMD(browser, definition, mermaidConfig, myCSS, svgConfig);
  await browser.close()
  return svg_xml
}
exports.mmd2svg = mmd2svg
