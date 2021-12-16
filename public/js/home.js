if (!localStorage.getItem("token")) {
  window.location.href = "/login";
}
("nameheader");
class Controller {
  windowRoot;
  selectedDeviceKey;
  userDevices;
  data;
  diference_from_global_date = -3;
  chart_type = "bar";
  chart;
  chart_ar;
  static instance;

  constructor() {
    Controller.instance = this;
    this.chart_type = window.localStorage.getItem("type") || "bar";
    this.windowRoot = $(":root")[0];
    this.setLoadingPage(true);
    this.getUserDevices()
      .then((_userDevices) => {
        if (_userDevices.data.length <= 0) {
          window.location.replace("/devices");
        }
        this.userDevices = _userDevices.data;
        this.setTableData(this.userDevices);
        this.loadTableListeners();
        this.selectedDeviceKey = this.userDevices[0].key;
        this.getDeviceData(this.userDevices[0].key)
          .then((_data) => {
            this.data = _data.data;
            this.setCardsData(this.data);
            this.setLoadingPage(false);
            this.loadChart(this.data);
            let name = $("#nameheader")[0];
            name.innerText = this.userDevices.filter(
              (e) => e.key == this.selectedDeviceKey
            )[0].name;
          })
          .catch((err) => {
            this.setErrorPage();
            console.log(err);
          });
      })
      .catch((err) => {
        this.setErrorPage();
        console.log(err);
      });
  }

  setCardsData(data) {
    let g = data[0].length > 0 ? Math.max(...data[0]) : 0;
    let l = data[0].length > 0 ? Math.min(...data[0]) : 0;
    let a = 0;
    for (let d of data[0]) {
      a += d;
    }
    a = a / data[0].length;
    let c = a / 1000 * 720 * 0.86;
    let greater = $("#greater .numbers")[0];
    let lower = $("#lower .numbers")[0];
    let average = $("#average .numbers")[0];
    let current = $("#current .numbers")[0];
    greater.innerText = g ? String(g.toFixed(1)) + "W" : "0W";
    lower.innerText = l ? String(l.toFixed(1)) + "W" : "0W";
    average.innerText = a ? String(a.toFixed(1)) + "W" : "0W";
    current.innerText = c ? "R$" + String(c.toFixed(2)) : "R$0.00";
  }

  setTableData(data) {
    let table = $("#table-devices")[0];
    let length = table.rows.length;
    for (let i = 0; i < length; i++) {
      table.deleteRow(0);
    }
    for (let i = 0; i < data.length; i++) {
      let row = table.insertRow(-1);
      row.setAttribute("key", data[i].key);
      if (i == 0) {
        row.classList.add("selected");
      }
      let ray = row.insertCell(0);
      let devicet = row.insertCell(1);
      ray.innerHTML = '<i class="fa fa-bolt" aria-hidden="true">';
      devicet.innerHTML = `<h3 class="device-name">${
        data[i].name
      }</h3><p class="device-key">${
        data[i].key.slice(0, data[i].key.length - 20) + "..."
      }</p>`;
    }
  }

  setErrorPage() {
    let load = $("#load")[0];
    let detail = $("#detail")[0];
    let cards = $("#cards")[0];
    let error = $("#error")[0];
    load.classList.add("hidden");
    detail.classList.add("hidden");
    cards.classList.add("hidden");
    error.classList.remove("hidden");
  }

  async loadChart(data) {
    let cm = $("#line-chart-mobile")[0];
    let cd = $("#line-chart-pc")[0];
    let chart_canvas;

    if (window.innerWidth > 992) {
      cd.classList.remove("hidden");
      cm.classList.add("hidden");
      chart_canvas = "#line-chart-pc";
      if (this.chart_ar == "mobile") {
        window.location.reload();
      }
      this.chart_ar = "pc";
    } else {
      cd.classList.add("hidden");
      cm.classList.remove("hidden");
      chart_canvas = "#line-chart-mobile";
      if (this.chart_ar == "pc") {
        window.location.reload();
      }
      this.chart_ar = "mobile";
    }
    let result = [[], []];
    if (
      (data[0].length <= 50 && this.chart_ar == "pc") ||
      (data[0].length <= 30 && this.chart_ar == "mobile")
    ) {
      result = [...data];
    } else {
      result[0] = [...data[0]].splice(
        data[0].length - (this.chart_ar == "pc" ? 50 : 30),
        data[0].length
      );
      result[1] = [...data[1]].splice(
        data[1].length - (this.chart_ar == "pc" ? 50 : 30),
        data[1].length
      );
    }
    if (this.chart) {
      this.chart.type = this.chart_type;
      this.chart.data.datasets[0].data = result[0];
      this.chart.data.labels = result[1];
      this.chart.data.datasets[0].backgroundColor = [
        this.chart_type == "line"
          ? "rgba(0, 0, 0, 0)"
          : this.windowRoot.style.getPropertyValue("--theme-main"),
      ];
      this.chart.data.datasets[0].borderColor =
        this.windowRoot.style.getPropertyValue("--theme-main");
      this.chart.resize;
      this.chart.update();
      return;
    }
    this.chart = new Chart($(chart_canvas)[0], {
      type: this.chart_type,
      data: {
        labels: result[1],
        datasets: [
          {
            data: result[0],
            label: "Dados mais recentes",
            backgroundColor: [
              this.chart_type == "line"
                ? "rgba(0, 0, 0, 0)"
                : this.windowRoot.style.getPropertyValue("--theme-main"),
            ],
            borderColor: this.windowRoot.style.getPropertyValue("--theme-main"),
            fill: true,
          },
        ],
      },
      options: {
        scales: {
          y: {
            type: "linear",
            grace: "1%",
          },
        },
        tension: 0.3,
      },
    });
  }

