"use strict";

const API_KEY = "e297c4ba5f00425890fc634d1e96c62b"; //DELETE THIS BEFORE COMMITING
let testing = encodeURI(`https://api.geoapify.com/v1/geocode/search?text=Riga&format=json&limit=1&apiKey=${API_KEY}`);

const appElement = document.querySelector(".app");
const searchModalElement= document.querySelector(".search-modal");

const startpageSearchForm = document.querySelector(".startpage-search");
const startpageSearchField = document.getElementById("search");

const appSearchForm = document.querySelector(".search-form");
const appSearchField = document.getElementById("text");

const hourlyForecastContainer = document.querySelector(".hourly-forecast");

const currentTempElem = document.querySelector(".current-temperature");
const currentWeatherElem = document.querySelector(".current-weather");
const currentPlaceElem = document.querySelector(".current-place");
const currentWindDirectonElem = document.querySelector(".current-winddirection");
const currentWindSpeedElem = document.querySelector(".current-windspeed");
const currentPrecipitationElem = document.querySelector(".current-precipitation");
const sunriseElem = document.querySelector(".sunrise");
const sunsetElem = document.querySelector(".sunset");
const weatherIconElem = document.querySelector(".current-weather-icon");

let currentTemperature = null;
let currentWeatherCode = null;
let currentWindDirection = null;
let currentWindSpeed = null;
let currentTime = null;
let daily = {};
let hourly = {};

startpageSearchForm.addEventListener("submit", handleFormSubmit);
appSearchForm.addEventListener("submit", handleFormSubmit);

function handleFormSubmit(e) {
  e.preventDefault();
  let input;

  if (e.target.classList.contains("startpage-search")) {
    input = startpageSearchField.value;
    switchViews();
    startpageSearchField.value = "";
  }
  else {
    input = appSearchField.value;
    appSearchField.value = "";
  }
  
  fetch(encodeURI(`https://api.geoapify.com/v1/geocode/search?text=${input}&format=json&limit=1&apiKey=${API_KEY}`)) // TODO: Show error if no results were found
    .then(response => response.json())
    .then(data => {
      let latitude = Number.parseFloat(data.results[0].lat).toFixed(2);
      let longitude = Number.parseFloat(data.results[0].lon).toFixed(2);
      let address = {
        city: data.results[0].city,
        state: data.results[0].state,
        country: data.results[0].country,
      };

      hourlyForecastContainer.innerHTML = "";

      getWeatherForecast(latitude, longitude, address);
    });
}

navigator.geolocation.getCurrentPosition((data) => {
  getWeatherForecast(data.coords.latitude, data.coords.longitude);
  switchViews();
}, () => {
  console.error("Geolocation blocked by user");
});

