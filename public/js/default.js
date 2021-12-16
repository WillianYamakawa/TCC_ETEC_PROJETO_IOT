class Default{
    static onloadColor = () => {};
    static loadColor(colorName = 'blue'){
        if(colorName != 0){
          window.localStorage.setItem('color', colorName)
        }
        let color = {main: null, sec: null, nav: null, back:null}
        if(colorName == 'pink'){
          color.main = '#de5d83';
          color.sec = '#d96285';
          color.nav = '#b63f62';
          color.back = 'rgb(238, 234, 237)';
        }else if(colorName == 'cyan'){
          color.main = '#3ed1c2';
          color.sec = '#76cfc6';
          color.nav = '#009189';
          color.back = 'rgb(234, 238, 238)';
        }else{
          color.main = '#03a9f4';
          color.sec = '#38c0ff';
          color.nav = '#005075';
          color.back = 'rgb(234, 234, 238)';
        }
        let r = document.querySelector(':root');
        r.style.setProperty('--theme-main', color.main);
        r.style.setProperty('--theme-sec', color.sec);
        r.style.setProperty('--theme-nav', color.nav);
        r.style.setProperty('--theme-back', color.back);
        this.onloadColor(); 
      }
}
function $(query){
  return document.querySelectorAll(query);
}
function loadColorsListeners() {
  let bc = $(".bc");
  for (let i = 0; i < bc.length; i++) {
    bc[i].onclick = (e) => {
      e.preventDefault();
      Default.loadColor(bc[i].getAttribute("color"));
    };
  }
}
Default.loadColor(window.localStorage.getItem("color"));
loadColorsListeners();

