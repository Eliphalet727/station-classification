var myChart = echarts.init(document.getElementById('chart-container'));
const infoContent = document.getElementById('info-content');
const infoName = document.getElementById('info-name');
const infoRule = document.getElementById('info-rule');
const infoException = document.getElementById('info-exception');
const infoSystem = document.getElementById('info-system');
const infoAgency = document.getElementById('info-agency');
const infoFrequency = document.getElementById('info-frequency');
const infoObservations = document.getElementById('info-observations');
const infoNote = document.getElementById('info-note'); // <-- Reference for the note element
const placeholder = document.querySelector('.placeholder');

let stationData = {}; // Will be filled by fetch

// --- DataTable Initialization ---
let table = new DataTable('#station-table', {
    destroy: true,
    dom: 'Bfrtip',
    buttons: [
        {
            extend: 'csvHtml5',
            charset: 'utf-8',
            bom: true,
            filename: '測站列表'
        }
    ],
    data: [],
    columns: [
        { data: 'name', title: '中文站名' },
        { data: 'code', title: '站碼' },
        { data: 'city', title: '縣市' },
        { data: 'lon', title: '經度', render: function(data) { return data != null ? data.toFixed(4) : ''; } }, // Added null check
        { data: 'lat', title: '緯度', render: function(data) { return data != null ? data.toFixed(4) : ''; } }  // Added null check
    ],
    pageLength: 5,
    language: {
         url: 'datatables-zh-HANT.json'
    }
});

