# Programowanie sieciowe - Zadanie 3: Wyłuskiwanie danych z serwisu WWW

Grzegorz Mikołajczyk

## Uruchomienie

1. Potrzebny node.js zainstalowany na maszynie
2. Instalacja pakietów przez polecenie `npm i`
3. Uruchomienie progtamu przez polecenie `node main.js`

## Wybrana strona

Wybrana została strona [accuweather](https://www.accuweather.com/en/pl/krakow/274455/current-weather/274455) pokazująca aktualną pogodę dla Krakowa. <br/>

Program wyciąga z niej aktualną temperturę oraz inne szczegóły w stylu wilgotoność, wiatr, ciśnienie, zachmurzenie itp. i parsuje je do pojedyńczej tablicy zawierającej obiekty z właściwościami `name` oraz `value` dla każdej wyciągniętej informacji.

Przykładowe wyciągnięte iformacje:

```
[
  { name: 'Temperature', value: '13°C' },
  { name: 'Max UV Index', value: '2 Low' },
  { name: 'Wind', value: 'WSW 7 km/h' },
  { name: 'Wind Gusts', value: '7 km/h' },
  { name: 'Humidity', value: '93%' },
  { name: 'Indoor Humidity', value: '61% (Ideal Humidity)' },
  { name: 'Dew Point', value: '12° C' },
  { name: 'Pressure', value: '↔ 1022 mb' },
  { name: 'Cloud Cover', value: '88%' },
  { name: 'Visibility', value: '8 km' },
  { name: 'Cloud Ceiling', value: '12200 m' }
]
```
