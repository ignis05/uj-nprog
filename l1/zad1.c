#include <stdio.h>

int main() {
    int liczby[50];
    int* pointer = &liczby[0];
    int size = 0;

    while (1) {
        int res = scanf("%d", pointer);
        if (*pointer == 0 || res == EOF)
            break;

        pointer++;
        size++;
    }

    printf("Liczby miedzy 10 a 100:\n");
    pointer--;
    for (int iterI = 0; iterI < size; iterI++) {
        if (*pointer > 10 && *pointer < 100)
            printf("%d", *pointer);

        pointer--;
    }
}