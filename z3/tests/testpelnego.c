#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <sys/socket.h>
#include <string.h>
#include <arpa/inet.h>
#include <unistd.h>
#include <stdbool.h>

bool drukowalne_byte(const char *buf)
{
    const char *buf_in = buf;

    while (true)
    {
        if (*buf_in == 0)
            return true;
        if ((*buf_in < 32 || *buf_in > 126) && *buf_in != 13 && *buf_in != 10)
            return false;

        buf_in += 1;
    }
}

int main(int argc, char *argv[])
{
    // Tworzenie gniazdka
    int klient = socket(AF_INET, SOCK_DGRAM, 0);

    // Sprawdzenie czy gniazdko zostało stworzone poprawnie
    if (klient == -1)
    {
        perror("socket error");
        exit(1);
    }

    // Tworzenie adresu
    struct sockaddr_in adres;
    memset(&adres, 0, sizeof(adres));
    adres.sin_family = AF_INET;
    adres.sin_addr.s_addr = inet_addr("127.0.0.1");
    adres.sin_port = htons(2020);
    char test[65507];

    int suma = 0;
    for (int i = 0; i < 65507; i++)
    {
        if(i%2==0){
            test[i] = '1';
            suma++;
        }
        else{
            test[i] = ' ';
        }
    }    

    // Wysłanie wiadomości do gniazdka i sprawdzenie błędów funkcji sendto
    if (sendto(klient, test, 65507, 0, (struct sockaddr *)&adres, sizeof(adres)) == -1)
    {
        perror("sendto error");
        exit(1);
    }

    char dane[20];
    unsigned int len = sizeof(adres);

    // Odebranie wiadomości z gniazdka
    int odczyt = recvfrom(klient, dane, sizeof(dane), 0, (struct sockaddr *)&adres, &len);

    // Sprawdzenie błędów funkcji recvfrom
    if (odczyt == -1)
    {
        perror("recivefrom error");
        exit(1);
    }

    // // Sprawdzenie czy odebane bajty są drukowalne
    // if (drukowalne_byte(dane) == false)
    // {
    //     printf("Bajty nie składają się ze znaków drukowalnych\n");
    //     exit(1);
    // }

    printf("Odebrany wynik:\n");
    // Wypisanie wiadomości na konsolę
    int zapis = write(0, dane, odczyt);

    printf("wynik obliczony przed wysłaniem:\n");
    printf("%d\n", suma);
    printf("Jeśli różni się o 1 to znaczy że prawdopodobnie serwer nie konwertuje wam ostatniego znaku (jest to jedynka)\n");

    // Obsługa błędu funkcji write
    if (zapis != odczyt)
    {
        perror("write error");
        exit(1);
    }

    // Zamknięcie połączenia
    if (close(klient) == -1)
    {
        perror("close error");
        exit(1);
    }

    return 0;
}




// TODO 
// pusta wiadomość 
// 

