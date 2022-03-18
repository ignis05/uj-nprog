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
    if ((server_socket = socket(AF_INET, SOCK_DGRAM, 0)) == -1) {
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
        struct sockaddr client_address;
        socklen_t client_address_len;
        char buffer[1024];
        int bytes = recvfrom(server_socket, (char *)buffer, 1024 - 1, MSG_WAITALL, &client_address, &client_address_len);
        buffer[bytes++] = '\0';

        struct sockaddr_in *pV4Addr = (struct sockaddr_in *)&client_address;
        struct in_addr ipAddr = pV4Addr->sin_addr;

        char str_client_address[INET_ADDRSTRLEN];
        inet_ntop(AF_INET, &ipAddr, str_client_address, INET_ADDRSTRLEN);

        printf("Received message from %s : %s\n", str_client_address, buffer);
        // send(socket_fd, HELLO_MSG, strlen(HELLO_MSG), 0);
        sendto(server_socket, HELLO_MSG, strlen(HELLO_MSG), MSG_CONFIRM, &client_address, client_address_len);
        printf("Hello message sent to client %s\n", str_client_address);
    }

    return 0;
}