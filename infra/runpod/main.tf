resource "runpod_pod" "lab" {
  name                 = "gpu-dev-workspace"
  image_name           = var.image_name
  cloud_type           = var.cloud_type
  gpu_type_id          = var.gpu_type_id
  gpu_count            = var.gpu_count
  interruptible        = var.interruptible
  container_disk_in_gb = var.container_disk_in_gb
  ports                = "22/tcp"
  start_ssh            = true
  volume_in_gb         = var.persistent_storage ? var.volume_in_gb : null
  volume_mount_path    = var.persistent_storage ? "/workspace" : null

  env = [
    "HF_HOME=/workspace/.cache/huggingface",
    "TORCH_HOME=/workspace/.cache/torch",
    "TRITON_CACHE_DIR=/workspace/.cache/triton",
    "XDG_CACHE_HOME=/workspace/.cache",
  ]
}
