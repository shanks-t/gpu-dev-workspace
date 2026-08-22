# Cheapest GCP fallback for architecture-neutral book exercises.
profile_name       = "book-ephemeral"
persistent_storage = false

machine_type          = "n1-standard-4"
accelerator_type      = "nvidia-tesla-t4"
accelerator_count     = 1
spot                  = true
boot_disk_image       = "deeplearning-platform-release/pytorch-2-9-cu129-ubuntu-2404-nvidia-580-v20260819"
boot_disk_size_gb     = 100
boot_disk_type        = "pd-standard"
boot_disk_auto_delete = true
