ymaps.ready(startApp);
google.charts.load('current', { packages: ['corechart'] });

function startApp() {
    const myMap = new ymaps.Map("map", {
        center: [48.002263, 37.805214],
        zoom: 14
    });

    let startPoint = null;
    let endPoint = null;
    let startPlacemark = null;
    let endPlacemark = null;
    let currentRoute = null;

    const circleArea = new ymaps.Circle([[48.002263, 37.805214], 500], {}, {
        fillColor: "#3498db33",
        strokeColor: "#3498db",
        strokeWidth: 2
    });
    myMap.geoObjects.add(circleArea);

    function updateRoute() {
        if (startPoint && endPoint) {
            if (currentRoute) {
                myMap.geoObjects.remove(currentRoute);
            }
            ymaps.route([startPoint, endPoint])
                .then(function (route) {
                    currentRoute = route;
                    myMap.geoObjects.add(route);
                    const km = (route.getLength() / 1000).toFixed(2);
                    const min = Math.round(route.getTime() / 60);
                    document.getElementById("route-info").innerHTML = 
                        `Длина пути <b>${km}</b> км • Время в дороге <b>${min}</b> мин`;
                }).catch(function (err) {
                    document.getElementById("route-info").innerHTML = 
                        `<span style="color:red">Ошибка маршрута: ${err.message || err}</span>`;
                });
        }
    }

    myMap.events.add('click', function (e) {
        const coords = e.get('coords');
        
        if (!startPoint) {
            startPoint = coords;
            startPlacemark = new ymaps.Placemark(coords, { iconCaption: "Точка А" });
            myMap.geoObjects.add(startPlacemark);
        } else if (!endPoint) {
            endPoint = coords;
            endPlacemark = new ymaps.Placemark(coords, { iconCaption: "Точка Б" });
            myMap.geoObjects.add(endPlacemark);
            updateRoute();
        } else {
            if (currentRoute) myMap.geoObjects.remove(currentRoute);
            startPoint = coords;
            endPoint = null;
            myMap.geoObjects.remove(startPlacemark);
            myMap.geoObjects.remove(endPlacemark);
            startPlacemark = new ymaps.Placemark(coords, { iconCaption: "Точка А" });
            myMap.geoObjects.add(startPlacemark);
            endPlacemark = null;
            document.getElementById("route-info").innerHTML = "Выберите конечную точку";
        }
    });

    const origin = startPoint || [48.002263, 37.805214];
    const target = endPoint || [48.021074, 37.810052];

    if (!startPoint && !endPoint) {
        ymaps.route([origin, target])
            .then(function (route) {
                myMap.geoObjects.add(route);
                currentRoute = route;
                const km = (route.getLength() / 1000).toFixed(2);
                const min = Math.round(route.getTime() / 60);
                document.getElementById("route-info").innerHTML = 
                    `Длина пути <b>${km}</b> км • Время в дороге <b>${min}</b> мин`;
                myMap.geoObjects.add(new ymaps.Placemark([48.006043, 37.802729], { iconCaption: "Театр" }));
                myMap.geoObjects.add(new ymaps.Placemark([48.008387, 37.803934], { iconCaption: "Библиотека" }));
            }).catch(function (err) {
                document.getElementById("route-info").innerHTML = 
                    `<span style="color:red">Ошибка маршрута: ${err.message || err}</span>`;
            });
    }
    
    document.getElementById("route-info").innerHTML = "Кликните на карте для выбора начальной точки маршрута";
    
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
