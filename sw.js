const cacheName = 'pwa-conf-v1';
const staticAssets = [
    './',
    './index.html',
    './app.js',
    './styles.css',
    './miBand.js'
];

self.addEventListener('install', async event => {
    const cache = await caches.open(cacheName);
    await cache.addAll(staticAssets);
});

async function cacheFirst(req) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(req);
    return cachedResponse || fetch(req);
}

self.addEventListener('fetch', async event => {
    const req = event.request;
    event.respondWith(cacheFirst(req));
});

async function wait(s){
  return new Promise((resolve)=>{setTimeout(()=>resolve(),s*1000)})
}
var stretchStarted = false;
var stretchTimes = [1,3];

this.addEventListener('sync', async function(event){
  if(event.tag == 'stretch-start'){
    stretchTimerFuncSync()
  }
  if(event.tag == 'stretch-stop'){
    stretchStarted = false;
  }
})

stretchTimerFuncSync = () => {
  stretchTimerFunc().then(()=>console.log('done'))
}

stretchTimerFunc = async () => {
  stretchStarted = true;
    try{
      count=0;
      while(stretchStarted){
        getVersionPort.postMessage({ type:'vibrate' });
        await wait(stretchTimes[count])
        count++;
        count%=2;
      }
    }catch(e){
      console.log(JSON.stringify(e))
    }
}

let getVersionPort;

self.addEventListener("message", event => {
  if (event.data && event.data.type === 'INIT_PORT') {
    getVersionPort = event.ports[0];
  }

})
