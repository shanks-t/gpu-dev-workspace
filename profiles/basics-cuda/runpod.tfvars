# Official SSH-ready CUDA development environment for native fundamentals.
profile_name       = "basics-cuda"
persistent_storage = false

gpu_type_id          = "NVIDIA GeForce RTX 3090"
gpu_count            = 1
cloud_type           = "COMMUNITY"
interruptible        = false
image_name           = "runpod/base@sha256:17580b47b2a5fed9817dad41f84de7eed7dade3b074a11d2662a1cd60aa46f63"
container_disk_in_gb = 40
validation_mode      = "cuda"
volume_in_gb         = 50 # Ignored unless persistent_storage is true.
