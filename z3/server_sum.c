#include <arpa/inet.h>
#include <netinet/in.h>
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/socket.h>
#include <sys/types.h>
#include <unistd.h>

#define PORT_NO 2020
#define BUFFER_SIZE 65507

int main(int argc, char const *argv[]) {
    // Creating socket file descriptor
    int server_socket;
    if ((server_socket = socket(AF_INET, SOCK_DGRAM, 0)) == -1) {
        perror("socket failed");
        exit(EXIT_FAILURE);
    }

    struct sockaddr_in address;
    address.sin_family = AF_INET;
    address.sin_addr.s_addr = htonl(INADDR_ANY);
    address.sin_port = htons(PORT_NO);
    int addrlen = sizeof(address);

    // Forcefully attaching socket to the port
    if (bind(server_socket, (struct sockaddr *)&address, addrlen) < 0) {
        perror("bind failed");
        exit(EXIT_FAILURE);
    }

    printf("Server started\n");

    while (1) {
        struct sockaddr client_address;
        socklen_t client_address_len;
        char buffer[BUFFER_SIZE + 1];
        int bufferLength = recvfrom(server_socket, (char *)buffer, BUFFER_SIZE, MSG_WAITALL, &client_address, &client_address_len);
        buffer[bufferLength++] = '\0';

        struct sockaddr_in *pV4Addr = (struct sockaddr_in *)&client_address;
        struct in_addr ipAddr = pV4Addr->sin_addr;

        char str_client_address[INET_ADDRSTRLEN];
        inet_ntop(AF_INET, &ipAddr, str_client_address, INET_ADDRSTRLEN);

        printf("Received message from %s : %s\n", str_client_address, buffer);

        char currChar;
        unsigned long int total = 0;
        unsigned long int currentNumber = 0;
        bool sendLineBreak = false;
        bool sendReturn = false;
        bool sendError = false;
        for (int i = 0; i < bufferLength; i++) {
            currChar = buffer[i];
            if (currChar >= '0' && currChar <= '9') {
                currentNumber *= 10;
                currentNumber += (currChar - '0');
            } else if (currChar == ' ') {
                total += currentNumber;
                currentNumber = 0;
            } else if (currChar == '\n') {
                sendLineBreak = true;
            } else if (currChar == '\r') {
                sendReturn = true;
            } else if (currChar == '\0') {
                continue;
            } else {
                printf("Found invalid character: %i\n", currChar);
                sendError = true;
            }
        }
        total += currentNumber;

        if (sendError)
            bufferLength = sprintf(buffer, "ERROR");
        else
            bufferLength = sprintf(buffer, "%ld", total);

        if (sendReturn) buffer[bufferLength++] = '\r';
        if (sendLineBreak) buffer[bufferLength++] = '\n';
        buffer[bufferLength++] = '\0';

        sendto(server_socket, buffer, bufferLength, MSG_CONFIRM, &client_address, client_address_len);
        if (sendError)
            printf("ERROR sent to client %s\n", str_client_address);
        else
            printf("Response %ld sent to client %s\n", total, str_client_address);
    }

    return 0;
}