"use strict";

let currentTemperature;
let currentWeatherCode;
let currentWindDirection;
let currentWindSpeed;
let daily = {};
let hourly = {};


const a = fetch("https://api.open-meteo.com/v1/forecast?latitude=56.94&longitude=24.10&current_weather=true&windspeed_unit=ms&temperature_unit=celsius&precipitation_unit=mm&timezone=auto&hourly=temperature_2m,apparent_temperature,relativehumidity_2m,windspeed_10m,winddirection_10m,cloudcover,precipitation,weathercode&daily=temperature_2m_min,temperature_2m_max,precipitation_sum,sunrise,sunset")
          .then(result => result.json())
          .then(data => setInfo(data));

function setInfo(data) {
  currentTemperature = getTemperature(data["current_weather"]["temperature"]);
  currentWeatherCode = getWeatherCodeInterpretation(data["current_weather"]["weathercode"]);
  currentWindDirection = getWindDirection(data["current_weather"]["winddirection"]);
  currentWindSpeed = getWindSpeed(data["current_weather"]["windspeed"]);

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
    case 61:
      return "Slight rain";
    case 53:
    case 63:
      return "Moderate rain";
    case 55:
    case 65:
      return "Heavy rain";
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
  return !isNaN(data) ? `${data} &deg; C` : "N/A";
}

function setDailyData(data) {
  daily.precipitation = data["precipitation_sum"][0] + " mm";
  daily.sunrise = data["sunrise"][0].match(/\d{2}:\d{2}/)[0];
  daily.sunset = data["sunset"][0].match(/\d{2}:\d{2}/)[0];
}

function setHourlyData(data) {
  hourly.temperature = data["apparent_temperature"].slice(0, 24).map(hTemperature => getTemperature(hTemperature));
  hourly.time = data["time"].slice(0, 24).map(item => item.match(/\d{2}:\d{2}/)[0]);
  hourly.precipitation = data["precipitation"].slice(0, 24).map(hPrecipitation => hPrecipitation + " mm");
  hourly.weatherCode = data["weathercode"].slice(0, 24).map(wCode => getWeatherCodeInterpretation(wCode));
  hourly.windDirection = data["winddirection_10m"].slice(0, 24).map(wDirection => getWindDirection(wDirection));
  hourly.windSpeed = data["windspeed_10m"].slice(0, 24).map(wSpeed => getWindSpeed(wSpeed));
}