const APP_CACHE_NAME = 'band-pwa-morteza';
const STATIC_CACHE_NAME = 'band-pwa-morteza-static'
const staticAssets = [
    './',
    './index.html',
    './app.js',
    './styles.css',
    './miBand.js',
    './NoSleep.min.js'
];

self.addEventListener('install', async event => {
    const cache = await caches.open(APP_CACHE_NAME);
    await cache.addAll(staticAssets);
});

async function cacheFirst(req) {
    const cache = await caches.open(APP_CACHE_NAME);
    const cachedResponse = await cache.match(req);
    return cachedResponse || fetch(req);
}

self.addEventListener('fetch', async event => {
    const req = event.request;
    event.respondWith(cacheFirst(req));
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
      Promise.all([
          self.clients.claim(),
          caches.keys().then(function(cacheNames) {
              return Promise.all(
                  cacheNames.map(function(cacheName) {
                      if (cacheName !== APP_CACHE_NAME && cacheName !== STATIC_CACHE_NAME) {
                          console.log('deleting',cacheName);
                          return caches.delete(cacheName);
                      }
                  })
              );
          })
      ])
  );
});

self.addEventListener("message", event => {
  console.log(event.data)
})

async function wait(s){
  return new Promise((resolve)=>{setTimeout(()=>resolve(),s*1000)})
}
var stretchStarted = false;
var stretchTimes = [10,30];

this.addEventListener('sync', async function(event){
  if(event.tag == 'stretch-start'){
    stretchTimerFuncSync()
  }
  if(event.tag == 'stretch-stop'){
    stretchStop()
  }
})

stretchStop = () => {
  stretchStarted = false;
}

stretchTimerFuncSync = () => {
  stretchTimerFunc().then(()=>console.log('done'))
}

postMessage = msg => {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => client.postMessage(msg));
  });
}

stretchTimerFunc = async () => {
  stretchStarted = true;
    try{
      count=0;
      while(stretchStarted){
        postMessage({ type:'vibrate' });
        await wait(stretchTimes[count])
        count++;
        count%=2;
      }
    }catch(e){
      console.log(e)
    }
}


