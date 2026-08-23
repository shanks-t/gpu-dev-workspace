# RunPod wrapper around NVIDIA's broad NGC PyTorch development environment.
profile_name       = "profiling-nvidia"
persistent_storage = false

gpu_type_id          = "NVIDIA GeForce RTX 3090"
gpu_count            = 1
cloud_type           = "COMMUNITY"
interruptible        = false
image_name           = "runpod/nvidia-pytorch@sha256:3506d8d5caddcd2c5210780809b1d5f90612ae274c33b8e37e29961b8f5a8f9e"
container_disk_in_gb = 40
validation_mode      = "nvidia-performance"
volume_in_gb         = 50 # Ignored unless persistent_storage is true.
