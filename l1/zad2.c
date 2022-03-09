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

bool drukowalne_string_i(const char* buf) {
    int i = 0;
    char currChar;
    while (true) {
        currChar = buf[i++];
        if (currChar == '\0') return true;
        if (currChar < 32 || currChar > 126) return false;
    }
}
bool drukowalne_string_p(const char* buf) {
    int i = 0;
    const char* currCharPtr;
    while (true) {
        currCharPtr = buf + (sizeof(char) * i++);
        if (*currCharPtr == '\0') return true;
        if (*currCharPtr < 32 || *currCharPtr > 126) return false;
    }
}

int main() {
    printf("%d\n", drukowalne_p(&"asdd", 4));
    printf("%d\n", drukowalne_p(&"ąść", 4));
    printf("%d\n", drukowalne_i(&"asdd", 4));
    printf("%d\n", drukowalne_i(&"ąść", 4));

    printf("===\n");

    const char* str1 = "asdd\0";
    const char* str2 = "ąść\0";

    printf("%d\n", drukowalne_string_p(str1));
    printf("%d\n", drukowalne_string_p(str2));
    printf("%d\n", drukowalne_string_i(str1));
    printf("%d\n", drukowalne_string_i(str2));

    return 0;
}