#include <netinet/in.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/socket.h>
#include <sys/types.h>
#include <unistd.h>

#define HELLO_MSG "Hello, world!\r\n"

int main(int argc, char const *argv[]) {
    if (argc < 2) {
        printf("Program requires argument with port number\n");
        return 0;
    }
    int port = atoi(argv[1]);

    // Creating socket file descriptor
    int server_socket;
    if ((server_socket = socket(AF_INET, SOCK_STREAM, 0)) == 0) {
        perror("socket failed");
        exit(EXIT_FAILURE);
    }

    struct sockaddr_in address;
    address.sin_family = AF_INET;
    address.sin_addr.s_addr = INADDR_ANY;
    address.sin_port = htons(port);
    int addrlen = sizeof(address);

    // Forcefully attaching socket to the port 8080
    if (bind(server_socket, (struct sockaddr *)&address,
             sizeof(address)) < 0) {
        perror("bind failed");
        exit(EXIT_FAILURE);
    }

    printf("Server started\n");

    while (1) {
        if (listen(server_socket, 3) < 0) {
            perror("listen");
            exit(EXIT_FAILURE);
        }
        int socket;
        if ((socket = accept(server_socket, (struct sockaddr *)&address, (socklen_t *)&addrlen)) < 0) {
            perror("accept");
            exit(EXIT_FAILURE);
        }

        // char buffer[1024];
        // int bytes = read(socket, buffer, 1024);
        // printf("%s\n", buffer);
        send(socket, HELLO_MSG, strlen(HELLO_MSG), 0);
        printf("Hello message sent\n");

        if (close(socket)) {
            perror("close");
            exit(EXIT_FAILURE);
        }
    }
    return 0;
}