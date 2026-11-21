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
    console.log('Connected to Chrome DevTools Protocol');

    // --- 1. DESKTOP CAPTURES (1440x900) ---
    console.log('Testing Desktop (1440x900)...');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });
    await send('Page.reload');
    await new Promise(r => setTimeout(r, 2000));

    // Scroll to transition between Cavern and Geode (ceiling seam)
    await send('Runtime.evaluate', { 
      expression: 'targetScroll = currentScroll = document.getElementById("faq").offsetTop - 200; window.scrollTo(0, targetScroll);' 
    });
    await new Promise(r => setTimeout(r, 1200));
    let shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('c:/sus/desktop_geode_transition.png', Buffer.from(shot.data, 'base64'));

    // Scroll to Geode banner view (Heading + Banner + Crystals)
    await send('Runtime.evaluate', { 
      expression: 'targetScroll = currentScroll = document.getElementById("faq").offsetTop + 350; window.scrollTo(0, targetScroll);' 
    });
    await new Promise(r => setTimeout(r, 1200));
    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('c:/sus/desktop_geode_full.png', Buffer.from(shot.data, 'base64'));

    // Scroll to Geode bottom transition
    await send('Runtime.evaluate', { 
      expression: 'targetScroll = currentScroll = document.getElementById("faq").offsetTop + 850; window.scrollTo(0, targetScroll);' 
    });
    await new Promise(r => setTimeout(r, 1200));
    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('c:/sus/desktop_geode_bottom.png', Buffer.from(shot.data, 'base64'));

    // Test FAQ modal
    await send('Runtime.evaluate', { 
      expression: 'document.getElementById("geodeFaqBtn").click();' 
    });
    await new Promise(r => setTimeout(r, 600));
    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('c:/sus/desktop_faq_modal.png', Buffer.from(shot.data, 'base64'));

    // Close modal
    await send('Runtime.evaluate', { 
      expression: 'document.getElementById("faqModalClose").click();' 
    });
    await new Promise(r => setTimeout(r, 600));

    // --- 2. MOBILE CAPTURES (390x844) ---
    console.log('Testing Mobile (390x844)...');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });
    await send('Page.reload');
    await new Promise(r => setTimeout(r, 2000));

    // Mobile transition between Cavern bottom and Geode top
    await send('Runtime.evaluate', { 
      expression: 'targetScroll = currentScroll = document.getElementById("faq").offsetTop - 100; window.scrollTo(0, targetScroll);' 
    });
    await new Promise(r => setTimeout(r, 1200));
    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('c:/sus/mobile_geode_transition.png', Buffer.from(shot.data, 'base64'));

    // Mobile Geode Banner view
    await send('Runtime.evaluate', { 
      expression: 'targetScroll = currentScroll = document.getElementById("faq").offsetTop + 180; window.scrollTo(0, targetScroll);' 
    });
    await new Promise(r => setTimeout(r, 1200));
    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('c:/sus/mobile_geode_banner.png', Buffer.from(shot.data, 'base64'));

    // Mobile Geode Bottom view
    await send('Runtime.evaluate', { 
      expression: 'targetScroll = currentScroll = document.getElementById("faq").offsetTop + 650; window.scrollTo(0, targetScroll);' 
    });
    await new Promise(r => setTimeout(r, 1200));
    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('c:/sus/mobile_geode_bottom.png', Buffer.from(shot.data, 'base64'));

    console.log('All screenshots captured successfully!');
    ws.close();
    process.exit(0);
  };
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
