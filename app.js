const state = {
  unit: "celsius",
  lastWeather: null,
};

const elements = {
  form: document.querySelector("#searchForm"),
  input: document.querySelector("#cityInput"),
  unitToggle: document.querySelector("#unitToggle"),
  unitLabel: document.querySelector("#unitLabel"),
  unitMark: document.querySelector("#unitMark"),
  locationName: document.querySelector("#locationName"),
  conditionText: document.querySelector("#conditionText"),
  updatedTime: document.querySelector("#updatedTime"),
  currentTemp: document.querySelector("#currentTemp"),
  feelsLike: document.querySelector("#feelsLike"),
  humidity: document.querySelector("#humidity"),
  windDirection: document.querySelector("#windDirection"),
  pressure: document.querySelector("#pressure"),
  uvIndex: document.querySelector("#uvIndex"),
  visibility: document.querySelector("#visibility"),
  mapPanel: document.querySelector("#mapPanel"),
  mapWind: document.querySelector("#mapWind"),
  mapRain: document.querySelector("#mapRain"),
  dailySummary: document.querySelector("#dailySummary"),
  sunrise: document.querySelector("#sunrise"),
  sunset: document.querySelector("#sunset"),
  hourlyList: document.querySelector("#hourlyList"),
  forecastList: document.querySelector("#forecastList"),
  statusText: document.querySelector("#statusText"),
  layerButtons: document.querySelectorAll(".layer-button"),
};

const text = {
  source: "\u8cc7\u6599\u4f86\u6e90\uff1aOpen-Meteo",
  updatePrefix: "\u66f4\u65b0\u6642\u9593\uff1a",
  cityFailed: "\u57ce\u5e02\u67e5\u8a62\u5931\u6557",
  cityMissing: "\u627e\u4e0d\u5230\u9019\u500b\u57ce\u5e02\uff0c\u8acb\u63db\u500b\u540d\u7a31\u8a66\u8a66",
  weatherFailed: "\u5929\u6c23\u8cc7\u6599\u8b80\u53d6\u5931\u6557",
  weatherUnavailable: "\u76ee\u524d\u7121\u6cd5\u53d6\u5f97\u5929\u6c23\u8cc7\u6599",
  searching: "\u6b63\u5728\u67e5\u8a62",
  rain: "\u964d\u96e8",
  sunrise: "\u65e5\u51fa",
  sunset: "\u65e5\u843d",
};

const weatherCodes = {
  0: ["\u6674\u6717", "SUN"],
  1: ["\u5927\u81f4\u6674\u6717", "SUN"],
  2: ["\u5c40\u90e8\u591a\u96f2", "CLD"],
  3: ["\u591a\u96f2", "CLD"],
  45: ["\u6709\u9727", "FOG"],
  48: ["\u9727\u51c7", "FOG"],
  51: ["\u5c0f\u6bdb\u96e8", "DRZ"],
  53: ["\u6bdb\u96e8", "DRZ"],
  55: ["\u5927\u6bdb\u96e8", "DRZ"],
  61: ["\u5c0f\u96e8", "RAIN"],
  63: ["\u964d\u96e8", "RAIN"],
  65: ["\u5927\u96e8", "RAIN"],
  71: ["\u5c0f\u96ea", "SNOW"],
  73: ["\u964d\u96ea", "SNOW"],
  75: ["\u5927\u96ea", "SNOW"],
  80: ["\u77ed\u66ab\u9663\u96e8", "SHWR"],
  81: ["\u9663\u96e8", "SHWR"],
  82: ["\u5f37\u9663\u96e8", "SHWR"],
  95: ["\u96f7\u96e8", "STRM"],
  96: ["\u96f7\u96e8\u4f34\u96a8\u51b0\u96f9", "STRM"],
  99: ["\u5f37\u96f7\u96e8\u4f34\u96a8\u51b0\u96f9", "STRM"],
};

function describeWeather(code) {
  return weatherCodes[code] ?? ["\u5929\u6c23\u8cc7\u6599", "WX"];
}

function toFahrenheit(value) {
  return value * 1.8 + 32;
}

function formatTemp(value) {
  const temp = state.unit === "celsius" ? value : toFahrenheit(value);
  return `${Math.round(temp)}\u00b0${state.unit === "celsius" ? "C" : "F"}`;
}

function tempNumber(value) {
  const temp = state.unit === "celsius" ? value : toFahrenheit(value);
  return Math.round(temp);
}

function formatDate(dateText) {
  return new Intl.DateTimeFormat("zh-Hant", {
    weekday: "short",
    month: "numeric",
    day: "numeric",
  }).format(new Date(dateText));
}

function formatHour(dateText) {
  return new Intl.DateTimeFormat("zh-Hant", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateText));
}

function formatTime(dateText) {
  return new Intl.DateTimeFormat("zh-Hant", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateText));
}

function windDirectionText(degrees) {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return directions[Math.round(degrees / 45) % 8];
}

function setLoading(message) {
  elements.statusText.textContent = message;
  elements.conditionText.textContent = message;
  elements.dailySummary.textContent = message;
}

function setError(message) {
  elements.statusText.textContent = message;
  elements.conditionText.textContent = message;
  elements.dailySummary.textContent = message;
}

async function fetchCity(query) {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", query);
  url.searchParams.set("count", "1");
  url.searchParams.set("language", "zh");
  url.searchParams.set("format", "json");

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(text.cityFailed);
  }

  const data = await response.json();
  if (!data.results?.length) {
    throw new Error(text.cityMissing);
  }

  return data.results[0];
}

