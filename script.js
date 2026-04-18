// Ожидание готовности библиотек
ymaps.ready(startApp);
google.charts.load('current', { packages: ['corechart'] });

function startApp() {
    console.log('✅ Yandex Maps API успешно загружен');

    const origin = [48.002263, 37.805214];   // Площадь Ленина
    const target = [48.021074, 37.810052];   // Донбасс Арена

    const myMap = new ymaps.Map("map", {
        center: origin,
        zoom: 14
    });

    // Круг
    const area = new ymaps.Circle([origin, 500], {}, {
        fillColor: "#3498db33",
        strokeColor: "#3498db",
        strokeWidth: 2
    });
    myMap.geoObjects.add(area);

    console.log('🗺 Карта инициализирована');

    // === Основной маршрут ===
    ymaps.route([origin, target])
        .then(function (route) {
            console.log('✅ Маршрут построен');
            myMap.geoObjects.add(route);

            const km = (route.getLength() / 1000).toFixed(2);
            const min = Math.round(route.getTime() / 60);

            document.getElementById("route-info").innerHTML = 
                `✅ Длина пути <b>${km}</b> км • Время в дороге <b>${min}</b> мин`;

            // Метки
            myMap.geoObjects.add(new ymaps.Placemark([48.006043, 37.802729], { iconCaption: "Театр" }));
            myMap.geoObjects.add(new ymaps.Placemark([48.008387, 37.803934], { iconCaption: "Библиотека" }));
        })
        .catch(function (err) {
            console.error('❌ Ошибка построения основного маршрута:', err);
            document.getElementById("route-info").innerHTML = 
                `<span style="color:red">Ошибка маршрута: ${err.message || err}</span>`;
        });

    // === Данные для графика ===
    prepareComparison(origin);
}

function prepareComparison(startPoint) {
    const points = [
        ["Арена", [48.0210, 37.8100]],
        ["Вокзал", [48.0430, 37.7440]],
        ["Парк", [47.9950, 37.7906]],
        ["Донецк-Сити", [48.0303, 37.7874]],
        ["Цирк", [47.9897, 37.7905]]
    ];

    const chartData = [];
    let readyCount = 0;

    points.forEach(function (item) {
        ymaps.route([startPoint, item[1]])
            .then(function (res) {
                chartData.push([item[0], res.getLength() / 1000]);
                readyCount++;
                if (readyCount === points.length) {
                    drawGoogleChart(chartData);
                }
            })
            .catch(function (err) {
                console.error(`❌ Ошибка маршрута до ${item[0]}:`, err);
                readyCount++; // продолжаем, даже если один упал
                if (readyCount === points.length) {
                    drawGoogleChart(chartData);
                }
            });
    });
}

function drawGoogleChart(finalData) {
    if (finalData.length === 0) {
        console.warn('⚠ Нет данных для графика');
        document.getElementById("chart").innerHTML = '<p style="color:red">Нет данных для графика (все маршруты упали)</p>';
        return;
    }

    google.charts.setOnLoadCallback(function () {
        console.log('✅ Google Charts рисует график');
        const table = new google.visualization.DataTable();
        table.addColumn('string', 'Направление');
        table.addColumn('number', 'Километры');
        table.addRows(finalData);

        const config = {
            title: "Сравнительный анализ протяженности путей",
            legend: { position: "bottom" },
            colors: ["#3498db"],
            curveType: "function",
            hAxis: { title: 'Направление' },
            vAxis: { title: 'Километры' }
        };

        const plot = new google.visualization.LineChart(document.getElementById("chart"));
        plot.draw(table, config);
    });
}
