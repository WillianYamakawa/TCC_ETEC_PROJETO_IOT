const express = require("express");
const app = express();
const crypto = require("crypto")
const uuid = require("uuid")
require("dotenv").config()

const sqlite = require("sqlite3");
const db = new sqlite.Database("data.db");

const jwt = require("jsonwebtoken");


app.use(express.json())
app.use(express.static(__dirname + "/public"))

app.get("/", (req, res) =>{
    res.sendFile(__dirname + "/public/index.html")
});

app.get("/login", (req, res) =>{
    res.sendFile(__dirname + "/public/login.html")
});

app.get("/register", (req, res) =>{
    res.sendFile(__dirname + "/public/register.html")
});

app.get("/home", (req, res) =>{
    res.sendFile(__dirname + "/public/home.html")
});

app.get("/account", (req, res) =>{
    res.sendFile(__dirname + "/public/account.html")
});

app.get("/devices", (req, res) =>{
    res.sendFile(__dirname + "/public/devices.html")
});

app.get("/settings", (req, res) =>{
    res.sendFile(__dirname + "/public/settings.html")
});

app.get("/help", (req, res) =>{
    res.sendFile(__dirname + "/public/help.html")
});

app.get("/api/datadevice/:key", async (req, res) => {
    let token = getFromJwt(req.headers.authorization)
    if(token.err){
        res.json({status: "Invalid JWT token!"})
        return
    }
    db.get("SELECT ID FROM users WHERE token = ?", [token.token], (err, user) =>{
        if(err) {
            res.json({status: err})
            return
        }
        if(user == null) {
            res.json({status: "No user found!"})
            return;
        }
        db.get("SELECT ID, owner FROM devices WHERE key = ?", [req.params.key], (err, row) =>{
            if(err) {
                res.json({status: err})
                return
            }
            if(row){
                if(user.ID != row.owner) {
                    res.json({status: "This device does not belong to you!"})
                    return
                }
                db.all("SELECT watt, date FROM datas WHERE device = ?", [row.ID], (err, rows) => {
                if(err) {
                    res.json({status: err})
                    return
                }
                let response = [[], []]
                for(let i = 0; i<rows.length;i++){
                    response[0].push(rows[i].watt)
                    response[1].push(rows[i].date)
                }
                res.json({status: "ok", data: response})
            })
            }else{
                res.json({status: "Device not found!"})
            }
        })
    })
})

app.get("/api/userdevices", async (req, res) => {
    
    let token = getFromJwt(req.headers.authorization);
    if(token.err){
        res.json({status: token.err})
        return
    }
    try{
        db.get("SELECT (ID) FROM users WHERE token = ?", [token.token], (err, user) => {
            if(err){
                res.json({status: err})
                return
            }
            if(user == null){
                res.json({status: "No user found!"})
                return
            }
            db.all("SELECT name, key FROM devices WHERE owner = ?", [user.ID], (err, devices)=>{
                if(err){
                    res.json({status: err})
                    return
                }
                res.json({status: "ok", data:devices})
            })
        })
    }catch(err){
        res.json({status: err});
        console.log(err);
    }
})

app.post("/api/deldevice", (req, res) => {
    let key = req.body.key
    let token = getFromJwt(req.headers.authorization);
    if(key == null || token.err){
        res.json({status: "Missing info"})
        return
    }
    db.get("SELECT ID FROM users WHERE token = ?", [token.token], (err, user) => {
        if(err || !user){
            res.json({status: "No user found!"})
            return
        }
        db.run("DELETE FROM devices WHERE key = ? AND owner = ?", [key, user.ID], (err) =>{
            if(err){
                res.json({status: "No success"})
                return
            }
            res.json({status: "ok"})
        })
    })
})

app.post("/api/adddevice", (req, res) => {
    let key = req.body.key
    let name = req.body.name;
    let token = getFromJwt(req.headers.authorization);
    if(key == null || token.err){
        res.json({status: "Dados inválidos"})
        return
    }
    db.get("SELECT COUNT(*) FROM registered_devices WHERE key = ?", [key], (err, rd) =>{
        if(err || rd['COUNT(*)'] != 1){
            res.json({status: "Dispositivo inesistente!"})
            return
        }
        db.get("SELECT ID FROM users WHERE token = ?", [token.token], (err, user)=>{
            if(err || !user){
                res.json({status: "No user found!"})
                return
            }
            db.run("INSERT INTO devices (name, key, owner) VALUES (?, ?, ?)", [name || "DEVICE", key, user.ID], (err)=>{
                if(err){
                    db.run("UPDATE devices SET owner = ?, name = ? WHERE key = ?", [user.ID, name || "DEVICE" ,key], (err)=>{
                        if(err){
                            res.json({status: "Server Error"})
                            return
                        }
                        res.json({status: "ok"})
                    })
                }else{
                    res.json({status: "ok"})
                }
            })
        })
    })
})

app.post("/api/renamedevice", (req, res) =>{
    let key = req.body.key
    let name = req.body.name
    let token = getFromJwt(req.headers.authorization);
    if(key == null || name == null ||token.err || name.length > 20){
        res.json({status: "Nome inválido"})
        return
    }
    db.get("SELECT ID FROM users WHERE token = ?", [token.token], (err, user) => {
        if(err || !user){
            res.json({status: "No user found!"})
            return
        }
        db.run("UPDATE devices SET name = ? WHERE key = ? AND owner = ?", [name, key, user.ID], (err) =>{
            if(err){
                res.json({status: "Server error"})
                return
            }
            res.json({status: "ok"})
        })
    })
})

