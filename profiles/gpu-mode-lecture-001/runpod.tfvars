# GPU MODE Lecture 001: PyTorch inline extensions, Triton, Numba, and Nsight.
# The image is published from this repository's image-v0.1.1 release tag.
profile_name                        = "gpu-mode-lecture-001"
persistent_storage                  = true
retained_storage_cost_usd_per_month = 10

gpu_type_id          = "NVIDIA GeForce RTX 3090"
gpu_count            = 1
cloud_type           = "COMMUNITY"
interruptible        = false
image_name           = "ghcr.io/shanks-t/gpu-dev-workspace:0.1.1"
container_disk_in_gb = 40
validation_mode      = "performance-full"
volume_in_gb         = 50
