

async function run() {
  const vres = await fetch('http://127.0.0.1:9222/json');
  const tabs = await vres.json();
  const ws = new WebSocket(tabs[0].webSocketDebuggerUrl);
  let id = 1;
  const send = (m, p = {}) => new Promise(r => {
    const cur = id++;
    const h = e => { const msg = JSON.parse(e.data); if (msg.id === cur) { ws.removeEventListener('message', h); r(msg.result); } };
    ws.addEventListener('message', h);
    ws.send(JSON.stringify({ id: cur, method: m, params: p }));
  });
  ws.onopen = async () => {
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await send('Page.reload');
    await new Promise(r => setTimeout(r, 1800));

    const metrics = await send('Runtime.evaluate', {
      expression: '(() => {\n' +
        '  const faq = document.getElementById("faq");\n' +
        '  const ceil = document.getElementById("geodeCeiling");\n' +
        '  const heading = document.getElementById("geodeHeading");\n' +
        '  const banner = document.getElementById("geodeBanner");\n' +
        '  const cr = ceil.getBoundingClientRect();\n' +
        '  const hr = heading.getBoundingClientRect();\n' +
        '  const br = banner.getBoundingClientRect();\n' +
        '  return {\n' +
        '    faqTop: faq.offsetTop,\n' +
        '    ceilHeight: ceil.offsetHeight,\n' +
        '    headingOffsetTop: heading.offsetTop,\n' +
        '    headingHeight: heading.offsetHeight,\n' +
        '    bannerOffsetTop: banner.offsetTop,\n' +
        '    bannerHeight: banner.offsetHeight,\n' +
        '    bannerTopMinusHeadingBottom: banner.offsetTop - (heading.offsetTop + heading.offsetHeight),\n' +
        '    headingTopMinusCeilHeight: heading.offsetTop - ceil.offsetHeight\n' +
        '  };\n' +
        '})()',
      returnByValue: true
    });
    console.log('DESKTOP METRICS:', JSON.stringify(metrics.result.value, null, 2));

    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    await send('Page.reload');
    await new Promise(r => setTimeout(r, 1800));

    const mobileMetrics = await send('Runtime.evaluate', {
      expression: '(() => {\n' +
        '  const faq = document.getElementById("faq");\n' +
        '  const ceil = document.getElementById("geodeCeiling");\n' +
        '  const heading = document.getElementById("geodeHeading");\n' +
        '  const banner = document.getElementById("geodeBanner");\n' +
        '  return {\n' +
        '    faqTop: faq.offsetTop,\n' +
        '    ceilHeight: ceil.offsetHeight,\n' +
        '    headingOffsetTop: heading.offsetTop,\n' +
        '    headingHeight: heading.offsetHeight,\n' +
        '    bannerOffsetTop: banner.offsetTop,\n' +
        '    bannerHeight: banner.offsetHeight,\n' +
        '    bannerTopMinusHeadingBottom: banner.offsetTop - (heading.offsetTop + heading.offsetHeight),\n' +
        '    headingTopMinusCeilHeight: heading.offsetTop - ceil.offsetHeight\n' +
        '  };\n' +
        '})()',
      returnByValue: true
    });
    console.log('MOBILE METRICS:', JSON.stringify(mobileMetrics.result.value, null, 2));

    ws.close();
    process.exit(0);
  };
}
run();
