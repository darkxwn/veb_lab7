ymaps.ready(startApp);
google.charts.load('current', { packages: ['corechart'] });

function startApp() {
    // Площадь Ленина
    const origin = [48.002263, 37.805214];
    
    // Донбасс Арена
    const target = [48.021074, 37.810052];

    // Создание карты
    const myMap = new ymaps.Map("map", {
        center: origin,
        zoom: 14
    });

    // Добавление круга 
    const area = new ymaps.Circle([origin, 500], {}, {
        fillColor: "#3498db33",
        strokeColor: "#3498db",
        strokeWidth: 2
    });
    myMap.geoObjects.add(area);

    // Построение основного маршрута 
    ymaps.route([origin, target])
        .then(function (route) {
            // Добавляем маршрут на карту
            myMap.geoObjects.add(route);
            // Расчет расстояния в километрах и времени в минутах
            const km = (route.getLength() / 1000).toFixed(2);
            const min = Math.round(route.getTime() / 60);

            // Вывод информации о маршруте пользователю
            document.getElementById("route-info").innerHTML = 
                `Длина пути <b>${km}</b> км • Время в дороге <b>${min}</b> мин`;

            // Добавление меток достопримечательностей
            myMap.geoObjects.add(new ymaps.Placemark([48.006043, 37.802729], { iconCaption: "Театр" }));
            myMap.geoObjects.add(new ymaps.Placemark([48.008387, 37.803934], { iconCaption: "Библиотека" }));
        }).catch(function (err) {
            // В случае ошибки выводим сообщение
            document.getElementById("route-info").innerHTML = 
                `<span style="color:red">Ошибка маршрута: ${err.message || err}</span>`;
        });
    // Подготовка данных для сравнительного графика
    prepareComparison(origin);
}

function prepareComparison(startPoint) {
    // Список точек для расчета расстояний
    const points = [
        ["Арена",          [48.0210, 37.8101]],
        ["Вокзал",         [48.0436, 37.7461]],
        ["Парк Щербакова", [47.9950, 37.7906]],
        ["Донецк-Сити",    [48.0303, 37.7874]],
        ["Цирк Космос",    [47.9897, 37.7905]]
    ];
    const chartData = [];
    let readyCount = 0;
    // Для каждой точки строим маршрут и собираем расстояние
    points.forEach(function (item) {
        ymaps.route([startPoint, item[1]])
            .then(function (res) {
                // Сохраняем название точки и расстояние в километрах
                chartData.push([item[0], res.getLength() / 1000]);
                readyCount++;
                // Когда все маршруты посчитаны - рисуем график
                if (readyCount === points.length) {
                    drawGoogleChart(chartData);
                }
            }).catch(function () {
                readyCount++;
                if (readyCount === points.length) {
                    drawGoogleChart(chartData);
                }
            });
    });
}

function drawGoogleChart(finalData) {
    // Если данных нет - показываем сообщение об ошибке
    if (finalData.length === 0) {
        document.getElementById("chart").innerHTML = 
            '<p style="color:red; text-align:center;">Нет данных для графика</p>';
        return;
    }
    // Рисуем график после загрузки Google Charts
    google.charts.setOnLoadCallback(function () {
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
        // Создаем линейный график в контейнере
        const plot = new google.visualization.LineChart(document.getElementById("chart"));
        plot.draw(table, config);
    });
}
