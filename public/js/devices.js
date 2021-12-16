if(!localStorage.getItem('token')){
  window.location.href = "/login"
}
async function deleteDevice(key) {
  let raw = await fetch('/api/deldevice', {
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${window.localStorage.getItem('token')}`,
    },
    body: JSON.stringify({key: key}),
    method: 'POST'
  })
  let res = await raw.json();
  
  if(res.status != 'ok'){
    
    throw 'Erro ao deletar dispositivo'
  }
  window.location.reload()
}
async function renameDevice(key) {
  let value = $('#rename-input')[0].value;
  if(!value) return
  let raw = await fetch('/api/renamedevice', {
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${window.localStorage.getItem('token')}`,
    },
    body: JSON.stringify({key: key, name: value}),
    method: 'POST'
  })
  let res = await raw.json();
  if(res.status != 'ok'){
    let e = $('#error-rename')[0]
    e.innerHTML = res.status
  }else{
    window.location.reload()
  }
}
async function addDevice(key, name){
  if(!key) return
  let raw = await fetch('/api/adddevice', {
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${window.localStorage.getItem('token')}`,
    },
    body: JSON.stringify({key: key, name: name}),
    method: 'POST'
  })
  let res = await raw.json();
  if(res.status != 'ok'){
    $('.inesistente')[0].innerHTML = res.status
  }else{
    window.location.reload()
  }
}
function setErrorPage() {
  let load = $("#load")[0];
  let devicespott = $(".devices")[0];
  let error = $("#error")[0];
  load.classList.add("hidden");
  devicespott.classList.add("hidden");
  error.classList.remove("hidden");
}
function setLoadingPage(isLoading) {
  let load = $("#load")[0];
  let devicesspott = $(".devices")[0];
  if (isLoading) {
    load.classList.remove("hidden");
    devicesspott.classList.add("hidden");
  } else {
    load.classList.add("hidden");
    devicesspott.classList.remove("hidden");
  }
}
async function getDevicesAndLoad() {
  let raw = await fetch('/api/userdevices', {
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${window.localStorage.getItem('token')}`
    }
  })
  let res = await raw.json();
  let data = res.data
  let devicespott = $(".devices")[0]
  for(let i = 0; i< data.length;i++){
      let card = document.createElement('div')
      card.setAttribute("key", data[i].key);
      card.classList.add("card")
      card.innerHTML = `<div class="icon"><i class="fa fa-bolt" aria-hidden="true"></i></div><div class="info"><div class="name"><h3>${data[i].name}</h3><i class="fa fa-wrench" aria-hidden="true"></i></div><div class="other"><p>${data[i].key.slice(0, data[i].key.length - 15)+'...'}</p><i class="fa fa-trash" aria-hidden="true"></i></div></div>`
      devicespott.appendChild(card)
  }
}
function loadListeners() {
  let deletebuttons = $(".card .info .other i");
  let renamebuttons = $(".card .info .name i");
  for (let i = 0; i < deletebuttons.length; i++) {
    deletebuttons[i].onclick = () => {
      let del = $(".delete")[0];
      del.classList.remove("hidden");
      del.style.animation = "fadein .16s normal forwards ease-in-out";
      let key =
        deletebuttons[i].parentElement.parentElement.parentElement.getAttribute(
          "key"
        );
      del.setAttribute("key", key);
    };
  }
  for (let i = 0; i < renamebuttons.length; i++) {
    renamebuttons[i].onclick = () => {
      let del = $(".rename")[0];
      del.classList.remove("hidden");
      del.style.animation = "fadein .16s normal forwards ease-in-out";
      let key =
        deletebuttons[i].parentElement.parentElement.parentElement.getAttribute(
          "key"
        );
      del.setAttribute("key", key);
    };
  }
}
setLoadingPage(true)
getDevicesAndLoad()
  .then(() => {
    loadListeners();
    setLoadingPage(false);
  })
  .catch((err) => {
    setErrorPage();
    console.log(err);
  });

