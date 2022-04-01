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
 * Checks if number overflow will happen when adding 2 values
 * @returns true if overflow will happen
 */
bool checkOverflow(unsigned long long num1, unsigned long long num2) {
    bool isOverflow = UINT64_MAX - num1 < num2;  // UINT64_MAX - num1 - num2 < 0
    if (isOverflow) printf("Overflow detected\n");
    return isOverflow;
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

bool addDigitToNumber(unsigned long long *currentNumber, char currChar) {
    // check and multiply by 10
    if (*currentNumber > UINT64_MAX / 10) return true;
    *currentNumber *= 10;

    unsigned long long nr = *currentNumber;

    // check and add next digit
    if (checkOverflow(nr, (currChar - '0'))) return true;
    *currentNumber += (currChar - '0');

    return false;
}

/**
 * Sends error to socket
 */
void sendErr(int socket_fd) {
    char buffer[7] = "ERROR\r\n";
    if (send(socket_fd, buffer, 7, 0) == -1) {
        perror("error fn send");
        exit(EXIT_FAILURE);
    }
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

        // persisitent values between multiple reads
        char currChar;
        unsigned long long total = 0;
        unsigned long long currentNumber = 0;
        bool sendError = false;
        bool noNumberReceived = true;
        bool lastWasSpace = true;  // no space after start
        bool lastWasReturn = false;

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

            printf("===\nReceived data from %s : %s\n", str_client_address, buffer);

            // interpret characters
            for (int i = 0; i < bufferLength; i++) {
                currChar = buffer[i];
                if (currChar >= '0' && currChar <= '9') {
                    if (!sendError) continue;
                    sendError = addDigitToNumber(&currentNumber, currChar);
                    if (sendError) {
                        sendErr(socket_fd);
                        sendError = true;
                    }
                    noNumberReceived = false;
                    lastWasSpace = false;
                } else if (currChar == ' ') {
                    if (!sendError) continue;
                    // no double space
                    if (lastWasSpace || checkOverflow(currentNumber, total)) {
                        sendErr(socket_fd);
                        sendError = true;
                    }
                    total += currentNumber;
                    lastWasSpace = true;
                    currentNumber = 0;
                } else if (currChar == '\n') {
                    // use it for local errors - will be set to false at end anyway
                    int sendError = false;

                    // no space before line end or no return
                    if (!lastWasReturn) {
                        printf("no return char\n");
                        sendError = true;
                    }
                    if (lastWasSpace) {
                        sendError = true;
                    }
                    lastWasReturn = false;
                    // final addition and send
                    if (!sendError) sendError = checkOverflow(currentNumber, total) || noNumberReceived;
                    total += currentNumber;

                    if (sendError) {
                        sendErr(socket_fd);
                        printf("ERROR sent to client %s\n", str_client_address);
                    } else {
                        bufferLength = sprintf(buffer, "%llu\r\n", total);
                        if (send(socket_fd, buffer, bufferLength, 0) == -1) {
                            perror("send");
                            exit(EXIT_FAILURE);
                        }
                        printf("Response %llu sent to client %s\n", total, str_client_address);
                    }
                    // reset values
                    total = 0;
                    currentNumber = 0;
                    sendError = false;
                    noNumberReceived = true;
                    lastWasSpace = true;
                    lastWasReturn = false;
                } else if (currChar == '\r') {
                    // no space before line end or double return
                    if (sendError) {
                        if (lastWasSpace || lastWasReturn) {
                            sendErr(socket_fd);
                            sendError = true;
                        }
                    }
                    lastWasReturn = true;
                } else {
                    if (!sendError) continue;
                    printf("Found invalid character: %i\n", currChar);
                    sendErr(socket_fd);
                    sendError = true;
                }
            }
        }
    }
    return 0;
}