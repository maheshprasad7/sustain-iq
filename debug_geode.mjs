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
    const res = await send('Runtime.evaluate', {
      expression: '(() => {\n' +
        '  const faq = document.getElementById("faq");\n' +
        '  const trans = document.getElementById("geodeTransition");\n' +
        '  const banner = document.getElementById("geodeBanner");\n' +
        '  return {\n' +
        '    faqOffsetTop: faq ? faq.offsetTop : null,\n' +
        '    faqHeight: faq ? faq.offsetHeight : null,\n' +
        '    bannerRect: banner ? banner.getBoundingClientRect() : null,\n' +
        '    transRect: trans ? trans.getBoundingClientRect() : null,\n' +
        '    transOffsetTop: trans ? trans.offsetTop : null,\n' +
        '    transHeight: trans ? trans.offsetHeight : null,\n' +
        '    bodyHeight: document.body.scrollHeight,\n' +
        '    maxScroll: document.documentElement.scrollHeight - window.innerHeight\n' +
        '  };\n' +
        '})()',
      returnByValue: true
    });
    console.log(JSON.stringify(res.result.value, null, 2));
    ws.close();
    process.exit(0);
  };
}
run();