const classificationData = [
     {
        name: '地面系統測站',
        rule: "以固網或行動網路方式傳輸資料的地面常規測站。",
        system: "ACOS、ASOS、農業氣象站、合作氣象站資料中繼接收機制",
        agency: "中央氣象署",
        frequency: "多樣 (視 L2 分類)",
        observations: ["多樣"],
        note: "", 
        itemStyle: { color: '#3a8fb7' },
        children: [
            {   name: '署屬氣象站', value: 1,
                rule: "專用觀測站碼為 '46' 開頭，且 COWORK 資料庫中 METRO_STATION 資料表其 CODE 欄位為 'C' 者，皆為署屬有人站，以正面表列方式列出",
                system: 'ACOS', agency: '測政管理科', frequency: '秒資料（ACOS）、分鐘資料（ASOS）',
                observations: ['溫度、濕度', '溫度、濕度、氣壓'],
                note: "玉山屬於 ASOS 系統，阿里山新站資料不對外公開，不列入分類；成功站歸類於署屬無人站",
                itemStyle: { color: '#5aa8d4' }
            },
            {   name: '署屬無人站', value: 1,
                rule: "COWORK 資料庫中 METRO_STATION 資料表其 CODE 欄位為 'C' 且除梧棲站外專用觀測站碼為 '46' 開頭者，共 4 站，以正面表列方式列出",
                system: 'ACOS、資料中繼接收機制', agency: '測政管理科', frequency: '秒資料（ACOS）、分鐘資料（資料中繼接收機制）',
                observations: ['溫度、濕度', '溫度、濕度、氣壓'],
                note: "除了成功站外，站外無駐點辦公人員；梧棲站專用站碼開頭為 'C0'",
                itemStyle: { color: '#79c4ed' } 
            },
            {   name: '農業氣象站', value: 1,
                rule: "COWORK 資料庫中 METRO_STATION 資料表其 CODE 欄位為 'F' 者",
                system: '資料中繼接收機制', agency: '綜合規劃組-跨域發展科（原農業科）、自動觀測科', frequency: '分鐘資料',
                observations: ['溫度、濕度', '溫度、濕度、氣壓'],
                note: "專用觀測站碼為 'C2' 開頭者為自動觀測科建置",
                itemStyle: { color: '#98dfff' }
            },
             {  name: '學校合作站', value: 1,
                rule: "COWORK 資料庫中 METRO_STATION 資料表其 CODE 欄位為 'E' 者",
                system: '資料中繼接收機制', agency: '資料品管科、中央大學、文化大學', frequency: '分鐘資料',
                observations: ['溫度、濕度', '溫度、濕度、氣壓'],
                note: "雪見這個站歸類於署屬合作站",
                itemStyle: { color: '#4b9cc9' }
            },
            {   name: '國道合作站', value: 1, isException: true,
                rule: "COWORK 資料庫中 METRO_STATION 資料表其 CODE 欄位為 'G' 且中文站名開頭為 '國' 者",
                system: '資料中繼接收機制', agency: '自動觀測科、高速公路局', frequency: '分鐘資料',
                observations: ['溫度、濕度', '溫度、濕度、氣壓'],
                note: "",
                itemStyle: { color: '#f08080' },
                decal: { symbol: 'triangle', symbolSize: 1, color: 'rgba(0,0,0,0.2)', dashArrayX: [1, 0], dashArrayY: [4, 5], rotation: Math.PI / 4 }
            },
            {   name: '公路合作站', value: 1, isException: true,
                rule: "COWORK 資料庫中 METRO_STATION 資料表其 CODE 欄位為 'G' 且中文站名開頭不為 '國' 者",
                system: '資料中繼接收機制', agency: '自動觀測科、公路局', frequency: '分鐘資料',
                observations: ['溫度、濕度', '溫度、濕度、氣壓'],
                note: "目前僅有西濱快速道路",
                itemStyle: { color: '#f4a261' },
                decal: { symbol: 'rect', symbolSize: 1, color: 'rgba(0,0,0,0.2)', dashArrayX: [1, 0], dashArrayY: [4, 5] }
            },
            {   name: '署屬合作站', value: 1, isException: true,
                rule: "在 COWORK 資料庫中 METRO_STATION 資料表中且不屬於「署屬氣象站」、「署屬無人站」、「農業氣象站」、「學校合作站」、「國道合作站」、「公路合作站」者",
                system: 'ASOS、資料中繼接收機制', agency: '資料品管科、各合作單位', frequency: '分鐘資料',
                observations: ['溫度、濕度', '溫度、濕度、氣壓'],
                note: "雪見屬於本項次分類",
                itemStyle: { color: '#ffb74d' },
                 decal: { symbol: 'star', symbolSize: 1, color: 'rgba(0,0,0,0.2)', dashArrayX: [1, 0], dashArrayY: [4, 5] } // Different pattern
            },
        ]
    },
     { 
        name: '遙測系統測站',
        rule: "以無線電中繼經區域站回傳或是透過行動網路、固網回傳資料者",
        system: "ARMTS", agency: "自動觀測科", frequency: "10分鐘資料、事件回傳（雨量）",
        observations: ["多樣"],
        note: '',
        itemStyle: { color: '#4caf50' },
        children: [
            {   name: '自動氣象站', value: 1,
                rule: "COWORK 資料庫中 WEB_STATION 資料表中其專用站站碼開頭為 'C0' 者",
                system: 'ARMTS', agency: '自動觀測科', frequency: '10分鐘資料、事件回傳（雨量）',
                observations: ['溫度、濕度', '溫度、濕度、氣壓'],
                note: "",
                itemStyle: { color: '#7cc47f' }
            },
            {   name: '自動雨量站', value: 1,
                rule: "COWORK 資料庫中 WEB_STATION 資料表中其專用站站碼開頭為 'C1' 者",
                system: 'ARMTS', agency: '自動觀測科', frequency: '事件回傳（雨量）',
                observations: ['雨量'],
                note: "",
                itemStyle: { color: '#a0d9a2' }
            },
            {   name: '臨時自動氣象站', value: 1,
                rule: "COWORK 資料庫中 WEB_STATION 資料表中其專用站站碼開頭為 'CM' 者",
                system: 'ARMTS', agency: '自動觀測科', frequency: '10分鐘資料、事件回傳（雨量）',
                observations: ['溫度、濕度', '溫度、濕度、氣壓'],
                note: "",
                itemStyle: { color: '#c5edc7' } 
            },
        ]
     },
     { 
         name: '外部合作單位測站',
         rule: "主要由非氣象署之單位維運，資料交換共享。",
         system: "Extranet 資料交換機制、外部 webAPI", agency: "外部單位", frequency: "10分鐘資料",
         observations: ['雨量'],
         note: '',
         itemStyle: { color: '#ff9800' },
         children: [
             {   name: '外單位合作雨量測站', value: 1,
                 rule: "依照 COWORK 資料庫中 WEB_STATIONOUT 資料表中 OWNER 欄位進行分類",
                 system: 'Extranet 資料交換機制、外部 webAPI', agency: '水利署/水保署/林業署/北市府等', frequency: '10分鐘資料',
                 observations: ['雨量'],
                 note: "可分為經濟部水利署、經濟部水利署第十河川分署、農村水保署、林業保育署、石門水庫、翡翠水庫、臺北市政府工務局水利工程處、臺北市政府工務局大地工程處",
                 itemStyle: { color: '#ffb74d' }
             },
         ]
     }
];

