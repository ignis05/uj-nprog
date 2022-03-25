.SUFFIXES: .c .cpp .o .x .h

# filenames
PROG1_NAME = server_sum
PROG1_X  = $(PROG1_NAME).x  
PROG1_O  = $(PROG1_NAME).o

CFLAGS = -std=c99 -pedantic -Wall -Wno-unknown-pragmas

# update files
%.o: %.c %.h
	gcc $(CFLAGS) -c $<
%.o: %.c
	gcc $(CFLAGS) -c $<

$(PROG1_X): $(PROG1_O) 
	gcc -o $@ $(CFLAGS) $^

# run
.PHONY: run
run: $(PROG1_X) 
	./$(PROG1_X)