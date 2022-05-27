# Programowanie sieciowe - Zadanie 4: Program wykorzystujący REST API

Grzegorz Mikołajczyk

## Uruchomienie

1. Potrzebny node.js zainstalowany na maszynie
2. Instalacja pakietów przez polecenie `npm i`
3. Uruchomienie progtamu przez polecenie `node main.js <argument>`

Uwagi odnośnie działania:
- Program wykorzystuje plik `auth.jon` w celu autoryzacji z API. Jeśli plik nie istnieje zostanie on utworzony, a program zakończy pracę.
- Jeśli argument uruchomienia składa się z samych cyfr, jest traktowany jako id zespołu, jeśli nie to jest traktowany jako nazwa zespołu.
- Jeśli limit zapytań API zostanie przekroczony, program wstrzymuje pracę na 5 sekund po których wznawia pracę, lub czeka kolejne 5 sekund, aż do odblokowania API.
- Program wypisuje wyniki do konsoli oraz zapisuje je w pliku json o nazwie wyszukiwanego zespołu.