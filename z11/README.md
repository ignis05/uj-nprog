# Programowanie sieciowe - Zadanie 4: Program wykorzystujący REST API
Program, który w oparciu o informacje z Discogs sprawdza, czy członkowie (aktualni bądź byli) podanego zespołu grali razem w jakichś innych zespołach.

*Autor: Grzegorz Mikołajczyk*

## Uruchomienie

1. Potrzebny node.js zainstalowany na maszynie
2. Instalacja pakietów poprzez polecenie `npm i`
3. Uruchomienie programu poprzez polecenie `node main.js`
4. Uzupełnienie kucza i sekretu do API discogs w pliku `auth.json`, który został utworzony w poprzednim kroku.
3. Uruchomienie programu poprzez polecenie `node main.js <argument>`

### Uwagi odnośnie działania:
- Program wykorzystuje plik `auth.jon` w celu autoryzacji z API. Jeśli plik nie istnieje zostanie on utworzony, a program zakończy pracę.
- Jeśli argument uruchomienia składa się z samych cyfr, jest traktowany jako id zespołu, jeśli nie to jest traktowany jako nazwa zespołu.
- Jeśli limit zapytań API zostanie przekroczony, program wstrzymuje pracę na 5 sekund, po których wznawia pracę, lub czeka kolejne 5 sekund, aż do odblokowania API.
- Program wypisuje wyniki do konsoli oraz zapisuje je w pliku json o nazwie wyszukiwanego zespołu.
