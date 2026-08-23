# Project-owned complete compiler, framework, Triton, and profiling environment.
profile_name       = "performance-full"
persistent_storage = false

gpu_type_id          = "NVIDIA GeForce RTX 3090"
gpu_count            = 1
cloud_type           = "COMMUNITY"
interruptible        = false
image_name           = "ghcr.io/shanks-t/gpu-dev-workspace:sha-56acbd7eaeac1d23e773fa982b24344ac6da25cf"
container_disk_in_gb = 40
validation_mode      = "performance-full"
volume_in_gb         = 50 # Ignored unless persistent_storage is true.
