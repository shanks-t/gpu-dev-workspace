# Official SSH-ready PyTorch environment for framework fundamentals.
profile_name       = "basics-pytorch"
persistent_storage = false

gpu_type_id          = "NVIDIA GeForce RTX 3090"
gpu_count            = 1
cloud_type           = "COMMUNITY"
interruptible        = false
image_name           = "runpod/pytorch@sha256:0a360022e8de4375af99430f84e8b38951acc397252163a37ceac7204d01be35"
container_disk_in_gb = 40
validation_mode      = "pytorch"
volume_in_gb         = 50 # Ignored unless persistent_storage is true.
