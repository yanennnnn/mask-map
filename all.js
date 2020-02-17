const starData = JSON.parse(localStorage.getItem('starLocal')) || [];


var map = L.map('map', {
    center: [25.0478142, 121.5147601],
    zoom: 16,
    zoomControl: false
});

//地理位置
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
        var userPosition = [position.coords.latitude, position.coords.longitude];
        map = map.setView(new L.LatLng(userPosition[0], userPosition[1]))
    })
}


//tileLayer:使用誰的圖資
//attribution Leaflet原本的設定
//addTo(map)新增到map變數的裡面
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

var redIcon = new L.Icon({
    iconUrl: 'imgs/icon_nav_me.svg',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [28, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

//新增一個圖層，這圖層專門放icon群組，加入map裡
var markers = new L.MarkerClusterGroup().addTo(map);
var marker;

//旁邊口罩顯示
var sectionView = document.querySelector('.side_nav_item');


//到真正資料進去
//開啟一個網路請求
var xhr = new XMLHttpRequest();
//準備和某某伺服要藥局剩餘口罩資料
xhr.open("get", "https://raw.githubusercontent.com/kiang/pharmacies/master/json/points.json");
//執行要資料的動作
xhr.send();

//設定icon顏色 //當資料回傳時，下面語法就會自動觸發
xhr.onload = function() {
    var data = JSON.parse(xhr.responseText).features;
    let searchbtn = document.querySelector('#searchBtn');
    let searchInput = document.querySelector('#searchInput');
    let staredBtn = document.querySelector('#stared-btn');
    staredBtn.addEventListener('click', function() {
        getStarlocal(starData);
        // staredBtn.classList.add('active');
    }, false);

    for (let i = 0; data.length > i; i++) {
        //map
        var mask;
        if (data[i].properties.mask_adult == 0 && data[i].properties.mask_child == 0) {
            mask = redIcon;
        } else {
            // mask = greenIcon;
            mask = L.divIcon({

                iconSize: [47, 40],
                iconAnchor: [20, 41], //經緯度位置
                popupAnchor: [1, -34],
                html: `
                <span > ${data[i].properties.mask_adult + data[i].properties.mask_child}</span>`,
                className: 'custom-div-icon',
            })
        }
        // mask = L.divIcon({
        //     html: `<p> ${data[i].properties.mask_adult}</p>`
        // })
        //依序把maker到入圖層，跑陣列資料
        markers.addLayer(L.marker([data[i].geometry.coordinates[1], data[i].geometry.coordinates[0]], { icon: mask }).bindPopup(
            `<div class="map card">
              <div class=" card-body">
                <div class=" card-item">
                    <h1 class=" card-h1">  ${data[i].properties.name}  </h1>  <span class="card-distance">10km</span>
                    <p> ${data[i].properties.updated} </p>
                </div>
                <div class=" card-button">
                    <a class="icon-star"> <img src="imgs/icon_star_unselected.svg" alt="" /></a>
                    <a class="icon-load" href="#"> <img src="imgs/icon_nav.svg" alt="" /></a>
                </div>
              </div>
              <div class=" card-maskcount">
                    <p class="adult"><span>成人</span>  ${data[i].properties.mask_adult}  </p>
                    <p class="child"><span>兒童</span>  ${data[i].properties.mask_child}  </p>
              </div>
             </div>`
        ));
    }


    function searchAddress(e) {
        //累積的搜尋資料
        let searchList = [];
        //搜尋的資料
        let pharmacyStore = [];

        if (e.keyCode == 13 || e.type == 'click') {
            //搜尋字
            let searchValue = searchInput.value.trim();
            //空值
            if (searchValue == '') {
                return;
            }
            //顯示搜尋資訊
            for (let i = 0; data.length > i; i++) {
                if (data[i].properties.address.indexOf(searchValue) != -1 || data[i].properties.name.indexOf(searchValue) != -1) {
                    //儲存data
                    pharmacyStore.push(data[i]);
                    let str = `
                    <div class="card maskInfo" data-lat="${data[i].geometry.coordinates[1]}" data-lng="${data[i].geometry.coordinates[0]}">
                      <div class=" card-body">
                          <div class=" card-item">
                              <h3 class=" card-p" > ${data[i].properties.name}</h3> <span class="card-distance">10km</span>
                              <ul>
                                  <li>${data[i].properties.address}</li>
                                  <li>${data[i].properties.phone}</li>
                                  <li>今日營業時間：</li>
                              </ul>
                          </div>
                          <div class="card-button">
                                <a class="icon-star"> <img src="imgs/icon_star_unselected.svg" alt="" /></a>
                                <a class="icon-stared "> <img src="imgs/icon_star_selected.svg" alt="" /></a>
                                <a class="icon-load" href="#"> <img src="imgs/icon_nav.svg" alt="" /></a>
                          </div>
                      </div>
                      <div class=" card-maskcount">
                          <p class="adult"><span>成人</span> ${data[i].properties.mask_adult} </p>
                          <p class="child"><span>兒童</span> ${data[i].properties.mask_child} </p>
                      </div>
                      <p>${data[i].properties.updated} 更新</p>
                    </div>`
                    searchList += str;
                }

            }

            sectionView.innerHTML = searchList;
            //口罩按鈕

        }
        let maskBtn = document.querySelectorAll('.search_mask_item');

        //移動到搜尋的第一個地方
        if (pharmacyStore[0] != null) {
            map.setView([pharmacyStore[0].geometry.coordinates[1], pharmacyStore[0].geometry.coordinates[0]], 15);
            //口罩按鈕樣式
            maskBtn[0].classList.add('active');
            maskBtn[1].classList.remove('active');
            maskBtn[2].classList.remove('active');
        } else {
            maskBtn[0].classList.remove('active');
            maskBtn[1].classList.remove('active');
            maskBtn[2].classList.remove('active');
            return
        }

        //點選藥局改變地圖位置 
        let infoPointer = document.querySelectorAll(".maskInfo");
        for (let i = 0; i < pharmacyStore.length; i++) {
            infoPointer[i].addEventListener('click', function(e) {
                Lat = e.currentTarget.dataset.lat;
                Lng = e.currentTarget.dataset.lng;
                map.setView([Lat, Lng], 20)

            });
        }


        //口罩按鈕查詢
        const maskScroll = document.querySelector('.side_nav_item')
        for (j = 0; j < maskBtn.length; j++) {
            maskBtn[j].addEventListener('click', function(e) {
                let c = 0;
                while (c < maskBtn.length) {
                    maskBtn[c++].classList.remove('active');
                }
                e.currentTarget.classList.add('active');

                // console.log(e.currentTarget.parentNode.parentNode);
                maskScroll.scrollTop = 0;
                for (let i = 0; i < pharmacyStore.length; i++) {
                    if (e.target.dataset.mask == "all") {
                        infoPointer[i].style.display = "block";

                    } else if (e.target.dataset.mask == "adult") {
                        infoPointer[i].style.display = "block";
                        if (pharmacyStore[i].properties.mask_adult == 0) {
                            infoPointer[i].style.display = "none";
                        }

                    } else if (e.target.dataset.mask == "child") {
                        infoPointer[i].style.display = "block";
                        if (pharmacyStore[i].properties.mask_child == 0) {
                            infoPointer[i].style.display = "none";
                        }
                    } else {
                        return;
                    }
                }
            })
        }

        starBtnActive()

    }

    function getStarlocal(item) {
        let str = '';
        let starlocal = [];
        // let starLen = item.length;
        // console.log(item[2]);
        for (let i = 0; data.length > i; i++) {
            for (let j = 0; j < item.length; j++) {
                if (data[i].properties.phone == item[j]) {
                    str = `
                    <div class="card maskInfo" data-lat="${data[i].geometry.coordinates[1]}" data-lng="${data[i].geometry.coordinates[0]}">
                      <div class=" card-body">
                          <div class=" card-item">
                              <h3 class=" card-p" > ${data[i].properties.name}</h3> <span class="card-distance">10km</span>
                              <ul>
                                  <li>${data[i].properties.address}</li>
                                  <li>${data[i].properties.phone}</li>
                                  <li>今日營業時間：</li>
                              </ul>
                          </div>
                          <div class="card-button">
                                <a class="icon-star hide"> <img src="imgs/icon_star_unselected.svg" alt="" /></a>
                                <a class="icon-stared show"> <img src="imgs/icon_star_selected.svg" alt="" /></a>
                                <a class="icon-load" href="#"> <img src="imgs/icon_nav.svg" alt="" /></a>
                          </div>
                      </div>
                      <div class=" card-maskcount">
                          <p class="adult"><span>成人</span> ${data[i].properties.mask_adult} </p>
                          <p class="child"><span>兒童</span> ${data[i].properties.mask_child} </p>
                      </div>
                      <p>${data[i].properties.updated} 更新</p>
                    </div>`
                    starlocal += str;

                }
            }
            sectionView.innerHTML = starlocal;
        }
        starBtnActive()
    }

    map.addLayer(markers);
    searchbtn.addEventListener('click', searchAddress, false);
    searchInput.addEventListener('keydown', searchAddress, false);
    // staredBtn.addEventListener('click', getStarlocal, false);
    getStarlocal(starData);
}

L.control.zoom({
    position: 'bottomright'
}).addTo(map);

//星號按鈕 加入收藏
function starBtnActive() {
    const star = document.querySelectorAll('.maskInfo .icon-star');
    const stared = document.querySelectorAll('.maskInfo .icon-stared');

    star.forEach(function(e) {
        const starTel = e.parentNode.parentNode.children[0].children[2].children[1].textContent;
        console.log(starTel);
        e.addEventListener('click', function() {

            starData.push(starTel);
            console.log(e);
            // e.classList.toggle('hide');
            // e.parentNode.children[1].classList.toggle('show');
            e.classList.add('hide');
            e.parentNode.children[1].classList.add('show');
            localStorage.setItem('starLocal', JSON.stringify(starData));

        })
    })

    stared.forEach(function(e) {
        const starTel = e.parentNode.parentNode.children[0].children[2].children[1].textContent;
        // const lovedStoreTel = e.parentNode.parentNode.children[2].textContent;
        e.addEventListener('click', function() {
            removeByValue(starData, starTel);
            // e.classList.toggle('show');
            // e.parentNode.children[0].classList.toggle('hide');
            e.classList.remove('show');
            e.parentNode.children[0].classList.remove('hide');
            localStorage.setItem('starLocal', JSON.stringify(starData));
        })
    })
}


// 時間
function getDate() {
    var date = new Date();
    var day = date.getDay();
    var day_list = ['日', '一', '二', '三', '四', '五', '六'];
    var bannerDay = document.querySelector('.day');
    bannerDay.textContent = "星期" + day_list[day];

    var year = date.getFullYear();
    var month = date.getMonth();
    var dayDay = date.getDate();
    var bannerDate = document.querySelector('#date');
    bannerDate.textContent = year + '年' + parseInt(month + 1) + '月' + dayDay + "日";

    //身分證數字
    var idNumber = document.querySelector('.number');
    switch (day_list[day]) {
        case '二':
        case '四':
        case '六':
            idNumber.textContent = '2.4.6.8.0';
            break;
        case '一':
        case '三':
        case '五':
            idNumber.textContent = '1.3.5.7.9';
            break;
        case '日':
            idNumber.textContent = '任何數';
            break;
        default:
            break;

    }
}

getDate();

// 刪除陣列中的特定數值或字串。
function removeByValue(array, value) {
    return array.forEach((item, index) => {
        if (item === value) {
            array.splice(index, 1);
        }
    })
}