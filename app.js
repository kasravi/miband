var sw;

const requestNotificationPermission = async () => {
  const permission = await window.Notification.requestPermission();
  if(permission !== 'granted'){
      throw new Error('Permission not granted for Notification');
  }
}

const showLocalNotification = (title, body) => {
  // const options = {
  //   "//": "Visual Options",
  //   "body": "<String>",
  //   "icon": "<URL String>",
  //   "image": "<URL String>",
  //   "badge": "<URL String>",
  //   "vibrate": "<Array of Integers>",
  //   "sound": "<URL String>",
  //   "dir": "<String of 'auto' | 'ltr' | 'rtl'>",
  //   "//": "Behavioural Options",
  //   "tag": "<String>",
  //   "data": "<Anything>",
  //   "requireInteraction": "<boolean>",
  //   "renotify": "<Boolean>",
  //   "silent": "<Boolean>",
  //   "//": "Both Visual & Behavioural Options",
  //   "actions": "<Array of Strings>",
  //   "//": "Information Option. No visual affect.",
  //   "timestamp": "<Long>"
  // }
  const options = {
      body,
      // here you can add more properties like icon, image, vibrate, etc.
  };
  sw.showNotification(title, options);
}

async function registerSW() { 
  if ('serviceWorker' in navigator) { 
    try {
      let res = await navigator.serviceWorker.register('./sw.js'); 
      return res;
    } catch (e) {
      throw e 
    }
  } else {
    document.querySelector('.alert').removeAttribute('hidden'); 
  }
}
var noSleep;
window.addEventListener('load', async e => {
  sw = await registerSW()
  permission = await requestNotificationPermission();
  noSleep = new NoSleep();
});

const messageChannel = new MessageChannel();

navigator.serviceWorker.controller.postMessage({
  type: 'INIT_PORT',
}, [messageChannel.port2]);

messageChannel.port1.onmessage = (event) => {
  if(event.data.type === 'vibrate'){
    miBand.vibrate();
  }
};


var statusText = document.querySelector('#statusText');
var subStatusText = document.querySelector('#subStatusText');
var deviceInfo = document.querySelector('#deviceInfo');
var stretchLink = document.querySelector('#stretch');

var offset = 0;

statusText.addEventListener('click', function () {
  
  if (miBand.device && miBand.device.gatt.connected) {
    return;
  } else {
    statusText.textContent = 'Connecting...';
    let arr = [];

    miBand.connect()
      .then(() => miBand.getDeviceName())
      .then(data => arr.push(data))
      .then(() => miBand.getBatteryInfo())
      .then(data => arr.push(data))
      .then(() => miBand.getDeviceInfo())
      .then(data => arr.push(data))
      .then(() => {
        let deviceName = arr[0].replace(/[^a-zA-Z0-9]/g,'');
        let batteryInfo = arr[1];
        let firmwareInfo = arr[2];

        let div = `
        <div class="left">Name:</div><div class="right">${deviceName}</div>
        <div class="left">Battery:</div><div class="right">${batteryInfo.get('batteryLevel')}%</div>
        <div class="left">Last charged:</div><div class="right">${new Date(batteryInfo.get('batteryLastCharge')).toGMTString()}</div>
        <div class="left">Total charges:</div><div class="right">${batteryInfo.get('batteryCharges')}</div>
        <div class="left">Firmware Version:</div><div class="right">${firmwareInfo.get('firmwareVersion')}</div>
        <div class="left">Profile version:</div><div class="right">${firmwareInfo.get('profileVersion')}</div>`;
        deviceInfo.innerHTML = div;
      })
      .then(() => statusText.textContent = 'Walk...')
      .then(() => miBand.startNotifications().then(handleNotifications))
      .then(() => {
        let reset = (localStorage.length === 0);
        return miBand.pair(reset);
      })
      .then(() => miBand.getSteps())
      .then(steps => {
        var today = new Date().toJSON().substr(0, 10);
        offset = steps - parseInt(localStorage.getItem(today) || 0);
        updateSteps(steps);
        return Promise.resolve();
      })
      .then(() => miBand.startNotificationsSteps().then(handleSteps))
      .catch(error => {
        statusText.textContent = error;
      });
  }
});

stretchStarted = false;

stretchLink.addEventListener('click',async function(){
  if(stretchStarted){
    noSleep.disable();
    stretchStarted=false;
    navigator.serviceWorker.ready.then(function(swRegistration) {
      return swRegistration.sync.register('stretch-stop');
    });
    return;
  }
  noSleep.enable();
  stretchStarted = true;
  navigator.serviceWorker.ready.then(function(swRegistration) {
    return swRegistration.sync.register('stretch-start');
  });
  
})

