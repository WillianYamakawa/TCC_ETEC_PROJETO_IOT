if(localStorage.getItem('token')){
    window.location.href = "/home"
}
const nome = document.querySelector("#nome");
const email = document.querySelector("#email");
const senha = document.querySelector("#senha");
const aviso = document.querySelector("#aviso");
const r_senha = document.querySelector("#r-senha");
const btn = document.querySelector("#btn").addEventListener('click', async (e) =>{ 
    e.preventDefault()
    if(nome.value.length <= 2 || email.value.length <= 2 || senha.length <= 2 || r_senha.length <= 2){
        aviso.textContent = "Compo(s) Inválido(s)!"
        return
    }
    if(senha.value == r_senha.value){
        let res = await fetch("/register", {
            method: "POST",
            body: JSON.stringify({ name: nome.value, email: email.value, password: senha.value }),
            headers: { "Content-Type": "application/json" },
        })
        let j = await res.json();
        if(j.status != "ok"){
            aviso.textContent = j.status;
        }else{
            window.location.href = "/login";
        }
    } else{
        aviso.textContent = "Senhas diferem!"
    }
});