"use strict";

const app = () => {
  const API_KEY = "471a5498175f4ea68574d9f896d340bd";
  const API_ENDPOINT = encodeURI(`https://api.geoapify.com/v1/geocode/search?text=Riga&format=json&limit=1&apiKey=${API_KEY}`);
  
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
  const precipitationElem = document.querySelector(".current-precipitation");
  const sunriseElem = document.querySelector(".sunrise");
  const sunsetElem = document.querySelector(".sunset");
  const weatherIconElem = document.querySelector(".current-weather-icon");
  const errorElemList = document.querySelectorAll(".error-msg");

  let geoData;
  let weatherData;
  let error = false;

  const weatherCode = {
    0: "Clear sky",
    1: "Clear sky",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Foggy",
    51: "Slight rain",
    56: "Slight rain",
    61: "Slight rain",
    53: "Moderate rain",
    63: "Moderate rain",
    55: "Heavy rain",
    57: "Heavy rain",
    65: "Heavy rain",
    66: "Freezing rain",
    67: "Freezing rain",
    71: "Slight snowfall",
    73: "Moderate snowfall",
    75: "Heavy snowfall",
    77: "Heavy snowfall",
    80: "Slight rain shower",
    81: "Moderate rain shower",
    82: "Heavy rain shower",
    95: "Thunderstorm",
    96: "Thunderstorm",
    99: "Thunderstorm"
  };

  const init = () => {
    appElement.classList.add("hidden");
    searchModalElement.classList.remove("hidden");

    startpageSearchForm.addEventListener("submit", handleSearch);
    appSearchForm.addEventListener("submit", handleSearch);
  }

  const handleSearch = async (event) => {
    let input;
    let field = event.target.classList.contains("startpage-search") ? startpageSearchField : appSearchField;
    event.preventDefault();

    cleanup();

    input = field.value;
    field.value = "";

    try {
      await fetchCoordinateData(input);
      await fetchForecastData();
      
      if (event.target.classList.contains("startpage-search")) {
        switchViews();
      }
      populateDOM();
    } catch (error) {
      console.error(error.message);
      errorElemList.forEach(element => element.textContent = "No such location was found. Maybe you had a spelling mistake?");
    }
  };

  const switchViews = () => {
    appElement.classList.toggle("hidden");
    searchModalElement.classList.toggle("hidden");
  };

  const fetchCoordinateData = async (input) => {
    await fetch(encodeURI(`https://api.geoapify.com/v1/geocode/search?text=${input}&format=json&limit=1&apiKey=${API_KEY}`))
              .then(response => {
                if (response.ok) return response.json();
                else Promise.reject(new Error("Failed to fetch geolocation data"));
              })
              .then(data => {
                setGeographicalData(data);
              })
              .catch(() => {
                throw new Error("Failed to fetch geolocation data");
              });
  }

  const setGeographicalData = (json) => {
    geoData = {
      "latitude": Number.parseFloat(json.results[0].lat).toFixed(4),
      "longitude": Number.parseFloat(json.results[0].lon).toFixed(4),
      "address": {
        "village": json.results[0].village,
        "city": json.results[0].city,
        "state": json.results[0].state,
        "country": json.results[0].country,
      }
    };
  }

  const fetchForecastData = async () => {
    let latitude = geoData.latitude;
    let longitude = geoData.longitude;
    
    await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&timeformat=iso8601&windspeed_unit=ms&temperature_unit=celsius&precipitation_unit=mm&timezone=auto&hourly=temperature_2m,windspeed_10m,winddirection_10m,precipitation,weathercode&daily=temperature_2m_min,temperature_2m_max,precipitation_sum,sunrise,sunset`)
              .then(response => {
                if (response.ok) return response.json()
                else Promise.reject();
              })
              .then(data => {
                setForecastData(data);
              })
              .catch(() => {
                throw new Error("Failed to fetch weather forecast data");
              });
  };

  const setForecastData = (json) => {
    weatherData = {
      "current": {
        "temperature": json["current_weather"]["temperature"],
        "weatherCode": json["current_weather"]["weathercode"],
        "windDirection": json["current_weather"]["winddirection"],
        "windSpeed": json["current_weather"]["windspeed"],
        "time": new Date(json["current_weather"]["time"]).getHours()
      },
      "daily": {
        "precipitation": json["daily"]["precipitation_sum"][0] + " mm",
        "sunrise": json["daily"]["sunrise"][0],
        "sunset": json["daily"]["sunset"][0]
      },
      "hourly": {
        "temperature": json["hourly"]["temperature_2m"].slice(0, 24).map(item => !isNaN(item) ? `${item}\u2103` : "N/A"),
        "time": json["hourly"]["time"].slice(0, 24).map(item => item.match(/\d{2}:\d{2}/)[0]),
        "precipitation": json["hourly"]["precipitation"].slice(0, 24).map(item => item + " mm"),
        "weatherCode": json["hourly"]["weathercode"].slice(0, 24).map(item => weatherCode[item] ? weatherCode[item] : "N/A"),
        "windDirection": json["hourly"]["winddirection_10m"].slice(0, 24).map(item => getWindDirection(item)),
        "windSpeed": json["hourly"]["windspeed_10m"].slice(0, 24).map(item => !isNaN(item) ? `${item} m/s` : "N/A")
      }
    };
  };

  const getWindDirection = (data) => {
    if (isNaN(data)) return "N/A";

    let degrees = Math.floor(data);

    if (degrees >= 355) return "W\u2190";
    if (degrees >= 275) return "SW\u2199";
    if (degrees >= 265) return "S\u2193";
    if (degrees >= 185) return "SE\u2198";
    if (degrees >= 175) return "E\u2192";
    if (degrees >= 95) return "NE\u2197";
    if (degrees >= 85) return "N\u2191";
    if (degrees >= 5) return "NW\u2196";
    
    return "W\u2190";
  };

  const cleanup = () => {
    errorElemList.forEach(element => element.textContent = "");
    currentTempElem.textContent = "";
    currentWeatherElem.textContent = "";
    currentPlaceElem.textContent = "";
    weatherIconElem.setAttribute("src", "./assets/svg/na.svg");
    precipitationElem.textContent = "N/A";
    currentWindDirectonElem.textContent = "N/A";
    currentWindSpeedElem.textContent = "";
    sunriseElem.textContent = "N/A";
    sunsetElem.textContent = "N/A";
    hourlyForecastContainer.innerHTML = "";

  }

  const getWeatherIcon = (weather) => {
    let svgName;
    let hours = Number(weatherData.current.time);
    switch (weather) {
      case "Clear sky":
        if (hours >= 6 && hours <= 21) svgName = "sunny";
        else svgName = "night";
        break;
      case "Partly cloudy":
        if (hours >= 6 && hours <= 21) svgName = "partly-sunny";
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
  };

  const populateDOM = () => {
    currentTempElem.textContent = `${weatherData.current.temperature}\u2103`;
    currentWeatherElem.textContent = weatherCode[weatherData.current.weatherCode];
    currentWindDirectonElem.textContent = getWindDirection(weatherData.current.windDirection);
    currentWindSpeedElem.textContent = `${weatherData.current.windSpeed} m/s`;
    
    precipitationElem.textContent = weatherData.daily.precipitation;
    sunriseElem.textContent = weatherData.daily.sunrise.match(/\d{2}:\d{2}/)[0];
    sunsetElem.textContent = weatherData.daily.sunset.match(/\d{2}:\d{2}/)[0];
    
    if (geoData.address !== undefined) {
      let params = [
        geoData.address.village ?? geoData.address.city ?? geoData.address.state ?? "",
        geoData.address.country ?? "",
      ]
      currentPlaceElem.textContent = params.filter(string => string).join(", "); //we filter out empty strings to avoid redundant separators
    }

    weatherIconElem.setAttribute(
      "src", 
      getWeatherIcon(weatherCode[weatherData.current.weatherCode])
    );
    
    for (let i = 0; i < 24; ++i) {
      let element = createHourlyContainer(
        weatherData.hourly.temperature[i],
        weatherData.hourly.time[i],
        weatherData.hourly.precipitation[i],
        weatherData.hourly.weatherCode[i],
        weatherData.hourly.windDirection[i],
        weatherData.hourly.windSpeed[i]
      );
  
      hourlyForecastContainer.appendChild(element);
    }
  };

  function createHourlyContainer(temp, time, precip, weather, wDirection, wSpeed) {
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
    temperatureElem.textContent = temp;
  
    const weatherCodeElem = document.createElement("span");
    weatherCodeElem.classList.add("hourly-weather", "fs-smaller");
    weatherCodeElem.textContent = weather;
  
    const iconElem = new Image();
    iconElem.src = getWeatherIcon(weather);
    iconElem.classList.add("svg-small");
  
    const bottomElem = document.createElement("div");
    bottomElem.classList.add("card-bottom");
    
    const precipitationElem = document.createElement("span");
    precipitationElem.textContent = `Precipitation: ${precip}`;
    precipitationElem.classList.add("fs-small");
  
    const windElem = document.createElement("span");
    windElem.textContent = `Wind: ${wDirection} ${wSpeed}`;
    windElem.classList.add("fs-small");
  
    containerElem.append(temperatureElem, weatherCodeElem);
    topElem.append(containerElem, iconElem);
    bottomElem.append(precipitationElem, windElem);
    cardElem.append(timeElem, topElem, bottomElem);
  
    return cardElem;
  }

  return {
    init,
  };
}

const weatherApp = app();

weatherApp.init();