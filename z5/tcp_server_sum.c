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
int clientsockets[16] = {0};
#define MAX_CONNECTIONS 16

void exitHandler() {
    printf("Exit handler launched\n");
    if (close(server_socket)) {
        perror("close");
        _exit(EXIT_FAILURE);
    }
    for (int i = 0; i < MAX_CONNECTIONS; i++) {
        if (clientsockets[i] == 0) continue;
        if (close(clientsockets[i])) {
            perror("client close");
            _exit(EXIT_FAILURE);
        }
    }
    printf("Socket closed\n\n");
}

void sigHandler(int sigNo) {
    printf("\nReceived SIGINT\n");
    exit(EXIT_SUCCESS);
}

/** *
 * Puts socked descriptor in correct place in socket list
 * @param fd - socked descriptor
 * @returns index where socket was placed
 */
int putInSockList(int fd) {
    for (int i = 0; i < MAX_CONNECTIONS; i++) {
        if (clientsockets[i] == 0) {
            clientsockets[i] = fd;
            return i;
        }
    }
    return -1;
}

bool checkOverflow(unsigned long long num1, unsigned long long num2) {
    bool isOverflow = UINT64_MAX - num1 < num2;  // UINT64_MAX - num1 - num2 < 0
    if (isOverflow) printf("Overflow detected\n");
    return isOverflow;
}

int main(int argc, char const *argv[]) {
    // Creating socket file descriptor
    int server_socket;
    if ((server_socket = socket(AF_INET, SOCK_STREAM, 0)) == -1) {
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
        exit(EXIT_FAILURE);
    }

    printf("Server started\n");

    // accept new clients
    while (true) {
        if (listen(server_socket, 3) < 0) {
            perror("listen");
            exit(EXIT_FAILURE);
        }
        struct sockaddr client_address;
        socklen_t client_address_len;
        int socket_fd;
        if ((socket_fd = accept(server_socket, &client_address, &client_address_len)) < 0) {
            perror("accept");
            exit(EXIT_FAILURE);
        }
        int clientsockets_index = putInSockList(socket_fd);
        if (clientsockets_index == -1) {
            printf("ERROR: max socket limit reached");
            if (close(socket_fd)) {
                perror("runtime close");
                _exit(EXIT_FAILURE);
            }
            continue;
        }

        struct sockaddr_in *pV4Addr = (struct sockaddr_in *)&client_address;
        struct in_addr ipAddr = pV4Addr->sin_addr;

        char str_client_address[INET_ADDRSTRLEN];
        inet_ntop(AF_INET, &ipAddr, str_client_address, INET_ADDRSTRLEN);

        printf("Connected to client %s\n", str_client_address);

        // read from client
        while (true) {
            char buffer[BUFFER_SIZE + 1];
            int bufferLength = read(socket_fd, buffer, BUFFER_SIZE);
            if (bufferLength == -1) {
                perror("read");
                exit(EXIT_FAILURE);
            }
            if (bufferLength == 0) {
                printf("Connection terminated\n");
                close(socket_fd);
                clientsockets[clientsockets_index] = 0;
                break;
            }
            buffer[bufferLength] = '\0';  // terminate without increasing size

            printf("===\nReceived message from %s : %s\n", str_client_address, buffer);

            char currChar;
            unsigned long long total = 0;
            unsigned long long currentNumber = 0;
            bool sendLineBreak = false;
            bool sendReturn = false;
            bool sendError = false;
            bool noNumberReceived = true;
            for (int i = 0; i < bufferLength; i++) {
                currChar = buffer[i];
                if (currChar >= '0' && currChar <= '9') {
                    // check and multuply by 10
                    if (currentNumber > UINT64_MAX / 10) {
                        sendError = true;
                        break;
                    }
                    currentNumber *= 10;
                    // check and add next digit
                    if (checkOverflow(currentNumber, (currChar - '0'))) {
                        sendError = true;
                        break;
                    }
                    currentNumber += (currChar - '0');
                    noNumberReceived = false;
                } else if (currChar == ' ') {
                    if (checkOverflow(currentNumber, total)) {
                        sendError = true;
                        break;
                    }
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
            if (!sendError) sendError = checkOverflow(currentNumber, total) || noNumberReceived;
            total += currentNumber;

            if (sendError)
                bufferLength = sprintf(buffer, "ERROR");
            else
                bufferLength = sprintf(buffer, "%llu", total);

            if (sendReturn) buffer[bufferLength++] = '\r';
            if (sendLineBreak) buffer[bufferLength++] = '\n';

            if (send(socket_fd, buffer, bufferLength, 0) == -1) {
                perror("send");
                exit(EXIT_FAILURE);
            }
            if (sendError)
                printf("ERROR sent to client %s\n", str_client_address);
            else
                printf("Response %llu sent to client %s\n", total, str_client_address);
        }
    }

    return 0;
}