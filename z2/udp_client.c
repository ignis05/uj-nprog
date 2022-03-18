#include <arpa/inet.h>
#include <netinet/in.h>
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/socket.h>
#include <sys/types.h>
#include <unistd.h>

#define HELLO_MSG "Hello, im UDP client!\r\n"

int main(int argc, char const *argv[]) {
    if (argc < 3) {
        printf("Program requires arguments with ip and port number\n");
        return 0;
    }
    const char *ip = argv[1];
    int port = atoi(argv[2]);

    // Creating socket file descriptor
    int socket_fd;
    if ((socket_fd = socket(AF_INET, SOCK_DGRAM, 0)) == -1) {
        perror("socket");
        exit(EXIT_FAILURE);
    }

    printf("Sending message to socket\n");

    struct sockaddr_in address;
    address.sin_family = AF_INET;
    address.sin_addr.s_addr = inet_addr(ip);
    address.sin_port = htons(port);
    socklen_t add_len = sizeof(address);

    sendto(socket_fd, HELLO_MSG, strlen(HELLO_MSG), MSG_CONFIRM, (const struct sockaddr *)&address, add_len);

    printf("Waiting for response\n");

    char buffer[1024];
    int bytes = recvfrom(socket_fd, (char *)buffer, 1024 - 1, MSG_WAITALL, (struct sockaddr *)&address, &add_len);
    buffer[bytes++] = '\0';
    // int bytes = read(socket_fd, buffer, 1024);
    write(STDIN_FILENO, &buffer, bytes);
    printf("\n");

    if (close(socket_fd)) {
        perror("close");
        exit(EXIT_FAILURE);
    }

    return 0;
}