const option = {
    tooltip: {
        trigger: 'item',
        formatter: function(params) { return params.name; },
        extraCssText: 'max-width: 250px; white-space: normal; word-wrap: break-word; overflow-wrap: break-word; text-align: left;'
    },
    series: [ {
        type: 'sunburst',
        data: classificationData,
        radius: ['20%', '90%'],
        itemStyle: { borderRadius: 5, borderWidth: 2, borderColor: '#fff' },
        label: { rotate: 'radial', fontSize: 10, color: '#fff', textShadowBlur: 2, textShadowColor: 'rgba(0, 0, 0, 0.5)', overflow: 'truncate', ellipsis: '...', width: 80, minAngle: 5 },
        levels: [
            {}, 
            { 
                 itemStyle: { },
                 label: { rotate: 0, color: '#fff', fontSize: 12, fontWeight: 'bold', overflow: 'truncate', ellipsis: '...', width: 120 }
            },
            { 
                 itemStyle: { },
                 label: { color: '#333', align: 'center', overflow: 'truncate', ellipsis: '...', width: 70 }
            }
        ],
        emphasis: { focus: 'ancestor', itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.5)' } },
    } ]
};

myChart.setOption(option);

fetch('stations.json')
    .then(res => {
        if (!res.ok) { throw new Error('Network response was not ok ' + res.statusText); }
        return res.json();
    })
    .then(data => {
        stationData = data;
        console.log("Station data loaded successfully:", stationData);
    })
    .catch(error => {
        console.error('Error fetching or parsing stations.json:', error);
        placeholder.textContent = '無法載入測站資料，請檢查 stations.json 檔案。';
        placeholder.style.display = 'block';
        placeholder.style.color = 'red';
    });

// --- ECharts Click Event Handler ---
myChart.on('click', function (params) {
    if (params.data && params.data.name) {
        placeholder.style.display = 'none';
        infoContent.style.display = 'block';

        const clickedData = params.data;

        infoName.textContent = clickedData.name;
        infoRule.textContent = clickedData.rule || '未提供';
        infoSystem.textContent = clickedData.system || '未指定';
        infoAgency.textContent = clickedData.agency || '未指定';
        infoFrequency.textContent = clickedData.frequency || '未指定';
        infoNote.textContent = clickedData.note || ''; 

        const obsList = clickedData.observations;
        if (Array.isArray(obsList) && obsList.length > 0 && obsList[0] !== '多樣') { 
            infoObservations.innerHTML = obsList.map(o =>
                `<button class="obs-button" data-obs="${o}">${o}</button>`
            ).join(' ');
        } else {
            infoObservations.innerHTML = ''; 
            const obsText = typeof obsList === 'string' ? obsList :
                            (Array.isArray(obsList) && obsList.length === 1 && obsList[0] === '多樣') ? '多樣 (請見 L2 分類)' :
                            (Array.isArray(obsList) && obsList.length === 0 ? '無特定項目' : '未指定');
            infoObservations.textContent = obsText;
        }

        infoException.textContent = clickedData.isException ? '(*特例)' : '';

        // --- Update DataTable ---
        const initialGroup = (Array.isArray(obsList) && obsList.length > 0 && obsList[0] !== '多樣') ? obsList[0] : null;
        const categoryName = clickedData.name;
        console.log(`Filtering table for Category: "${categoryName}", Initial Group: "${initialGroup}"`);
        const stations = (stationData[categoryName] && initialGroup && stationData[categoryName][initialGroup]) || [];
        console.log("Stations found:", stations);

        table.clear().rows.add(stations).draw();

        // Highlight button
         document.querySelectorAll('.obs-button').forEach(b => {
             b.classList.toggle('active', b.dataset.obs === initialGroup);
        });
    }
});

// --- Observation Button Click Handler ---
infoObservations.addEventListener('click', function(e) {
    if (e.target.classList.contains('obs-button')) {
        const button = e.target;
        const category = infoName.textContent;
        const group = button.dataset.obs;
        console.log(`Button clicked - Category: "${category}", Group: "${group}"`);
        infoObservations.querySelectorAll('.obs-button').forEach(b => b.classList.remove('active'));
        button.classList.add('active');
        const stations = (stationData[category] && stationData[category][group]) || [];
        console.log("Stations found for button click:", stations);
        table.clear().rows.add(stations).draw();
    }
 });

// --- Window Resize Handler ---
window.addEventListener('resize', function() {
    myChart.resize();
});
