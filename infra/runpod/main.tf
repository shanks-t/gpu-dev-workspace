resource "runpod_template" "lab" {
  count = var.runpod_template_id == "" ? 1 : 0

  name                       = "gpu-dev-workspace"
  image_name                 = var.image_name
  is_public                  = false
  is_serverless              = false
  category                   = "NVIDIA"
  container_disk_in_gb       = var.container_disk_in_gb
  container_registry_auth_id = var.container_registry_auth_id
  ports                      = ["22/tcp"]

  env = {
    HF_HOME          = "/workspace/.cache/huggingface"
    TORCH_HOME       = "/workspace/.cache/torch"
    TRITON_CACHE_DIR = "/workspace/.cache/triton"
    XDG_CACHE_HOME   = "/workspace/.cache"
  }

  readme = "Private development template managed by Terraform. Hardware and persistence are selected by workload profiles."
}

resource "runpod_pod" "lab" {
  name = "gpu-dev-workspace"
  # An official template is provider-owned. Project-owned images keep using the
  # private template Terraform creates above.
  template_id       = var.runpod_template_id != "" ? var.runpod_template_id : runpod_template.lab[0].id
  cloud_type        = var.cloud_type
  gpu_type_id       = var.gpu_type_id
  gpu_count         = var.gpu_count
  interruptible     = var.interruptible
  start_ssh         = true
  volume_in_gb      = var.persistent_storage ? var.volume_in_gb : null
  volume_mount_path = var.persistent_storage ? "/workspace" : null
}
