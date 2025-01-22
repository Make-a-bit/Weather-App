const API_KEYS = {
  OpenWeatherApiKey: "",
  OpenCageGeoCodeApiKey: "",
};

const DOM_ELEMENTS = {
  forecastContainer: document.querySelector(".forecast-results"),
  geocodeContainer: document.querySelector(".geocode-results"),
  locationField: document.getElementById("location"),
  searchButton: document.getElementById("search"),
  searchContainer: document.querySelector(".search-container-results"),
  metricUnits: document.getElementById("metric"),
  imperialUnits: document.getElementById("imperial"),
};

DOM_ELEMENTS.searchButton.addEventListener("click", process);
DOM_ELEMENTS.metricUnits.addEventListener("change", updateUnitValue);
DOM_ELEMENTS.imperialUnits.addEventListener("change", updateUnitValue);

let unitValue = getUnitValue();

function process() {
  clearWeatherResults();
  handleGeoCode();
}

async function fetchWeatherData(lat, lng) {
  clearGeoResults();
  console.log("Unit: ", unitValue);
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lng}&units=${unitValue}&appid=${API_KEYS.OpenWeatherApiKey}`
    );

    const weatherData = await response.json();
    console.log(weatherData);

    if (weatherData) {
      renderWeatherData(weatherData);
    } else {
      displayError("Something went wrong, try again later.");
    }
  } catch (error) {
    console.log("Error fetching weather data: ", error);
  }
}

async function fetchGeoCoding(query) {
  const response = await fetch(
    `https://api.opencagedata.com/geocode/v1/json?q=${query}&key=${API_KEYS.OpenCageGeoCodeApiKey}`
  );
  return response.json();
}

async function handleGeoCode() {
  try {
    const locationQuery = DOM_ELEMENTS.locationField.value;
    const geoCoding = await fetchGeoCoding(locationQuery);

    if (geoCoding.results.length > 0) {
      geoCoding.results.forEach((results) => {
        renderGeoResults(results.formatted, results.geometry.lat, results.geometry.lng);
      });
    } else {
      displayError("No results found. Please check your input.");
    }
  } catch (error) {
    console.log("Error handling geocoding: ", error);
  }
}

function renderGeoResults(formattedAddress, lat, lng) {
  const geoList = document.createElement("ul");
  const link = document.createElement("a");
  const listItem = document.createElement("li");

  link.href = "#";
  link.textContent = formattedAddress;

  link.addEventListener("click", (event) => {
    event.preventDefault();
    console.log("Fetching from geo: ", lat, lng);
    fetchWeatherData(lat, lng);
  });

  listItem.classList.add("geocode-result");
  listItem.appendChild(link);
  geoList.appendChild(listItem);

  DOM_ELEMENTS.geocodeContainer.appendChild(geoList);
}

function renderWeatherData(weatherData) {
  renderAlerts(weatherData.alerts);
  renderHourlyWeather(weatherData.hourly);
  renderDailyWeather(weatherData.daily);
}

function renderAlerts(alerts) {
  const weatherTable = document.createElement("table");
  weatherTable.classList.add("alert-table");

  if (alerts) {
    alerts.forEach((alert) => {
      const row = document.createElement("tr");

      const columnDescription = document.createElement("td");
      const description = alert.description;
      const slicedDescription = description.split(":")[1];
      columnDescription.textContent = slicedDescription ? slicedDescription.trim() : description;
      row.appendChild(columnDescription);

      weatherTable.appendChild(row);
    });
  }
  DOM_ELEMENTS.forecastContainer.appendChild(weatherTable);
}

