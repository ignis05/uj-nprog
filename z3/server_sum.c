#include <arpa/inet.h>
#include <limits.h>
#include <netinet/in.h>
#include <signal.h>
#include <stdbool.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/socket.h>
#include <sys/types.h>
#include <unistd.h>

#define PORT_NO 2020
#define BUFFER_SIZE 65507

int server_socket;

void exitHandler() {
    printf("Exit handler launched\n");
    if (close(server_socket)) {
        perror("close");
        _exit(EXIT_FAILURE);
    }
    printf("Socket closed\n\n");
}

void sigHandler(int sigNo) {
    printf("\nReceived SIGINT\n");
    exit(EXIT_SUCCESS);
}

bool checkOverflow(unsigned long int num1, unsigned long int num2) {
    bool isOverflow = UINT32_MAX - num1 < num2;  // UINT32_MAX - num1 - num2 < 0
    if (isOverflow) printf("Overflow detected\n");
    return isOverflow;
}

int main(int argc, char const *argv[]) {
    // Creating socket file descriptor
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

    // close socekt on exit
    if (atexit(exitHandler)) {
        perror("atexit error");
        _exit(EXIT_FAILURE);
    }

    // bind sighandler to SIGINT
    if (signal(SIGINT, sigHandler) == SIG_ERR) {
        perror("Failed to bind sigHandler to SIGINT");
        return 1;
    }

    printf("Server started\n");

    while (true) {
        struct sockaddr client_address;
        socklen_t client_address_len = sizeof(client_address);
        char buffer[BUFFER_SIZE + 1];
        int bufferLength = recvfrom(server_socket, (char *)buffer, BUFFER_SIZE, MSG_WAITALL, &client_address, &client_address_len);
        buffer[bufferLength] = '\0';  // set without increasing lenght so its skipped for length based operations

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
                sendError = checkOverflow(currentNumber, total);
                if (sendError) break;
                total += currentNumber;
                currentNumber = 0;
            } else if (currChar == '\n') {
                sendLineBreak = true;
            } else if (currChar == '\r') {
                sendReturn = true;
            } else {
                printf("Found invalid character: %i\n", currChar);
                sendError = true;
                break;
            }
        }
        sendError = checkOverflow(currentNumber, total);
        total += currentNumber;

        if (sendError)
            bufferLength = sprintf(buffer, "ERROR");
        else
            bufferLength = sprintf(buffer, "%ld", total);

        if (sendReturn) buffer[bufferLength++] = '\r';
        if (sendLineBreak) buffer[bufferLength++] = '\n';

        int sent = sendto(server_socket, buffer, bufferLength, MSG_CONFIRM, &client_address, client_address_len);
        if (sendError)
            printf("ERROR sent to client %s\n", str_client_address);
        else
            printf("Response %ld sent to client %s in %i bytes\n", total, str_client_address, sent);
        if (sent == -1) {
            perror("send error:");
        }
    }

    return 0;
}