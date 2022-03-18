#include <arpa/inet.h>
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
    if ((server_socket = socket(AF_INET, SOCK_STREAM, 0)) == -1) {
        perror("socket failed");
        exit(EXIT_FAILURE);
    }

    struct sockaddr_in address;
    address.sin_family = AF_INET;
    address.sin_addr.s_addr = htonl(INADDR_ANY);
    address.sin_port = htons(port);
    int addrlen = sizeof(address);

    // Forcefully attaching socket to the port 8080
    if (bind(server_socket, (struct sockaddr *)&address, addrlen) < 0) {
        perror("bind failed");
        exit(EXIT_FAILURE);
    }

    printf("Server started\n");

    while (1) {
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

        struct sockaddr_in *pV4Addr = (struct sockaddr_in *)&client_address;
        struct in_addr ipAddr = pV4Addr->sin_addr;

        char str_client_address[INET_ADDRSTRLEN];
        inet_ntop(AF_INET, &ipAddr, str_client_address, INET_ADDRSTRLEN);

        send(socket_fd, HELLO_MSG, strlen(HELLO_MSG), 0);
        printf("Hello message sent to client %s\n", str_client_address);

        if (close(socket_fd)) {
            perror("close");
            exit(EXIT_FAILURE);
        }
    }

    return 0;
}