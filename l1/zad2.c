#include <stdbool.h>
#include <stdio.h>

bool drukowalne_i(const void* buf, int len) {
    for (int i = 0; i < len; i++) {
        if (((char*)buf)[i] < 32 || ((char*)buf)[i] > 126) return false;
    }
    return true;
}

bool drukowalne_p(const void* buf, int len) {
    for (int i = 0; i < len; i++) {
        char* asciP = (char*)buf + (sizeof(char) * i);
        if (*asciP < 32 || *asciP > 126) return false;
    }
    return true;
}

int main() {
    printf("%d\n", drukowalne_p(&"asdd", 4));
    printf("%d\n", drukowalne_p(&"ąść", 4));
    printf("%d\n", drukowalne_i(&"asdd", 4));
    printf("%d\n", drukowalne_i(&"ąść", 4));

    return 0;
}