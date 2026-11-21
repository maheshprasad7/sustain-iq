import fs from 'node:fs';
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
    await send('Runtime.evaluate', { 
      expression: 'targetScroll = currentScroll = document.getElementById("faq").offsetTop + document.getElementById("faq").offsetHeight - 900; window.scrollTo(0, targetScroll);' 
    });
    await new Promise(r => setTimeout(r, 1000));
    let shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('c:/sus/desktop_geode_bottom.png', Buffer.from(shot.data, 'base64'));

    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    await send('Page.reload');
    await new Promise(r => setTimeout(r, 1800));
    await send('Runtime.evaluate', { 
      expression: 'targetScroll = currentScroll = document.getElementById("faq").offsetTop + document.getElementById("faq").offsetHeight - 844; window.scrollTo(0, targetScroll);' 
    });
    await new Promise(r => setTimeout(r, 1000));
    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('c:/sus/mobile_geode_bottom.png', Buffer.from(shot.data, 'base64'));

    ws.close();
    process.exit(0);
  };
}
run();