function renderHourlyWeather(weatherArray) {
  const weatherTable = document.createElement("table");

  const unitShortHands = getUnitShorHands(unitValue);
  const temperatureUnit = unitShortHands.find((unit) => unit.label === "Temperature").value;
  const windSpeedUnit = unitShortHands.find((unit) => unit.label === "Wind speed").value;
  console.log(unitShortHands);

  for (let i = 0; i < Math.min(weatherArray.length, 24); i++) {
    const weather = weatherArray[i];
    const row = document.createElement("tr");

    const data = [
      {
        label: "Time",
        value: new Date(weather.dt * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
      { label: "Icon", value: fetchWeatherIcon(weather.weather[0].icon) },
      { label: "Condition", value: `${weather.weather[0].description}` },
      { label: "Temperature", value: `${weather.temp}${temperatureUnit}` },
      { label: "Wind Direction", value: getWindDirection(weather.wind_deg) },
      { label: "Wind Speed", value: `${weather.wind_speed} ${windSpeedUnit}` },
      { label: "Humidity", value: `${weather.humidity} %` },
      { label: "UV Index", value: `${weather.uvi}` },
    ];

    data.forEach((item) => {
      const col = document.createElement("td");
      col.classList.add("weather-result");
      col.textContent = typeof item.value === "string" ? item.value : "";

      if (item.label === "Icon") {
        col.appendChild(item.value);
      }
      row.appendChild(col);
    });

    weatherTable.appendChild(row);
  }
  DOM_ELEMENTS.forecastContainer.appendChild(weatherTable);
}

function renderDailyWeather(weatherArray) {
  const weatherTable = document.createElement("table");

  const unitShortHands = getUnitShorHands(unitValue);
  const temperatureUnit = unitShortHands.find((unit) => unit.label === "Temperature").value;
  const windSpeedUnit = unitShortHands.find((unit) => unit.label === "Wind speed").value;
  console.log(unitShortHands);

  for (let i = 0; i < Math.min(weatherArray.length, 24); i++) {
    const weather = weatherArray[i];

    const infoRow = document.createElement("tr");
    const infoCol = document.createElement("td");

    infoCol.setAttribute("colspan", "8");
    infoCol.classList.add("day-summary");
    infoCol.innerText = `${weather.summary}`;
    infoRow.appendChild(infoCol);

    const row = document.createElement("tr");

    const data = [
      { label: "Time", value: new Date(weather.dt * 1000).toLocaleDateString("fi-FI") },
      { label: "Icon", value: fetchWeatherIcon(weather.weather[0].icon) },
      { label: "Condition", value: `${weather.weather[0].description}` },
      { label: "Temperature", value: `${weather.temp.day}${temperatureUnit}` },
      { label: "Wind Direction", value: getWindDirection(weather.wind_deg) },
      { label: "Wind Speed", value: `${weather.wind_speed} ${windSpeedUnit}` },
      { label: "Humidity", value: `${weather.humidity} %` },
      { label: "UV Index", value: `${weather.uvi}` },
    ];

    data.forEach((item) => {
      const col = document.createElement("td");
      col.classList.add("weather-result");
      col.textContent = typeof item.value === "string" ? item.value : "";

      if (item.label === "Icon") {
        col.appendChild(item.value);
      }
      row.appendChild(col);
    });

    weatherTable.appendChild(infoRow);
    weatherTable.appendChild(row);
  }
  DOM_ELEMENTS.forecastContainer.appendChild(weatherTable);
}

function fetchWeatherIcon(iconCode) {
  const img = document.createElement("img");
  img.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  return img;
}

function getWindDirection(wind) {
  if (wind == 25 && wind < 70) {
    return "NE: ";
  } else if (wind >= 70 && wind < 115) {
    return "E: ";
  } else if (wind >= 115 && wind < 160) {
    return "SE: ";
  } else if (wind >= 160 && wind < 205) {
    return "E: ";
  } else if (wind >= 205 && wind < 250) {
    return "SW: ";
  } else if (wind >= 250 && wind < 295) {
    return "W: ";
  } else if (wind >= 295 && wind < 340) {
    return "NW: ";
  } else {
    return "N: ";
  }
}

function clearGeoResults() {
  document.querySelectorAll(".geocode-result").forEach((result) => result.remove());
}

function clearWeatherResults() {
  DOM_ELEMENTS.forecastContainer.innerHTML = "";
}

function displayError(message) {
  const errorMessage = document.createElement("p");
  errorMessage.classList.add("error-message");
  errorMessage.textContent = message;
  DOM_ELEMENTS.forecastContainer.appendChild(errorMessage);
}

function getUnitValue() {
  if (DOM_ELEMENTS.metricUnits.checked) {
    return "metric";
  } else if (DOM_ELEMENTS.imperialUnits.checked) {
    return "imperial";
  } else {
    return null;
  }
}

function updateUnitValue() {
  unitValue = getUnitValue();
  console.log("Unit: ", unitValue);
}

function getUnitShorHands(unit) {
  if (unit === "metric") {
    return [
      { label: "Temperature", value: "°C" },
      { label: "Wind speed", value: "m/s" },
    ];
  } else {
    return [
      { label: "Temperature", value: "°F" },
      { label: "Wind speed", value: "mph" },
    ];
  }
}
