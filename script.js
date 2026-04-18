// Ожидание готовности библиотек
ymaps.ready(startApp);
google.charts.load('current', {'packages':['corechart']});

function startApp() {
    // Координаты Площади Ленина в Донецке
    const origin = [48.002263, 37.805214];
    // Координаты Донбасс Арены
    const target = [48.021074, 37.810052];

    // Создание карты в контейнере
    const myMap = new ymaps.Map("map", {
        center: origin,
        zoom: 14
    });

    // Отрисовка круга вокруг центральной точки
    const area = new ymaps.Circle([origin, 500], {}, {
        fillColor: "#3498db33",
        strokeColor: "#3498db",
        strokeWidth: 2
    });
    myMap.geoObjects.add(area);

    // Выполнение запроса на построение основного маршрута
    ymaps.route([origin, target]).then(function (route) {
        // Добавление линии пути на карту
        myMap.geoObjects.add(route);

        // Расчет дистанции в километрах
        const km = (route.getLength() / 1000).toFixed(2);
        // Расчет времени в минутах
        const min = Math.round(route.getTime() / 60);

        // Обновление текстовой информации
        document.getElementById("route-info").innerText = "Длина пути " + km + " км Время в дороге " + min + " мин";

        // Размещение меток достопримечательностей
        const theater = new ymaps.Placemark([48.006043, 37.802729], { iconCaption: "Театр" });
        const library = new ymaps.Placemark([48.008387, 37.803934], { iconCaption: "Библиотека" });
        myMap.geoObjects.add(theater);
        myMap.geoObjects.add(library);
    });

    // Запуск процесса сбора данных для графика
    prepareComparison(origin);
}

function prepareComparison(startPoint) {
    // Список объектов для анализа расстояний
    const points = [
        ["Арена", [48.0210, 37.8100]],
        ["Вокзал", [48.0430, 37.7440]],
        ["Парк", [47.9940, 37.7950]],
        ["Сити", [48.0260, 37.7990]],
        ["Цирк", [47.9890, 37.8020]]
    ];

    const chartData = [];
    let readyCount = 0;

    // Выполнение запросов для каждого направления
    points.forEach(function(item) {
        ymaps.route([startPoint, item[1]]).then(function(res) {
            // Перевод длины из метров в километры
            chartData.push([item[0], res.getLength() / 1000]);
            readyCount++;
            
            // Отрисовка при завершении всех расчетов
            if (readyCount === points.length) {
                drawGoogleChart(chartData);
            }
        });
    });
}

function drawGoogleChart(finalData) {
    google.charts.setOnLoadCallback(function() {
        const table = new google.visualization.DataTable();
        table.addColumn('string', 'Направление');
        table.addColumn('number', 'Километры');
        table.addRows(finalData);

        const config = {
            title: "Сравнительный анализ протяженности путей",
            legend: { position: "bottom" },
            colors: ["#3498db"],
            curveType: "function"
        };

        // Генерация линейной диаграммы
        const plot = new google.visualization.LineChart(document.getElementById("chart-container"));
        plot.draw(table, config);
    });
}