  loadTableListeners() {
    let table = $("#table-devices")[0];
    let rows = table.rows;
    for (let i = 0; i < rows.length; i++) {
      let row = table.rows[i];
      row.onclick = function () {
        row.classList.add("selected");
        for (let j = 0; j < rows.length; j++) {
          if (i != j) {
            rows[j].classList.remove("selected");
          }
        }
        Controller.instance.selectedDeviceKey = row.getAttribute("key");
        Controller.instance
          .getDeviceData(row.getAttribute("key"))
          .then((data) => {
            Controller.instance.data = data.data;
            let name = $("#nameheader")[0];
            name.innerText = Controller.instance.userDevices.filter(
              (e) => e.key == row.getAttribute("key")
            )[0].name;
            Controller.instance.setCardsData(Controller.instance.data);
            Controller.instance.loadChart(data.data);
            let opt = $(".clear.options");
            opt[0].classList.add("hidden");
            opt[1].classList.add("hidden");
            $(".clear.trash")[0].classList.remove("hidden");
          })
          .catch((err) => {
            Controller.instance.setErrorPage();
            console.log(err);
          });
      };
    }
  }
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  setLoadingPage(isLoading) {
    let load = $("#load")[0];
    let detail = $("#detail")[0];
    let cards = $("#cards")[0];
    if (isLoading) {
      load.classList.remove("hidden");
      detail.classList.add("hidden");
      cards.classList.add("hidden");
    } else {
      load.classList.add("hidden");
      detail.classList.remove("hidden");
      cards.classList.remove("hidden");
    }
  }

  async getUserDevices() {
    let raw = await fetch("/api/userdevices", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${window.localStorage.getItem("token")}`,
      },
    });
    let res = await raw.json();
    return res;
  }

  async getDeviceData(key) {
    let raw = await fetch(`/api/datadevice/${key}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${window.localStorage.getItem("token")}`,
      },
    });
    let res = await raw.json();
    res.data[1] = res.data[1].map((v) => {
      let h = v.slice(11, v.length - 3);
      let hour = Number(h.slice(0, 2)) + this.diference_from_global_date;
      if (hour < 0) {
        hour = 24 + hour;
        console.log(hour);
      }
      if (hour > 24) {
        hour = hour - 24;
      }
      return String(hour) + h.slice(2, h.length);
    });
    return res;
  }
}
let controller = new Controller();
Default.onloadColor = () => {
  if (controller.data) controller.loadChart(controller.data);
};

async function deleteData() {
  let key = Controller.instance.selectedDeviceKey;
  console.log(key);
  if (!key) return;
  let raw = await fetch("/api/deldata", {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${window.localStorage.getItem("token")}`,
    },
    body: JSON.stringify({ key: key }),
    method: "POST",
  });
  let res = await raw.json();

  if (res.status != "ok") {
    this.setErrorPage();
    return;
  }
  let data = await Controller.instance.getDeviceData(key);
  Controller.instance.data = data.data;
  Controller.instance.setCardsData(data.data);
  Controller.instance.loadChart(data.data);
  let opt = $(".clear.options");
  opt[0].classList.add("hidden");
  opt[1].classList.add("hidden");
  $(".clear.trash")[0].classList.remove("hidden");
}
$("#limpar")[0].onclick = deleteData;
$("#togglegraph")[0].onclick = () => {
  if (Controller.instance.chart_type == "line") {
    window.localStorage.setItem("type", "bar");
  } else {
    window.localStorage.setItem("type", "line");
  }
  window.location.reload();
};