function handleNotifications(notifiCharacteristic) {
  notifiCharacteristic.addEventListener('characteristicvaluechanged', event => {
  })
}

function handleSteps(stepsCharacteristic) {
  stepsCharacteristic.addEventListener('characteristicvaluechanged', event => {
    var data = event.target.value;
    var steps = miBand.parseSteps(data);
    console.debug('NOTIFY', stepsCharacteristic.uuid, steps);

    var today = new Date().toJSON().substr(0, 10);
    // localStorage.setItem(today, (steps - offset > 0) ? steps - offset : steps);
    localStorage.setItem(today, steps);

    updateSteps(steps);
    updateStats();
  });
}

function updateSteps(steps) {
  var today = new Date().toJSON().substr(0, 10);
  localStorage.setItem(today, steps);

  var player = statusText.animate([
    { transform: 'scale(1)', opacity: 1 },
    { transform: 'scale(.8)', opacity: .2 }
  ], { duration: 120, easing: 'ease-out'});
  player.onfinish = function(e) {
    statusText.innerHTML =  steps + ' &#x1f463';
    statusText.animate([
      { transform: 'scale(.8)', opacity: .2 },
      { transform: 'scale(1)', opacity: 1 }
    ], { duration: 120, easing: 'ease-in'});
  };
}

function updateStats() {
  var stats = '';
  Object.keys(localStorage).reverse().filter(e => e.startsWith('20')).forEach(key => {
    var day = new Date(key).toDateString().slice(0, -5);
    stats += '<div class="date">' + day + '</div>' +
        '<div class="steps">' + localStorage.getItem(key) + '</div>';
  });
  subStatusText.innerHTML = stats;
}

updateStats();

// challengeLink.addEventListener('click', function (event) {
//   event.preventDefault();

//   let today = new Date().toJSON().substr(0, 10);
//   let initialSteps = localStorage.getItem(today);

//   startTimer(20, document.querySelector('#time'), function() {
//     let currentSteps = localStorage.getItem(today);
//     let actualSteps =  currentSteps - initialSteps || 0;

//     let leader = localStorage.getItem('leader') ? JSON.parse(localStorage.getItem('leader')) : null;

//     if (leader == null || leader.steps < actualSteps) {
//       let newLeader = createNewLeader(actualSteps);
//       localStorage.setItem('leader', JSON.stringify(newLeader));
//       updateChallenge();
//     } else {
//       let flashMessage =  document.querySelector('#challenge .message');
//       flashMessage.innerHTML = `${actualSteps} steps wasn't good enough! Please try again!`;

//        setInterval(function() {
//         flashMessage.style.display = (flashMessage.style.display == 'none' ? '' : 'none');
//     }, 3000);
//     }
//   });
// });

// function createNewLeader(steps) {
//   let name = prompt(`New Record: ${steps} steps!\n\nPlease enter your name for the leaderboard`, 'default'); 

//   if (name != null) {
//      let info = {
//        name,
//        steps
//      };

//      return info;
//   }
// }

// function updateChallenge() {
//   let leader = localStorage.getItem('leader');
//   if (leader) {
//     leader = JSON.parse(leader);
//     document.querySelector('#result').innerHTML = `<div class="date">${leader.name}</div><div class="steps">${leader.steps}</div>`;
//   }
// };
// updateChallenge();

// function startTimer(duration, display, cb) {
//        var start = Date.now(),
//         diff,
//         minutes,
//         seconds;
//     function timer() {
//         // get the number of seconds that have elapsed since 
//         // startTimer() was called
//         diff = duration - (((Date.now() - start) / 1000) | 0);

//         // does the same job as parseInt truncates the float
//         minutes = (diff / 60) | 0;
//         seconds = (diff % 60) | 0;

//         minutes = minutes < 10 ? "0" + minutes : minutes;
//         seconds = seconds < 10 ? "0" + seconds : seconds;

//         display.textContent = minutes + ":" + seconds; 

//         if (diff === 0) {
//           clearInterval(i);
//           display.textContent = `00:${duration}`;
//           if (cb) cb();
//         }
//         else if (diff <= 0) {
//             // add one second so that the count down starts at the full duration
//             // example 05:00 not 04:59
//             start = Date.now() + 1000;
//         }
//     };
//     // we don't want to wait a full second before the timer starts
//     timer();
//     var i = setInterval(timer, 1000);
// }