app.post("/api/deldata", (req, res)=> {
    let key = req.body.key
    let token = getFromJwt(req.headers.authorization);
    if(key == null || token.err){
        res.json({status: "Missing info"})
        return
    }
    db.get("SELECT ID FROM users WHERE token = ?", [token.token], (err, user) => {
        if(err || !user){
            res.json({status: "No user found!"})
            return
        }
        db.get("SELECT ID, owner FROM devices WHERE key = ?", [key], (err, device)=>{
            if(user.ID != device.owner){
                res.json({status: "This device does not belong to you!"})
                return 
            }
            db.run("DELETE FROM datas WHERE device = ?", [device.ID], (err) =>{
                if(err){
                    res.json({status: "Server error"})
                    return
                }
                res.json({status: "ok"})
            })
        })
    })
})

app.post("/login", (req, res)=>{
    let email = req.body.email;
    let pwd = req.body.password;
    if(!email || !pwd){
        res.json({status: "Dados invalidos!"})
        return
    }
    if(email.length < 8 || email.length > 30){
        res.json({status: "Email inválido"})
        return
    }
    if(pwd.length < 2 || pwd.length > 30){
        res.json({status: "Senha inválida"})
        return
    }
    db.get("SELECT token FROM users WHERE email = ? AND password = ?", [email, hashPwd(pwd)], (err, user)=>{
        if(err){
            res.json({status: "Server error"})
            return
        }
        if(user == null){
            res.json({status: "Email ou Senha errados!"})
            return
        }
        res.json({status: "ok", token:makeJwt({token: user.token})})
        return
    })
})

app.post("/register", (req, res)=>{
    let email = req.body.email;
    let name = req.body.name;
    let pwd = req.body.password;
    if(!email || !name || !pwd){
        res.json({status: "Missing info"})
        return
    }
    if(email.length < 8 || email.length > 30 || email.indexOf('@') == -1){
        res.json({status: "Email inválido"})
        return
    }
    if(name.length < 2 || name.length > 30){
        res.json({status: "Nome inválido"})
        return
    }
    if(pwd.length < 8 || pwd.length > 30){
        res.json({status: "Senha inválida"})
        return
    }
    db.get("SELECT count(*) FROM users WHERE email = ?", [email], (err, user)=>{
        if(err){
            console.log(err);
            res.json({status: "Server error"})
            return
        }
        if(user['count(*)'] == 0){
            db.run("INSERT INTO users (name, email, password, token) VALUES (?, ?, ?, ?)", [name, email, hashPwd(pwd), uuid()], (err) =>{
                if(err){
                    console.log(err);
                    res.json({status: "Server error"})
                    return 
                }
                res.json({status: "ok"})
                return
            })
        }else{
            res.json({status: "Email já cadastrado"})
            return
        }
    })
})

app.post("/datapost/:key", (req, res) =>{
    let key = req.params.key
    let data = req.body.data
    if(!key || !data){
        res.json({status: "Missing info"})
        return
    } 
    db.get("SELECT ID FROM devices WHERE key = ?", [key], (err, device)=>{
        if(!device){
            res.json({status: "Device not set yet!"});
            return
        }
        db.run("INSERT INTO datas (watt, device) VALUES (?, ?)", [data, device?.ID], (err)=>{
            if(err){
                res.json({status: "Server issues!"})
            return
            }
            res.json({status: "ok"})
            db.get("SELECT COUNT(*) FROM datas WHERE device = ?", [device?.ID], (err, num)=>{
                if(num['COUNT(*)'] > 50){
                    db.run("DELETE FROM datas WHERE date = (SELECT MIN(date) FROM datas WHERE device = ?) AND device = ?", [device?.ID, device?.ID], (err)=>{
                        if(err){
                            console.log(err);
                        }
                    })
                }
            })
        })
    })
})

function hashPwd(pwd){
    let hash = crypto.createHash('sha256');
    hash.update(pwd);
    return hash.digest('hex')
}

function comparePwd(currpwd, dbpwd){
    let hash = crypto.createHash('sha256');
    hash.update(currpwd);
    if(hash.digest('hex') == dbpwd){
        return true;
    }else{
        return false;
    }
}

function getIDFromKey(key){
    db.get("SELECT (ID) FROM devices WHERE key = ?" [key], (err, row) =>{

    })
}

function getFromJwt(rawauth){

    try{

        let auth = rawauth;
        let token;
        if(auth){
            let rawtoken = auth.split(" ")[1]
            token = jwt.decode(rawtoken)
            if(!token) throw "Invalid token"
            if(token.token == null){
                throw "Invalid token"
            }
        }else{
            throw "No token found"
        }
        return token
    }catch(err){
        return {err: err}
    }

}

function makeJwt(jsondata){
    return jwt.sign(jsondata, process.env.ACCESS_TOKEN_SECRET);
}



app.listen(9091, () => {console.log("[!] SERVER IS UP AND RUNNING!")})

