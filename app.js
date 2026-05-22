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
  skyVisual: document.querySelector("#skyVisual"),
  weatherSymbol: document.querySelector("#weatherSymbol"),
  currentTemp: document.querySelector("#currentTemp"),
  feelsLike: document.querySelector("#feelsLike"),
  humidity: document.querySelector("#humidity"),
  windSpeed: document.querySelector("#windSpeed"),
  rainChance: document.querySelector("#rainChance"),
  forecastList: document.querySelector("#forecastList"),
  statusText: document.querySelector("#statusText"),
};

const text = {
  loading: "\u8b80\u53d6\u5929\u6c23\u4e2d...",
  source: "\u8cc7\u6599\u4f86\u6e90\uff1aOpen-Meteo",
  updatePrefix: "\u66f4\u65b0\u6642\u9593\uff1a",
  cityFailed: "\u57ce\u5e02\u67e5\u8a62\u5931\u6557",
  cityMissing: "\u627e\u4e0d\u5230\u9019\u500b\u57ce\u5e02\uff0c\u8acb\u63db\u500b\u540d\u7a31\u8a66\u8a66",
  weatherFailed: "\u5929\u6c23\u8cc7\u6599\u8b80\u53d6\u5931\u6557",
  weatherUnavailable: "\u76ee\u524d\u7121\u6cd5\u53d6\u5f97\u5929\u6c23\u8cc7\u6599",
  searching: "\u6b63\u5728\u67e5\u8a62",
  rain: "\u964d\u96e8",
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

function visualType(code) {
  if ([0, 1].includes(code)) return "sun";
  if ([2, 3].includes(code)) return "cloud";
  if ([45, 48].includes(code)) return "fog";
  if ([71, 73, 75].includes(code)) return "snow";
  if ([95, 96, 99].includes(code)) return "storm";
  return "rain";
}

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

function formatTime(dateText) {
  return new Intl.DateTimeFormat("zh-Hant", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateText));
}

function setLoading(message) {
  elements.statusText.textContent = message;
  elements.conditionText.textContent = message;
}

function setError(message) {
  elements.statusText.textContent = message;
  elements.conditionText.textContent = message;
  elements.weatherSymbol.textContent = "--";
  elements.skyVisual.dataset.weather = "loading";
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
  ].join(","));
  url.searchParams.set("daily", [
    "weather_code",
    "temperature_2m_max",
    "temperature_2m_min",
    "precipitation_probability_max",
  ].join(","));

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(text.weatherFailed);
  }

  return response.json();
}

function renderWeather(city, weather) {
  state.lastWeather = { city, weather };

  const current = weather.current;
  const daily = weather.daily;
  const [condition, symbol] = describeWeather(current.weather_code);

  elements.locationName.textContent = [city.name, city.admin1, city.country].filter(Boolean).join(", ");
  elements.conditionText.textContent = condition;
  elements.updatedTime.textContent = `${text.updatePrefix}${formatTime(current.time)}`;
  elements.skyVisual.dataset.weather = visualType(current.weather_code);
  elements.weatherSymbol.textContent = symbol;
  elements.currentTemp.textContent = tempNumber(current.temperature_2m);
  elements.unitMark.textContent = state.unit === "celsius" ? "\u00b0C" : "\u00b0F";
  elements.feelsLike.textContent = formatTemp(current.apparent_temperature);
  elements.humidity.textContent = `${Math.round(current.relative_humidity_2m)}%`;
  elements.windSpeed.textContent = `${Math.round(current.wind_speed_10m)} km/h`;
  elements.rainChance.textContent = `${Math.round(daily.precipitation_probability_max[0] ?? 0)}%`;
  elements.statusText.textContent = text.source;

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

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  });
}

searchWeather("Taipei");
