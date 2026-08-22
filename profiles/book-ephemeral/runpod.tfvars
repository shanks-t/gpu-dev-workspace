# Cheapest architecture-neutral AI Systems Performance Book workspace.
profile_name       = "book-ephemeral"
persistent_storage = false

gpu_type_id          = "NVIDIA GeForce RTX 3090"
gpu_count            = 1
cloud_type           = "COMMUNITY"
interruptible        = false
image_name           = "runpod/pytorch:1.1.0-cu1300-torch291-ubuntu2404"
container_disk_in_gb = 40
volume_in_gb         = 50 # Ignored unless persistent_storage is true.
