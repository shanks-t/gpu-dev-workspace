
NVCC        = /usr/local/cuda/bin/nvcc
NVCC_FLAGS  = -O3 -I/usr/local/cuda/include
LD_FLAGS    = -lcudart -L/usr/local/cuda/lib64
BUILD_DIR    = build
EXE	        = $(BUILD_DIR)/vector_addition
OBJ	        = $(BUILD_DIR)/vector_addition.o

default: $(EXE)

$(BUILD_DIR):
	mkdir -p $@

$(OBJ): vector_addition.cu | $(BUILD_DIR)
	$(NVCC) -c -o $@ vector_addition.cu $(NVCC_FLAGS)

$(EXE): $(OBJ)
	$(NVCC) $(OBJ) -o $(EXE) $(LD_FLAGS)

clean:
	rm -rf $(BUILD_DIR)
