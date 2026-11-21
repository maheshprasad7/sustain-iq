import fs from 'node:fs';

async function main() {
  const vres = await fetch('http://127.0.0.1:9222/json').catch(() => null);
  if (!vres) {
    console.error('Cannot connect to Chrome DevTools port 9222');
    process.exit(1);
  }
  const tabs = await vres.json();
  const tab = tabs.find(t => t.type === 'page') || tabs[0];
  const ws = new WebSocket(tab.webSocketDebuggerUrl);

  let id = 1;
  const send = (method, params = {}) => new Promise((resolve) => {
    const curId = id++;
    const handler = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.id === curId) {
        ws.removeEventListener('message', handler);
        resolve(msg.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: curId, method, params }));
  });

  ws.onopen = async () => {
    // --- 1. DESKTOP CAPTURES (1440x900) ---
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });
    await send('Page.reload');
    await new Promise(r => setTimeout(r, 2000));

    // Capture 1: Showing full untrimmed ceiling crystals + "Have Any Questions?"
    await send('Runtime.evaluate', { 
      expression: 'targetScroll = currentScroll = document.getElementById("faq").offsetTop + 180; window.scrollTo(0, targetScroll);' 
    });
    await new Promise(r => setTimeout(r, 1200));
    let shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('c:/sus/desktop_geode_untrimmed_top.png', Buffer.from(shot.data, 'base64'));

    // Capture 2: Showing "Have Any Questions?" clearly above the banner
    await send('Runtime.evaluate', { 
      expression: 'targetScroll = currentScroll = document.getElementById("faq").offsetTop + 440; window.scrollTo(0, targetScroll);' 
    });
    await new Promise(r => setTimeout(r, 1200));
    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('c:/sus/desktop_geode_untrimmed_banner.png', Buffer.from(shot.data, 'base64'));

    // --- 2. MOBILE CAPTURES (390x844) ---
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });
    await send('Page.reload');
    await new Promise(r => setTimeout(r, 2000));

    await send('Runtime.evaluate', { 
      expression: 'targetScroll = currentScroll = document.getElementById("faq").offsetTop + 100; window.scrollTo(0, targetScroll);' 
    });
    await new Promise(r => setTimeout(r, 1200));
    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('c:/sus/mobile_geode_untrimmed_banner.png', Buffer.from(shot.data, 'base64'));

    console.log('Untrimmed screenshots captured successfully!');
    ws.close();
    process.exit(0);
  };
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
