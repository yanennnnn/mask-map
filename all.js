const starData = JSON.parse(localStorage.getItem('starLocal')) || [];


let newpromise = new Promise(function(resolve, reject) {

    navigator.geolocation.getCurrentPosition(success, error)

    function success(position) {
        let userPosition = [position.coords.latitude, position.coords.longitude]
        resolve(userPosition)
    }

    function error() {
        let userPosition = [25.047702, 121.5151848];
        resolve(userPosition)
    }
})
newpromise.then(function(userPosition) {
    var map = L.map('map', {
        // center: [userPosition[0], userPosition[1]],
        zoom: 16,
        zoomControl: false
    });
    map.setView(new L.LatLng(userPosition[0], userPosition[1]))
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
        getmap(data);

        let searchbtn = document.querySelector('#searchBtn');
        const otherBtn = document.querySelectorAll('.other-btn');
        let staredBtn = document.querySelector('#stared-btn');
        // 口罩按鈕
        let maskBtn = document.querySelectorAll('.search_mask_item');
        //距離最近
        const nearDis = document.querySelector('#near-dis');
        //旁邊口罩顯示
        const container = document.querySelector('.side_nav_item')
        staredBtn.addEventListener('click', function() {
            //口罩按鈕
            maskBtn[0].classList.add('active');
            maskBtn[1].classList.remove('active');
            maskBtn[2].classList.remove('active');
            getStarlocal(starData);
            //取消按鈕樣式
            removeOtherBtn();
            staredBtn.classList.add('active');
            searchInput.value = "";
        }, false);

        //取得地圖
        function getmap(data) {
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

                let distance = getDistance(userPosition[0], userPosition[1], data[i].geometry.coordinates[1], data[i].geometry.coordinates[0])
                //依序把maker到入圖層，跑陣列資料
                markers.addLayer(L.marker([data[i].geometry.coordinates[1], data[i].geometry.coordinates[0]], { icon: mask }).bindPopup(
                    `<div class="map card">
                        <div class=" card-body">
                          <div class=" card-item">
                              <h1 class=" card-h1">  ${data[i].properties.name}  </h1>  <span class="card-distance">${distance >= 1 ? distance.toFixed(1) + 'km' : (distance * 1000 >>0) + 'm'}</span>
                              <p> ${data[i].properties.updated} </p>
                          </div>
                          <div class="card-button">
                              <a class="icon-load" href="https://www.google.com.tw/maps/dir//${data[i].properties.address}" target="_blank"> <img src="imgs/icon_nav.svg" alt="" /></a>
                          </div>
                        </div>
                        <div class=" card-maskcount">
                              <p class="adult"><span>成人</span>  ${data[i].properties.mask_adult}  </p>
                              <p class="child"><span>兒童</span>  ${data[i].properties.mask_child}  </p>
                        </div>
                       </div>`
                ));
            }

            map.addLayer(markers);
            //星號按鈕 加入收藏
            starBtnActive()
        }
        //地址搜尋
        function searchAddress(e) {
            //搜尋的資料
            let pharmacyStore = [];
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
                }
            }

            StoreInfo(pharmacyStore);
            getCountMuch(pharmacyStore);
            //取消按鈕樣式
            removeOtherBtn()
            distanceNear(pharmacyStore)
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

        }

        //藥局資訊
        function StoreInfo(pharmacyStore) {

            let searchList = [];
            let str = "";
            container.innerHTML = '';
            for (let i = 0; pharmacyStore.length > i; i++) {
                //星號標記是否為true
                let stared = starData.some(function(e) {
                    return e === pharmacyStore[i].properties.phone
                })
                let distance = getDistance(userPosition[0], userPosition[1], pharmacyStore[i].geometry.coordinates[1], pharmacyStore[i].geometry.coordinates[0])
                let div = document.createElement('div');
                div.className = 'card maskInfo'
                div.dataset.lat = pharmacyStore[i].geometry.coordinates[1]
                div.dataset.lng = pharmacyStore[i].geometry.coordinates[0]
                div.innerHTML = `
                        <div class=" card-body">
                          <div class=" card-item">
                              <h3 class=" card-p" > ${pharmacyStore[i].properties.name}</h3> <span class="card-distance"> ${distance >= 1 ? distance.toFixed(1) + 'km' : (distance * 1000 >>0) + 'm'}</span>
                              <ul>
                                  <li>${pharmacyStore[i].properties.address}</li>
                                  <li>${pharmacyStore[i].properties.phone}</li>
                                  <li>營業時間：${pharmacyStore[i].properties.note ? pharmacyStore[i].properties.note : '暫無資料'}</li>
                              </ul>
                          </div>
                          <div class="card-button">
                                <a class="icon-star  ${stared ? 'hide' : ''}"  href="#"> <img src="imgs/icon_star_unselected.svg" alt="" /></a>
                                <a class="icon-stared  ${stared ? 'show' : ''}" href="#"> <img src="imgs/icon_star_selected.svg" alt="" /></a>
                                <a class="icon-load" href="https://www.google.com.tw/maps/dir//${pharmacyStore[i].properties.address}" target="_blank"> <img src="imgs/icon_nav.svg" alt="" /></a>
                          </div>
                        </div>
                        <div class=" card-maskcount">
                          <p class="adult"><span>成人</span> ${pharmacyStore[i].properties.mask_adult} </p>
                          <p class="child"><span>兒童</span> ${pharmacyStore[i].properties.mask_child} </p>
                        </div>
                        <p>${data[i].properties.updated} 更新</p>`
                container.appendChild(div);

            }
            //星號按鈕 加入收藏
            starBtnActive()
            getInfo(pharmacyStore)
            clickMask(pharmacyStore)



        }
        //全部 成人 小孩口罩
        function clickMask(pharmacyStore) {
            let infoPointer = document.querySelectorAll(".maskInfo");
            for (j = 0; j < maskBtn.length; j++) {
                maskBtn[j].addEventListener('click', function(e) {
                    let c = 0;
                    while (c < maskBtn.length) {
                        maskBtn[c++].classList.remove('active');
                    }
                    e.currentTarget.classList.add('active');

                    container.scrollTop = 0;
                    infoPointer.forEach(function(el) {
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

                })
            }
        }

        //點選藥局改變地圖位置 
        function getInfo(pharmacyStore) {
            let infoPointer = document.querySelectorAll(".maskInfo");
            infoPointer.forEach(function(e) {
                e.addEventListener('click', function(el) {
                    const Lat = el.currentTarget.dataset.lat;
                    const Lng = el.currentTarget.dataset.lng;
                    // let marker = markers[e.indexOf(this)]
                    map.setView([Lat, Lng], 20)
                    // markers.zoomToShowLayer(marker, () => {
                    //     marker.openPopup()
                    //     // map.on('zoomend', getAroundStore);
                    // })
                }, false)
            })

        }
        //存量最多
        function getCountMuch(pharmacyStore) {
            const countMuch = document.querySelector('#count-much');
            countMuch.addEventListener('click', function(e) {
                container.scrollTop = 0;
                e.currentTarget.classList.add('active')
                e.currentTarget.parentNode.parentNode.children[0].children[0].classList.remove('active');
                pharmacyStore.sort(function(a, b) {
                    let total1 = a.properties.mask_adult + a.properties.mask_child;
                    let total2 = b.properties.mask_adult + b.properties.mask_child;
                    return total2 - total1;
                })
                StoreInfo(pharmacyStore)
            })

        }

        //已標星號
        function getStarlocal(item) {
            let str = '';
            let starlocal = [];
            item.forEach(function(e) {
                for (let i = 0; data.length > i; i++) {
                    if (data[i].properties.phone === e) {
                        starlocal.push(data[i]);
                    }
                }
            })

            StoreInfo(starlocal);
            getCountMuch(starlocal)
            distanceNear(starlocal);
        }

        //距離最近
        function distanceNear(maskInfo) {
            // debugger;
            let infoPointer = document.querySelectorAll(".maskInfo");
            container.scrollTop = 0
            const nearDis = document.querySelector('#near-dis');
            nearDis.addEventListener('click', function(e) {
                e.currentTarget.classList.add('active')
                e.currentTarget.parentNode.parentNode.children[1].children[0].classList.remove('active');
                let info = maskInfo.sort(({ geometry: { coordinates: a } }, { geometry: { coordinates: b } }) =>
                    getDistance(userPosition[0], userPosition[1], a[1], a[0]) - getDistance(userPosition[0], userPosition[1], b[1], b[0])
                )
                StoreInfo(info);
            })

        }

        function getDistance(lat1, lng1, lat2, lng2) {
            return 2 * 6378.137 * Math.asin(Math.sqrt(Math.pow(Math.sin(Math.PI * (lat1 - lat2) / 360), 2) + Math.cos(Math.PI * lat1 / 180) * Math.cos(Math.PI * lat2 / 180) * Math.pow(Math.sin(Math.PI * (lng1 - lng2) / 360), 2)))
        }

        //取消按鈕樣式
        function removeOtherBtn() {
            let c = 0;
            while (c < otherBtn.length) {
                otherBtn[c++].classList.remove('active');
            }
        }

        searchbtn.addEventListener('click', searchAddress, false);
        searchInput.addEventListener('keydown', function(e) {
            if (e.keyCode == 13) {
                searchAddress()
            }
        }, false);
    }
    L.control.zoom({
        position: 'bottomright'
    }).addTo(map);
})



//星號按鈕 加入收藏
function starBtnActive() {
    const star = document.querySelectorAll('.maskInfo .icon-star');
    const stared = document.querySelectorAll('.maskInfo .icon-stared');

    star.forEach(function(e) {
        const starTel = e.parentNode.parentNode.children[0].children[2].children[1].textContent;
        e.addEventListener('click', function(el) {

            starData.push(starTel);
            e.classList.add('hide');
            e.parentNode.children[1].classList.add('show');
            localStorage.setItem('starLocal', JSON.stringify(starData));
            el.cancelBubble = true;
        })
    })

    stared.forEach(function(e) {
        const starTel = e.parentNode.parentNode.children[0].children[2].children[1].textContent;
        e.addEventListener('click', function(el) {
            removeByValue(starData, starTel);
            e.classList.remove('show');
            e.parentNode.children[0].classList.remove('hide');
            localStorage.setItem('starLocal', JSON.stringify(starData));
            el.cancelBubble = true;
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
// getPosition()
getDate();

// 刪除陣列中的特定數值或字串。
function removeByValue(array, value) {
    return array.forEach((item, index) => {
        if (item === value) {
            array.splice(index, 1);
        }
    })
}