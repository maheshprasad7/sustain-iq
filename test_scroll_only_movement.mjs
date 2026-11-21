async function run() {
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
    await send('Page.reload');
    await new Promise(r => setTimeout(r, 2000));

    // Wait 2 full seconds so page is totally settled
    const sampleA = await send('Runtime.evaluate', {
      expression: '(() => ({\n' +
        '  t0: document.getElementById("geodeClusterLeft").style.transform,\n' +
        '  t1: document.getElementById("geodeClusterRight").style.transform,\n' +
        '  sh7: document.getElementById("geodeFloatingCube").style.transform\n' +
        '}))()',
      returnByValue: true
    });

    // Wait 2 seconds with NO SCROLLING
    await new Promise(r => setTimeout(r, 2000));

    const sampleB = await send('Runtime.evaluate', {
      expression: '(() => ({\n' +
        '  t0: document.getElementById("geodeClusterLeft").style.transform,\n' +
        '  t1: document.getElementById("geodeClusterRight").style.transform,\n' +
        '  sh7: document.getElementById("geodeFloatingCube").style.transform\n' +
        '}))()',
      returnByValue: true
    });

    console.log('Sample A (idle):', sampleA.result.value);
    console.log('Sample B (idle 2s later):', sampleB.result.value);

    const isIdentical = JSON.stringify(sampleA.result.value) === JSON.stringify(sampleB.result.value);
    console.log('COMPLETELY STATIONARY WHEN NOT SCROLLING:', isIdentical);

    ws.close();
    process.exit(0);
  };
}

run();
