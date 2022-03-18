#include <arpa/inet.h>
#include <netinet/in.h>
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/socket.h>
#include <sys/types.h>
#include <unistd.h>

int main(int argc, char const *argv[]) {
    if (argc < 3) {
        printf("Program requires arguments with ip and port number\n");
        return 0;
    }
    const char *ip = argv[1];
    int port = atoi(argv[2]);

    // Creating socket file descriptor
    int socket_fd;
    if ((socket_fd = socket(AF_INET, SOCK_STREAM, 0)) == -1) {
        perror("socket");
        exit(EXIT_FAILURE);
    }

    printf("Connecting to socket\n");

    struct sockaddr_in address;
    address.sin_family = AF_INET;
    address.sin_addr.s_addr = inet_addr(ip);
    address.sin_port = htons(port);

    if (connect(socket_fd, (struct sockaddr *)&address, sizeof(address))) {
        perror("connect");
        exit(EXIT_FAILURE);
    }

    printf("connected to the server\n");

    printf("Reading data:\n");
    char buffer[1024];
    int bytes = read(socket_fd, buffer, 1024);
    write(STDIN_FILENO, &buffer, bytes);
    printf("\n");

    if (close(socket_fd)) {
        perror("close");
        exit(EXIT_FAILURE);
    }

    return 0;
}