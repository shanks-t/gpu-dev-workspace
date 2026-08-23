# Book workspace retained between development sessions.
profile_name                        = "book-persistent"
persistent_storage                  = true
retained_storage_cost_usd_per_month = 10

gpu_type_id          = "NVIDIA GeForce RTX 3090"
gpu_count            = 1
cloud_type           = "COMMUNITY"
interruptible        = false
image_name           = "ghcr.io/shanks-t/gpu-dev-workspace:0.1.0"
container_disk_in_gb = 40
validation_mode      = "performance-full"
volume_in_gb         = 50
