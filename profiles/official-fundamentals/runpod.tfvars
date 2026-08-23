# Provider-owned RunPod PyTorch 2.8 template. Terraform owns only the Pod;
# `runpod-torch-v280` keeps its maintained 30 GB container disk and 50 GB
# /workspace volume configuration.
profile_name                        = "official-fundamentals"
persistent_storage                  = true
retained_storage_cost_usd_per_month = 10

gpu_type_id          = "NVIDIA GeForce RTX 3090"
gpu_count            = 1
cloud_type           = "COMMUNITY"
interruptible        = false
runpod_template_id   = "runpod-torch-v280"
image_name           = "runpod-torch-v280"
container_disk_in_gb = 30
validation_mode      = "fundamentals"
volume_in_gb         = 50