async function fetchWeather(city) {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", city.latitude);
  url.searchParams.set("longitude", city.longitude);
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("current", [
    "temperature_2m",
    "relative_humidity_2m",
    "apparent_temperature",
    "weather_code",
    "wind_speed_10m",
    "wind_direction_10m",
    "surface_pressure",
    "cloud_cover",
    "visibility",
  ].join(","));
  url.searchParams.set("hourly", [
    "temperature_2m",
    "weather_code",
    "precipitation_probability",
    "wind_speed_10m",
    "cloud_cover",
  ].join(","));
  url.searchParams.set("daily", [
    "weather_code",
    "temperature_2m_max",
    "temperature_2m_min",
    "precipitation_probability_max",
    "uv_index_max",
    "sunrise",
    "sunset",
  ].join(","));

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(text.weatherFailed);
  }

  return response.json();
}

function createSummary(current, daily) {
  const [condition] = describeWeather(current.weather_code);
  const rain = Math.round(daily.precipitation_probability_max[0] ?? 0);
  const high = formatTemp(daily.temperature_2m_max[0]);
  const low = formatTemp(daily.temperature_2m_min[0]);
  const uv = Math.round(daily.uv_index_max[0] ?? 0);
  return `${condition}\uff0c\u9ad8\u6eab ${high}\uff0c\u4f4e\u6eab ${low}\u3002\u4eca\u65e5\u964d\u96e8\u6a5f\u7387 ${rain}%\uff0cUV ${uv}\uff0c\u51fa\u9580\u524d\u7559\u610f\u5929\u7a7a\u8b8a\u5316\u3002`;
}

function renderHourly(weather) {
  const hourly = weather.hourly;
  elements.hourlyList.innerHTML = hourly.time
    .slice(0, 24)
    .map((time, index) => {
      const [description, icon] = describeWeather(hourly.weather_code[index]);
      return `
        <article class="hour-card">
          <p class="hour-time">${formatHour(time)}</p>
          <p class="hour-temp">${formatTemp(hourly.temperature_2m[index])}</p>
          <p class="hour-condition">${icon} ${description}</p>
          <p class="hour-rain">${text.rain} ${Math.round(hourly.precipitation_probability[index] ?? 0)}%</p>
        </article>
      `;
    })
    .join("");
}

function renderForecast(weather) {
  const daily = weather.daily;
  elements.forecastList.innerHTML = daily.time
    .map((date, index) => {
      const [description, icon] = describeWeather(daily.weather_code[index]);
      return `
        <article class="forecast-card">
          <time datetime="${date}">${formatDate(date)}</time>
          <div class="forecast-icon" aria-hidden="true">${icon}</div>
          <p class="forecast-temp">${formatTemp(daily.temperature_2m_min[index])} / ${formatTemp(daily.temperature_2m_max[index])}</p>
          <p class="forecast-desc">${description}\uff0c${text.rain} ${Math.round(daily.precipitation_probability_max[index] ?? 0)}%</p>
        </article>
      `;
    })
    .join("");
}

function renderWeather(city, weather) {
  state.lastWeather = { city, weather };

  const current = weather.current;
  const daily = weather.daily;
  const [condition] = describeWeather(current.weather_code);
  const rainToday = Math.round(daily.precipitation_probability_max[0] ?? 0);

  elements.locationName.textContent = [city.name, city.admin1, city.country].filter(Boolean).join(", ");
  elements.conditionText.textContent = condition;
  elements.updatedTime.textContent = `${text.updatePrefix}${formatTime(current.time)}`;
  elements.currentTemp.textContent = tempNumber(current.temperature_2m);
  elements.unitMark.textContent = state.unit === "celsius" ? "\u00b0C" : "\u00b0F";
  elements.feelsLike.textContent = formatTemp(current.apparent_temperature);
  elements.humidity.textContent = `${Math.round(current.relative_humidity_2m)}%`;
  elements.windDirection.textContent = `${windDirectionText(current.wind_direction_10m)} ${Math.round(current.wind_direction_10m)}\u00b0`;
  elements.pressure.textContent = `${Math.round(current.surface_pressure)} hPa`;
  elements.uvIndex.textContent = Math.round(daily.uv_index_max[0] ?? 0);
  elements.visibility.textContent = `${Math.round((current.visibility ?? 0) / 1000)} km`;
  elements.mapWind.textContent = `${Math.round(current.wind_speed_10m)} km/h`;
  elements.mapRain.textContent = `${rainToday}%`;
  elements.dailySummary.textContent = createSummary(current, daily);
  elements.sunrise.textContent = `${text.sunrise} ${formatHour(daily.sunrise[0])}`;
  elements.sunset.textContent = `${text.sunset} ${formatHour(daily.sunset[0])}`;
  elements.statusText.textContent = text.source;

  renderHourly(weather);
  renderForecast(weather);
}

async function searchWeather(cityName) {
  const cleanName = cityName.trim();
  if (!cleanName) return;

  setLoading(`${text.searching} ${cleanName}...`);

  try {
    const city = await fetchCity(cleanName);
    const weather = await fetchWeather(city);
    renderWeather(city, weather);
  } catch (error) {
    setError(error.message || text.weatherUnavailable);
  }
}

elements.form.addEventListener("submit", (event) => {
  event.preventDefault();
  searchWeather(elements.input.value);
});

elements.unitToggle.addEventListener("click", () => {
  state.unit = state.unit === "celsius" ? "fahrenheit" : "celsius";
  elements.unitLabel.textContent = state.unit === "celsius" ? "C" : "F";
  if (state.lastWeather) {
    renderWeather(state.lastWeather.city, state.lastWeather.weather);
  }
});

elements.layerButtons.forEach((button) => {
  button.addEventListener("click", () => {
    elements.layerButtons.forEach((item) => item.classList.remove("is-active"));
    button.classList.add("is-active");
    elements.mapPanel.dataset.layer = button.dataset.layer;
  });
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  });
}

searchWeather("Taipei");
