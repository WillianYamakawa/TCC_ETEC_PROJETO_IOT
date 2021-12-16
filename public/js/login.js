if(localStorage.getItem('token')){
    window.location.href = "/home"
}
const email = document.querySelector("#email");
const senha = document.querySelector("#senha");
const botao = document.querySelector("#entrar");
const aviso = document.querySelector(".aviso");

botao.addEventListener("click", (e) => {
    
    if(email.value.length == 0 || senha.value.length == 0){
    aviso.textContent = "Campo(s) vazio(s)"
    }else{
    const url = "/login"
    fetch(url, {
    method: "POST",
    body: JSON.stringify({email: email.value, password: senha.value}),
    headers: {
         "Content-Type": "application/json"},
    }).then((res) => res.json().then(j =>{
    if(j.status == "ok"){
        aviso.textContent = ""
        localStorage.setItem('token', j.token)
        window.location.href = '/home'
    }else{
        aviso.textContent = j.status
    }
    }));
    
    
    }
    
});