async function getWeatherForecast(latitude, longitude, address = null) {
  return fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&timeformat=iso8601&windspeed_unit=ms&temperature_unit=celsius&precipitation_unit=mm&timezone=auto&hourly=temperature_2m,windspeed_10m,winddirection_10m,precipitation,weathercode&daily=temperature_2m_min,temperature_2m_max,precipitation_sum,sunrise,sunset`)
          .then(result => result.json())
          .then(data => {
            setInfo(data);
            setCurrentForecast(address);
            setHourlyForecast();
          })
          .catch(error => console.warn(error)); //TODO: handle cases when API call fails
}

function switchViews() {
  appElement.classList.toggle("hidden");
  searchModalElement.classList.toggle("hidden");
}

function setInfo(data) {
  currentTemperature = getTemperature(data["current_weather"]["temperature"]);
  currentWeatherCode = getWeatherCodeInterpretation(data["current_weather"]["weathercode"]);
  currentWindDirection = getWindDirection(data["current_weather"]["winddirection"]);
  currentWindSpeed = getWindSpeed(data["current_weather"]["windspeed"]);
  currentTime = new Date(data["current_weather"]["time"]);
  currentTime = currentTime.getHours();

  setDailyData(data["daily"]);
  setHourlyData(data["hourly"]);
}

function getWeatherCodeInterpretation(weatherCode) {
  weatherCode = Number(weatherCode);
  switch (weatherCode) {
    case 0:
      return "Clear sky";
    case 1:
      return "Clear sky";
    case 2:
      return "Partly cloudy";
    case 3:
      return "Overcast";
    case 45:
    case 48:
      return "Foggy";
    case 51:
    case 56:
    case 61:
      return "Slight rain";
    case 53:
    case 63:
      return "Moderate rain";
    case 55:
    case 57:
    case 65:
      return "Heavy rain";
    case 66:
    case 67:
      return "Freezing rain";
    case 71:
      return "Slight snowfall";
    case 73:
      return "Moderate snowfall";
    case 75:
    case 77:
      return "Heavy snowfall";
    case 80:
      return "Slight rain shower";
    case 81:
      return "Moderate rain shower";
    case 82:
      return "Heavy rain shower";
    case 95:
    case 96:
    case 99:
      return "Thunderstorm";
    default:
      return "N/A";
  }
}

function getWindDirection(data) {
  if (isNaN(data)) {
    return "N/A";
  }
  let windDirection = Math.floor(data);

  if (windDirection >= 355 && windDirection <= 360) return "W";
  if (windDirection >= 0 && windDirection <= 5) return "W";
  if (windDirection > 5 && windDirection < 85) return "NW";
  if (windDirection >= 85 && windDirection <= 95) return "N";
  if (windDirection > 95 && windDirection < 175) return "NE";
  if (windDirection >= 175 && windDirection <= 185) return "E";
  if (windDirection > 185 && windDirection < 265) return "SE";
  if (windDirection >= 265 && windDirection <= 275) return "S";
  if (windDirection > 275 && windDirection < 355) return "SW";
  
  return "N/A";
}

function getWindSpeed(data) {
  return !isNaN(data) ? `${data} m/s` : "N/A";
}

function getTemperature(data) {
  return !isNaN(data) ? `${data}\u2103` : "N/A";
}

function setDailyData(data) {
  daily.precipitation = data["precipitation_sum"][0] + " mm";
  daily.sunrise = data["sunrise"][0].match(/\d{2}:\d{2}/)[0];
  daily.sunset = data["sunset"][0].match(/\d{2}:\d{2}/)[0];
}

function setHourlyData(data) {
  hourly.temperature = data["temperature_2m"].slice(0, 24).map(hTemperature => getTemperature(hTemperature));
  hourly.time = data["time"].slice(0, 24).map(item => item.match(/\d{2}:\d{2}/)[0]);
  hourly.precipitation = data["precipitation"].slice(0, 24).map(hPrecipitation => hPrecipitation + " mm");
  hourly.weatherCode = data["weathercode"].slice(0, 24).map(wCode => getWeatherCodeInterpretation(wCode));
  hourly.windDirection = data["winddirection_10m"].slice(0, 24).map(wDirection => getWindDirection(wDirection));
  hourly.windSpeed = data["windspeed_10m"].slice(0, 24).map(wSpeed => getWindSpeed(wSpeed));
}

function setCurrentForecast(address) {
  currentTempElem.textContent = currentTemperature;
  currentWeatherElem.textContent = currentWeatherCode;

  if (address !== null) {
    let params = [
      address.city ?? address.state ?? "",
      address.country,
    ]
    currentPlaceElem.textContent = params.filter(string => string).join(", "); //we filter out empty strings to avoid redundant separators
  }

  currentWindDirectonElem.textContent = currentWindDirection;
  currentWindSpeedElem.textContent = currentWindSpeed;
  currentPrecipitationElem.textContent = daily.precipitation;
  sunriseElem.textContent = daily.sunrise;
  sunsetElem.textContent = daily.sunset;

  weatherIconElem.setAttribute("src", getWeatherIcon(currentWeatherCode));
}

function setHourlyForecast() {
  for (let i = 0; i < 24; ++i) {
    let element = createCardDiv(
      hourly.temperature[i],
      hourly.time[i],
      hourly.precipitation[i],
      hourly.weatherCode[i],
      hourly.windDirection[i],
      hourly.windSpeed[i]
    );

    hourlyForecastContainer.appendChild(element);
  }
}

function createCardDiv(temperature, time, precipitation, weatherCode, windDirection, windSpeed) {
  const cardElem = document.createElement("div");
  cardElem.classList.add("forecast-card");
  
  const timeElem = document.createElement("span");
  timeElem.classList.add("card-time", "bolder", "fs-larger");
  timeElem.textContent = time;

  const topElem = document.createElement("div");
  topElem.classList.add("card-top");

  const containerElem = document.createElement("div");
  containerElem.classList.add("flex-col");

  const temperatureElem = document.createElement("span");
  temperatureElem.classList.add("hourly-temperature", "fs-medium");
  temperatureElem.textContent = temperature;

  const weatherCodeElem = document.createElement("span");
  weatherCodeElem.classList.add("hourly-weather", "fs-smaller");
  weatherCodeElem.textContent = weatherCode;

  const iconElem = new Image();
  iconElem.src = getWeatherIcon(weatherCode);
  iconElem.classList.add("svg-small");

  const bottomElem = document.createElement("div");
  bottomElem.classList.add("card-bottom");
  
  const precipitationElem = document.createElement("span");
  precipitationElem.textContent = `Precipitation: ${precipitation}`;
  precipitationElem.classList.add("fs-small");

  const windElem = document.createElement("span");
  windElem.textContent = `Wind: ${windDirection} ${windSpeed}`;
  windElem.classList.add("fs-small");

  containerElem.append(temperatureElem, weatherCodeElem);
  topElem.append(containerElem, iconElem);
  bottomElem.append(precipitationElem, windElem);
  cardElem.append(timeElem, topElem, bottomElem);

  return cardElem;
}

function getWeatherIcon(weatherCode) {
  let svgName;
  
  switch (weatherCode) {
    case "Clear sky":
      if (currentTime >= 6 && currentTime <= 21) svgName = "sunny";
      else svgName = "night";
      break;
    case "Partly cloudy":
      if (currentTime >= 6 && currentTime <= 21) svgName = "partly-sunny";
      else svgName = "cloudy-night";
      break;
    case "Overcast":
      svgName = "cloudy";
      break;
    case "Foggy":
      svgName = "fog";
      break;
    case "Slight rain":
    case "Moderate rain":
    case "Heavy rain":
    case "Slight rain shower":
    case "Moderate rain shower":
    case "Heavy rain shower":
    case "Freezing rain":
      svgName = "rainy";
      break;
    case "Slight snowfall":
    case "Moderate snowfall":
    case "Heavy snowfall":
      svgName = "snowy";
      break;
    case "Thunderstorm":
      svgName = "storm";
      break;
  }

  return `./assets/svg/${svgName}.svg`;
}