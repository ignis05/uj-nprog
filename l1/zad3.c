#include <fcntl.h>
#include <stdio.h>
#include <stdlib.h>

#define SKIP_EVEN 1

int main(int ArgC, char **ArgV) {
    // check arguments
    if (ArgC < 3) {
        printf("Program needs input and output file names as lauch argument and none is specified\n");
        return 1;
    }
    char *inputFileName = ArgV[1];
    char *outputFileName = ArgV[2];

    // open file
    int inputFileDesc = open(inputFileName, O_RDONLY);
    if (inputFileDesc == -1) {
        printf("error opening file: %s", inputFileName);
        perror("failed to open file");
        return 1;
    }

    // open file
    int outputFileDesc = open(outputFileName, O_WRONLY | O_CREAT);
    if (outputFileDesc == -1) {
        printf("error opening file: %s", outputFileName);
        perror("failed to open file");
        return 1;
    }

    // read from file
    char buffer = '\0';
    int byteSize = 0;
    short skip = 0;
    while ((byteSize = read(inputFileDesc, &buffer, 1))) {
        if (byteSize == -1) {
            perror("read error");
            return 1;
        }

        if (skip) {
            if (buffer == '\n')
                skip = 0;
            continue;
        }

        if (buffer == '\n') {
            skip = 1;
        }

        printf("reading chunk with size %i bytes\n", byteSize);

        // write to file
        if (write(outputFileDesc, &buffer, byteSize) == -1) {
            perror("pipe write error");
            return 1;
        }
    }

    // close file
    if (close(inputFileDesc) == -1) {
        perror("file close error");
        return 1;
    }
    
    // close file
    if (close(outputFileDesc) == -1) {
        perror("file close error");
        return 1;
    }
}